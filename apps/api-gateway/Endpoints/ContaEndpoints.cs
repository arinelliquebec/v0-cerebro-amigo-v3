using Amazon.S3;
using Amazon.S3.Model;
using ApiGateway.Auth;
using ApiGateway.Data;
using ApiGateway.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;

// ADR-066 Fase 4 — extras do Portal do Psiquiatra (médico-facing, sem LLM):
//   Segurança:  trocar senha (logado) · esqueci-senha · redefinir-senha (anon)
//   Foto:       upload-url + set (S3 presigned, bucket dos docs)
//   LGPD:       exportar meus dados (JSON) · solicitar exclusão (soft, Regra 5)

namespace ApiGateway.Endpoints;

public static class ContaEndpoints
{
    public static void Map(WebApplication app)
    {
        var bucket = app.Configuration["S3_BUCKET_MEDICO_DOCS"] ?? "cerebro-amigo-medico-docs";

        // ── SEGURANÇA (logado) ───────────────────────────────────────────────
        app.MapPost("/api/v1/me/senha", async (
            [FromBody] TrocarSenhaReq req, AppDbContext db, IPasswordHasher hasher, ClaimsPrincipal user) =>
        {
            var sub = user.FindFirst("sub")?.Value;
            if (!Guid.TryParse(sub, out var userId)) return Results.Forbid();
            if (string.IsNullOrWhiteSpace(req.NovaSenha) || req.NovaSenha.Length < 8)
                return Results.BadRequest(new { error = "senha_curta" });

            var u = await db.Usuarios.FirstOrDefaultAsync(x => x.Id == userId);
            if (u is null) return Results.Forbid();
            if (!hasher.Verify(req.SenhaAtual ?? "", u.SenhaHash))
                return Results.BadRequest(new { error = "senha_atual_incorreta" });

            u.SenhaHash = hasher.Hash(req.NovaSenha);
            await db.SaveChangesAsync();
            return Results.NoContent();
        }).WithTags("conta").RequireAuthorization();

        // ── SEGURANÇA (anônimo): esqueci / redefinir senha ───────────────────
        // Reusa medico_invite_tokens com proposito='reset' (migration 0053).
        app.MapPost("/api/v1/auth/esqueci-senha", async (
            [FromBody] EsqueciSenhaReq req, AppDbContext db, ResendClient resend) =>
        {
            var emailNorm = (req.Email ?? "").Trim().ToLowerInvariant();
            // Anti-enumeração: SEMPRE 202, exista ou não a conta.
            if (string.IsNullOrWhiteSpace(emailNorm)) return Results.Accepted();

            var u = await db.Usuarios.FirstOrDefaultAsync(x => x.Email == emailNorm);
            if (u is not null && u.Role == "medico" && u.DesativadoEm is null)
            {
                var token = TokenAleatorio();
                await db.Database.ExecuteSqlRawAsync(@"
                    INSERT INTO medico_invite_tokens (usuario_id, token_hash, expira_em, proposito)
                    VALUES ({0}, {1}, NOW() + INTERVAL '1 hour', 'reset')",
                    u.Id, Sha256(token));

                var baseUrl = app.Configuration["PORTAL_PACIENTE_URL"] ?? "http://localhost:3000";
                var link = $"{baseUrl}/redefinir-senha?token={token}";
                var html = $"""
                    <p>Olá, {u.Nome}!</p>
                    <p>Recebemos um pedido para redefinir sua senha do <strong>Cérebro Amigo</strong>.</p>
                    <p><a href="{link}">Clique aqui para criar uma nova senha</a></p>
                    <p>O link vale por 1 hora. Se não foi você, ignore este e-mail.</p>
                    """;
                var txt = $"Redefina sua senha do Cérebro Amigo:\n{link}\n\nVálido por 1 hora.";
                try { await resend.SendAsync(emailNorm, "Redefinir senha — Cérebro Amigo", html, txt); }
                catch { /* best-effort: não revela falha ao cliente (anti-enum) */ }
            }
            return Results.Accepted();
        }).AllowAnonymous().WithTags("conta");

        app.MapPost("/api/v1/auth/redefinir-senha", async (
            [FromBody] RedefinirSenhaReq req, AppDbContext db, IPasswordHasher hasher) =>
        {
            if (string.IsNullOrWhiteSpace(req.Token) || string.IsNullOrWhiteSpace(req.NovaSenha))
                return Results.BadRequest(new { error = "dados_invalidos" });
            if (req.NovaSenha.Length < 8) return Results.BadRequest(new { error = "senha_curta" });

            var hash = Sha256(req.Token);
            var row = await db.Database.SqlQueryRaw<ResetTokenRow>(@"
                SELECT usuario_id::text AS usuario_id, expira_em, usado_em
                FROM medico_invite_tokens
                WHERE token_hash = {0} AND proposito = 'reset'", hash).FirstOrDefaultAsync();
            if (row is null) return Results.BadRequest(new { error = "token_invalido" });
            if (row.UsadoEm is not null) return Results.BadRequest(new { error = "token_ja_utilizado" });
            if (row.ExpiraEm < DateTime.UtcNow) return Results.StatusCode(410);

            await db.Database.ExecuteSqlRawAsync(
                "UPDATE usuarios SET senha_hash = {0} WHERE id = {1}::uuid", hasher.Hash(req.NovaSenha), row.UsuarioId);
            await db.Database.ExecuteSqlRawAsync(
                "UPDATE medico_invite_tokens SET usado_em = NOW() WHERE token_hash = {0}", hash);
            return Results.NoContent();
        }).AllowAnonymous().WithTags("conta");

        // ── FOTO DE PERFIL ───────────────────────────────────────────────────
        app.MapPost("/api/v1/me/foto/upload-url", async (
            [FromBody] FotoUploadReq req, AppDbContext db, ClaimsPrincipal user, IAmazonS3 s3) =>
        {
            var medicoId = await GetMedicoIdAsync(db, user);
            if (medicoId is null) return Results.Forbid();
            var ext = req.ContentType switch { "image/jpeg" => "jpg", "image/png" => "png", _ => "" };
            if (ext == "") return Results.BadRequest(new { error = "tipo_arquivo_invalido" });

            var key = $"medico/{medicoId.Value}/foto/{Guid.NewGuid()}.{ext}";
            var url = s3.GetPreSignedURL(new GetPreSignedUrlRequest
            {
                BucketName = bucket, Key = key, Verb = HttpVerb.PUT,
                Expires = DateTime.UtcNow.AddMinutes(15), ContentType = req.ContentType,
            });
            return Results.Ok(new { uploadUrl = url, s3Key = key });
        }).WithTags("conta").RequireAuthorization();

        app.MapPost("/api/v1/me/foto", async (
            [FromBody] FotoSetReq req, AppDbContext db, ClaimsPrincipal user) =>
        {
            var medicoId = await GetMedicoIdAsync(db, user);
            if (medicoId is null) return Results.Forbid();
            if (string.IsNullOrWhiteSpace(req.S3Key)
                || !req.S3Key.StartsWith($"medico/{medicoId.Value}/foto/", StringComparison.Ordinal))
                return Results.BadRequest(new { error = "s3key_invalida" });
            await db.Database.ExecuteSqlRawAsync(
                "UPDATE medicos SET foto_s3_key = {1} WHERE id = {0}", medicoId.Value, req.S3Key);
            return Results.NoContent();
        }).WithTags("conta").RequireAuthorization();

        // ── LGPD: exportar meus dados (só do médico; sem conteúdo clínico de paciente) ──
        app.MapGet("/api/v1/me/exportar", async (AppDbContext db, ClaimsPrincipal user) =>
        {
            var medicoId = await GetMedicoIdAsync(db, user);
            if (medicoId is null) return Results.Forbid();

            var perfil = await db.Database.SqlQueryRaw<ExportPerfil>(@"
                SELECT m.nome, u.email, m.crm, m.crm_uf, m.cpf, m.especialidade,
                       m.timezone, m.criado_em
                FROM medicos m JOIN usuarios u ON u.id = m.usuario_id
                WHERE m.id = {0}", medicoId.Value).FirstOrDefaultAsync();

            var assinatura = await db.Database.SqlQueryRaw<ExportAssinatura>(@"
                SELECT plano, valor_mensal, status, trial_ate, prazo_pagamento_ate
                FROM assinaturas WHERE medico_id = {0}", medicoId.Value).FirstOrDefaultAsync();

            var totalPacientes = await db.Database.ExecuteScalarAsync<long>(
                "SELECT COUNT(*) FROM pacientes WHERE medico_responsavel_id = {0}", medicoId.Value);

            return Results.Ok(new
            {
                geradoEm = DateTime.UtcNow,
                perfil,
                assinatura,
                contadores = new { pacientes = totalPacientes },
                observacao = "Exportação dos seus dados de cadastro (LGPD). Não inclui conteúdo clínico de pacientes."
            });
        }).WithTags("conta").RequireAuthorization();

        // ── LGPD: solicitar exclusão (soft — não apaga; admin processa; Regra 5) ──
        app.MapPost("/api/v1/me/exclusao", async (AppDbContext db, ClaimsPrincipal user) =>
        {
            var medicoId = await GetMedicoIdAsync(db, user);
            if (medicoId is null) return Results.Forbid();
            await db.Database.ExecuteSqlRawAsync(
                "UPDATE medicos SET exclusao_solicitada_em = COALESCE(exclusao_solicitada_em, NOW()) WHERE id = {0}",
                medicoId.Value);
            return Results.Accepted();
        }).WithTags("conta").RequireAuthorization();
    }

    private static string TokenAleatorio() =>
        Convert.ToBase64String(RandomNumberGenerator.GetBytes(32))
            .Replace("+", "-").Replace("/", "_").Replace("=", "");

    private static string Sha256(string input) =>
        Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(input))).ToLowerInvariant();

    private static async Task<Guid?> GetMedicoIdAsync(AppDbContext db, ClaimsPrincipal user)
    {
        var sub = user.FindFirst("sub")?.Value;
        if (!Guid.TryParse(sub, out var userId)) return null;
        return await db.Database.ExecuteScalarAsync<Guid?>(
            "SELECT id FROM medicos WHERE usuario_id = {0}", userId);
    }
}

public record TrocarSenhaReq(string? SenhaAtual, string NovaSenha);
public record EsqueciSenhaReq(string Email);
public record RedefinirSenhaReq(string Token, string NovaSenha);
public record FotoUploadReq(string ContentType);
public record FotoSetReq(string S3Key);
internal record ResetTokenRow(string UsuarioId, DateTime ExpiraEm, DateTime? UsadoEm);
public record ExportPerfil(
    string Nome, string Email, string? Crm, string? CrmUf, string? Cpf,
    string? Especialidade, string? Timezone, DateTime CriadoEm);
public record ExportAssinatura(
    string? Plano, decimal? ValorMensal, string? Status, DateTime? TrialAte, DateTime? PrazoPagamentoAte);
