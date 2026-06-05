using ApiGateway.Auth;
using ApiGateway.Data;
using ApiGateway.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ApiGateway.Endpoints;

/// <summary>
/// Auto-cadastro de médico EXTERNO na rede social (ADR-031). A rede é só de
/// médicos verificados por CRM, então o signup VALIDA o CRM no CFM (Infosimples,
/// reusando <see cref="CfmClient"/>) antes de criar a conta. Cria usuario
/// (role='medico') + medico (crm_situacao do CFM) + social_perfis, e devolve o
/// MESMO token de sessão dos médicos da plataforma → o login depois é o
/// /api/v1/auth/login normal (interno e externo iguais).
///
/// clinical-safety/LGPD: só dado do próprio médico; nenhuma PII de paciente.
/// O CRM Regular é o gate de quem entra na rede.
/// </summary>
public static class RedeAuthEndpoints
{
    public static void Map(WebApplication app)
    {
        app.MapPost("/api/v1/auth/rede/signup", async (
            [FromBody] RedeSignupRequest req,
            AppDbContext db, IPasswordHasher hasher, TokenService tokens, CfmClient cfm) =>
        {
            var email = (req.Email ?? "").Trim().ToLowerInvariant();
            var nome = (req.Nome ?? "").Trim();
            var crm = (req.Crm ?? "").Trim();
            var uf = (req.Uf ?? "").Trim().ToUpperInvariant();

            if (nome.Length < 3 || string.IsNullOrWhiteSpace(email) || crm.Length == 0 || uf.Length != 2)
                return Results.BadRequest(new { error = "campos_obrigatorios" });
            if ((req.Senha ?? "").Length < 8)
                return Results.BadRequest(new { error = "senha_curta" });

            // Email único entre os usuários (médicos internos + externos).
            if (await db.Usuarios.AnyAsync(u => u.Email == email))
                return Results.Json(new { error = "email_em_uso", go = "/rede/login" }, statusCode: 409);

            // Gate de CRM (CFM via Infosimples). Erro de serviço ≠ CRM inválido.
            var v = await cfm.ValidarAsync(crm, uf, nome);
            if (v.Erro is not null)
            {
                if (v.Erro.StartsWith("INFOSIMPLES_TOKEN"))
                    return Results.Json(new { error = "crm_validacao_nao_configurada" }, statusCode: 500);
                return Results.Json(new { error = "cfm_indisponivel" }, statusCode: 503);
            }
            if (!v.Encontrado)
                return Results.Json(new { error = "crm_nao_confere" }, statusCode: 422);
            // Exige Regular. 'NaoValidado' só aparece quando CRM_VALIDATION_ENABLED=false (dev).
            if (v.Situacao != "Regular" && v.Situacao != "NaoValidado")
                return Results.Json(new { error = "crm_nao_regular", situacao = v.Situacao }, statusCode: 422);

            var senhaHash = hasher.Hash(req.Senha!);
            var nomeFinal = string.IsNullOrWhiteSpace(v.Nome) ? nome : v.Nome!;  // prefere o nome do CFM
            var handle = await GerarHandleUnicoAsync(db, email);

            await using var tx = await db.Database.BeginTransactionAsync();
            var usuarioId = await db.Database.ExecuteScalarAsync<Guid>(
                "INSERT INTO usuarios (email, senha_hash, nome, role) VALUES ({0},{1},{2},'medico') RETURNING id",
                email, senhaHash, nomeFinal);
            var medicoId = await db.Database.ExecuteScalarAsync<Guid>(@"
                INSERT INTO medicos (usuario_id, nome, crm, especialidade, crm_situacao, crm_validado_em, crm_fonte)
                VALUES ({0},{1},{2},{3},{4},NOW(),'infosimples') RETURNING id",
                usuarioId, nomeFinal, crm, v.Especialidade ?? "psiquiatria", v.Situacao ?? "NaoValidado");
            await db.Database.ExecuteSqlRawAsync(
                "INSERT INTO social_perfis (medico_id, handle) VALUES ({0},{1})", medicoId, handle);
            await tx.CommitAsync();

            var user = await db.Usuarios.FirstAsync(u => u.Id == usuarioId);
            var token = tokens.GenerateForUser(user);
            return Results.Ok(new { token, nome = nomeFinal, role = "medico", handle });
        })
        .AllowAnonymous()
        .WithTags("rede-auth")
        .WithSummary("Auto-cadastro de médico externo na rede social (valida CRM)");
    }

    /// <summary>Handle único a partir do e-mail (sanitizado); sufixa número se colidir.</summary>
    private static async Task<string> GerarHandleUnicoAsync(AppDbContext db, string email)
    {
        var bruto = email.Split('@')[0].ToLowerInvariant();
        var baseh = new string(bruto.Where(c => char.IsLetterOrDigit(c) || c is '.' or '_' or '-').ToArray());
        if (baseh.Length < 3) baseh = "dr" + baseh;
        if (baseh.Length > 24) baseh = baseh[..24];

        var handle = baseh;
        for (var i = 1; i < 1000; i++)
        {
            var emUso = await db.Database.ExistsAsync(
                "SELECT 1 FROM social_perfis WHERE handle = {0}", handle);
            if (!emUso) return handle;
            handle = $"{baseh}{i}";
        }
        return $"{baseh}{Guid.NewGuid():N}"[..28];
    }
}

public record RedeSignupRequest(string Nome, string Email, string Senha, string Crm, string Uf);
