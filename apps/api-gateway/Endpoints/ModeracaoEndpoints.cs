using ApiGateway.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace ApiGateway.Endpoints;

// =============================================================================
// Moderação da Rede Social — Onda 4.
//
// Denúncias: qualquer médico verificado pode denunciar.
// Ações: somente moderadores (social_moderadores). APPEND-ONLY (regra #5).
// =============================================================================
public static class ModeracaoEndpoints
{
    private static readonly string[] MotivosValidos =
        ["spam", "assedio", "pii_paciente", "conduta_cfm", "outro"];

    private static readonly string[] AcoesValidas =
        ["ocultar", "remover", "avisar", "banir_comunidade"];

    public static void Map(WebApplication app)
    {
        var g = app.MapGroup("/api/v1/rede/moderacao").WithTags("moderacao").RequireAuthorization();

        // ── Denunciar conteúdo (qualquer médico verificado) ─────────────────
        g.MapPost("/denuncias", async (
            [FromBody] CriarDenunciaRequest req,
            AppDbContext db, ClaimsPrincipal user) =>
        {
            var me = await ResolveMedico(db, user);
            if (me is null) return Results.Forbid();
            if (!Verificado(me)) return CrmNaoVerificado();

            var motivo = (req.Motivo ?? "").Trim().ToLowerInvariant();
            if (!MotivosValidos.Contains(motivo))
                return Results.BadRequest(new { error = "motivo_invalido", validos = MotivosValidos });

            var alvoTipo = (req.AlvoTipo ?? "").Trim().ToLowerInvariant();
            if (!new[] { "post", "comentario", "mensagem", "perfil" }.Contains(alvoTipo))
                return Results.BadRequest(new { error = "alvo_tipo_invalido" });

            if (!Guid.TryParse(req.AlvoId, out var alvoId))
                return Results.BadRequest(new { error = "alvo_id_invalido" });

            var id = Guid.NewGuid();
            await db.Database.ExecuteSqlRawAsync(@"
                INSERT INTO social_denuncias (id, denunciante_id, alvo_tipo, alvo_id, motivo, detalhes)
                VALUES ({0}, {1}, {2}, {3}, {4}, NULLIF({5}, ''))",
                id, me.MedicoId, alvoTipo, alvoId, motivo, req.Detalhes?.Trim() ?? "");

            return Results.Created($"/api/v1/rede/moderacao/denuncias/{id}", new { id });
        })
        .WithSummary("Denuncia conteúdo da rede social");

        // ── Listar denúncias pendentes (moderador) ──────────────────────────
        g.MapGet("/denuncias", async (AppDbContext db, ClaimsPrincipal user, string? status) =>
        {
            var me = await ResolveMedico(db, user);
            if (me is null) return Results.Forbid();
            if (!await IsModerador(db, me.MedicoId)) return Results.Forbid();

            var filtroStatus = (status ?? "pendente").ToLowerInvariant();
            var rows = await db.Database.SqlQueryRaw<DenunciaDto>(@"
                SELECT d.id, d.alvo_tipo, d.alvo_id, d.motivo, d.detalhes, d.status, d.criado_em,
                       m.nome AS denunciante_nome, m.id AS denunciante_id
                FROM social_denuncias d
                JOIN medicos m ON m.id = d.denunciante_id
                WHERE d.status = {0}
                ORDER BY d.criado_em DESC
                LIMIT 50",
                filtroStatus).ToListAsync();

            return Results.Ok(rows);
        })
        .WithSummary("Lista denúncias (moderador)");

        // ── Executar ação de moderação (moderador) ──────────────────────────
        g.MapPost("/acoes", async (
            [FromBody] ExecutarAcaoRequest req,
            AppDbContext db, ClaimsPrincipal user) =>
        {
            var me = await ResolveMedico(db, user);
            if (me is null) return Results.Forbid();
            if (!await IsModerador(db, me.MedicoId)) return Results.Forbid();

            var acao = (req.Acao ?? "").Trim().ToLowerInvariant();
            if (!AcoesValidas.Contains(acao))
                return Results.BadRequest(new { error = "acao_invalida", validas = AcoesValidas });

            var alvoTipo = (req.AlvoTipo ?? "").Trim().ToLowerInvariant();
            if (!new[] { "post", "comentario", "mensagem", "perfil" }.Contains(alvoTipo))
                return Results.BadRequest(new { error = "alvo_tipo_invalido" });

            if (!Guid.TryParse(req.AlvoId, out var alvoId))
                return Results.BadRequest(new { error = "alvo_id_invalido" });

            // Registra ação — APPEND-ONLY.
            var acaoId = Guid.NewGuid();
            await db.Database.ExecuteSqlRawAsync(@"
                INSERT INTO social_moderacao_acoes (id, moderador_id, denuncia_id, alvo_tipo, alvo_id, acao, motivo)
                VALUES ({0}, {1}, NULLIF({2}, '')::uuid, {3}, {4}, {5}, NULLIF({6}, ''))",
                acaoId, me.MedicoId, req.DenunciaId ?? "", alvoTipo, alvoId, acao, req.Motivo?.Trim() ?? "");

            // Aplica efeito colateral (ocultar/remover o conteúdo).
            if (acao is "ocultar" or "remover")
            {
                var novoStatus = acao == "ocultar" ? "oculto" : "removido";
                if (alvoTipo == "post")
                    await db.Database.ExecuteSqlRawAsync(
                        "UPDATE social_posts SET status = {0}, atualizado_em = NOW() WHERE id = {1}",
                        novoStatus, alvoId);
                else if (alvoTipo == "comentario")
                    await db.Database.ExecuteSqlRawAsync(
                        "UPDATE social_comentarios SET status = {0} WHERE id = {1}",
                        novoStatus, alvoId);
                else if (alvoTipo == "mensagem")
                    await db.Database.ExecuteSqlRawAsync(
                        "UPDATE social_mensagens SET status = 'removido' WHERE id = {0}",
                        alvoId);
                else if (alvoTipo == "perfil")
                    await db.Database.ExecuteSqlRawAsync(
                        "UPDATE social_perfis SET visivel = FALSE WHERE medico_id = {0}",
                        alvoId);
            }

            // Marca denúncia como aceita (se vinculada).
            if (!string.IsNullOrEmpty(req.DenunciaId))
            {
                await db.Database.ExecuteSqlRawAsync(@"
                    UPDATE social_denuncias SET status = 'aceita', resolvido_por = {0}, resolvido_em = NOW()
                    WHERE id = {1}::uuid AND status = 'pendente'",
                    me.MedicoId, req.DenunciaId);
            }

            return Results.Created($"/api/v1/rede/moderacao/acoes/{acaoId}", new { id = acaoId });
        })
        .WithSummary("Executa ação de moderação (append-only)");

        // ── Histórico de ações (audit trail, moderador) ─────────────────────
        g.MapGet("/acoes", async (AppDbContext db, ClaimsPrincipal user) =>
        {
            var me = await ResolveMedico(db, user);
            if (me is null) return Results.Forbid();
            if (!await IsModerador(db, me.MedicoId)) return Results.Forbid();

            var rows = await db.Database.SqlQueryRaw<AcaoDto>(@"
                SELECT a.id, a.alvo_tipo, a.alvo_id, a.acao, a.motivo, a.criado_em,
                       m.nome AS moderador_nome, a.denuncia_id
                FROM social_moderacao_acoes a
                JOIN medicos m ON m.id = a.moderador_id
                ORDER BY a.criado_em DESC
                LIMIT 100").ToListAsync();

            return Results.Ok(rows);
        })
        .WithSummary("Histórico de ações de moderação (audit trail)");

        // ── Rejeitar denúncia (moderador) ───────────────────────────────────
        g.MapPatch("/denuncias/{id:guid}/rejeitar", async (
            Guid id, AppDbContext db, ClaimsPrincipal user) =>
        {
            var me = await ResolveMedico(db, user);
            if (me is null) return Results.Forbid();
            if (!await IsModerador(db, me.MedicoId)) return Results.Forbid();

            await db.Database.ExecuteSqlRawAsync(@"
                UPDATE social_denuncias SET status = 'rejeitada', resolvido_por = {0}, resolvido_em = NOW()
                WHERE id = {1} AND status = 'pendente'",
                me.MedicoId, id);

            return Results.NoContent();
        })
        .WithSummary("Rejeita uma denúncia");
    }

    // ─── Helpers ─────────────────────────────────────────────────────────────

    private static async Task<MedicoCtx?> ResolveMedico(AppDbContext db, ClaimsPrincipal user)
    {
        var sub = user.FindFirst("sub")?.Value;
        if (!Guid.TryParse(sub, out var usuarioId)) return null;
        return await db.Database.SqlQueryRaw<MedicoCtx>(@"
            SELECT m.id AS medico_id, m.nome, m.crm, m.especialidade, m.crm_situacao
            FROM medicos m WHERE m.usuario_id = {0}",
            usuarioId).FirstOrDefaultAsync();
    }

    private static bool Verificado(MedicoCtx me) =>
        string.Equals(me.CrmSituacao, "Regular", StringComparison.OrdinalIgnoreCase);

    private static IResult CrmNaoVerificado() =>
        Results.Json(new { error = "crm_nao_verificado" }, statusCode: 403);

    private static async Task<bool> IsModerador(AppDbContext db, Guid medicoId) =>
        await db.Database.SqlQueryRaw<int>(
            "SELECT 1 FROM social_moderadores WHERE medico_id = {0} LIMIT 1",
            medicoId).AnyAsync();
}

// ─── DTOs ────────────────────────────────────────────────────────────────────

public record CriarDenunciaRequest(string? AlvoTipo, string? AlvoId, string? Motivo, string? Detalhes);

public record ExecutarAcaoRequest(string? AlvoTipo, string? AlvoId, string? Acao, string? DenunciaId, string? Motivo);

public record DenunciaDto(
    Guid Id, string AlvoTipo, Guid AlvoId, string Motivo, string? Detalhes,
    string Status, DateTime CriadoEm, string DenuncianteNome, Guid DenuncianteId);

public record AcaoDto(
    Guid Id, string AlvoTipo, Guid AlvoId, string Acao, string? Motivo,
    DateTime CriadoEm, string ModeradorNome, Guid? DenunciaId);
