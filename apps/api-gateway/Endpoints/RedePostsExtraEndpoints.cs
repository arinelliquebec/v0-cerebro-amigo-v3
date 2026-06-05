using ApiGateway.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using System.Text.Json;
using System.Text.RegularExpressions;

namespace ApiGateway.Endpoints;

/// <summary>
/// Posts com FOTO + fila de aprovação (ADR-031). Post com mídia nasce
/// status='pendente' e só entra no feed (status='ativo') depois que um moderador
/// aprova — o feed do Devin já filtra status='ativo', então pendente fica
/// escondido sem mexer nele. Post só-texto continua pelo endpoint /posts normal
/// (publica direto). Reusa gate de CRM, guard de PII e social_moderadores.
/// </summary>
public static class RedePostsExtraEndpoints
{
    private static readonly Regex Cpf = new(@"\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b", RegexOptions.Compiled);
    private static readonly Regex Tel = new(@"\b(?:\(?\d{2}\)?\s?)?9?\d{4}[-\s]?\d{4}\b", RegexOptions.Compiled);

    public static void Map(WebApplication app)
    {
        var g = app.MapGroup("/api/v1/rede").WithTags("rede-foto").RequireAuthorization();

        // Criar post COM foto → 'pendente' (aguarda aprovação do admin/moderador).
        g.MapPost("/posts/com-foto", async (
            [FromBody] CriarPostFotoRequest req, AppDbContext db, ClaimsPrincipal user) =>
        {
            var me = await ResolveMedico(db, user);
            if (me is null) return Results.Forbid();
            if (!Verificado(me)) return Results.Json(new { error = "crm_nao_verificado" }, statusCode: 403);

            var corpo = (req.Corpo ?? "").Trim();
            if (corpo.Length > 5000) return Results.BadRequest(new { error = "corpo_muito_longo" });
            if (corpo.Length > 0 && (Cpf.IsMatch(corpo) || Tel.IsMatch(corpo)))
                return Results.Json(new { error = "pii_bloqueada" }, statusCode: 422);

            var keys = (req.Midias ?? [])
                .Where(k => !string.IsNullOrWhiteSpace(k)).Select(k => k.Trim()).ToList();
            if (keys.Count == 0) return Results.BadRequest(new { error = "sem_foto" });
            if (keys.Count > 4) return Results.BadRequest(new { error = "muitas_fotos" });
            // Só aceita keys do próprio médico (mintadas no foto-presign).
            var prefixo = $"posts/{me.MedicoId}/";
            if (keys.Any(k => !k.StartsWith(prefixo)))
                return Results.BadRequest(new { error = "midia_invalida" });

            var midiasJson = JsonSerializer.Serialize(keys.Select(k => new { tipo = "foto", key = k }));
            var id = Guid.NewGuid();
            await db.Database.ExecuteSqlRawAsync(@"
                INSERT INTO social_posts (id, autor_medico_id, comunidade_id, corpo, midias, status)
                VALUES ({0}, {1}, NULLIF({2}, '')::uuid, {3}, {4}::jsonb, 'pendente')",
                id, me.MedicoId, req.ComunidadeId?.ToString() ?? "", corpo, midiasJson);

            return Results.Created($"/api/v1/rede/posts/{id}", new { id, status = "pendente" });
        })
        .WithSummary("Cria post com foto (entra na fila de aprovação)");

        // ── Fila de aprovação (moderador / owner) ────────────────────────────
        var mod = app.MapGroup("/api/v1/rede/moderacao").WithTags("rede-foto").RequireAuthorization();

        mod.MapGet("/posts-pendentes", async (AppDbContext db, ClaimsPrincipal user) =>
        {
            var me = await ResolveMedico(db, user);
            if (me is null || !await IsModerador(db, me.MedicoId)) return Results.Forbid();
            var rows = await db.Database.SqlQueryRaw<PostPendenteDto>(@"
                SELECT p.id, p.corpo, p.midias::text AS midias, p.criado_em,
                       m.nome AS autor_nome, COALESCE(sp.handle, '') AS autor_handle
                FROM social_posts p
                JOIN medicos m ON m.id = p.autor_medico_id
                LEFT JOIN social_perfis sp ON sp.medico_id = m.id
                WHERE p.status = 'pendente'
                ORDER BY p.criado_em ASC LIMIT 50").ToListAsync();
            return Results.Ok(rows);
        })
        .WithSummary("Posts com foto aguardando aprovação");

        mod.MapPost("/posts/{id:guid}/aprovar", async (Guid id, AppDbContext db, ClaimsPrincipal user) =>
        {
            var me = await ResolveMedico(db, user);
            if (me is null || !await IsModerador(db, me.MedicoId)) return Results.Forbid();
            var n = await db.Database.ExecuteSqlRawAsync(
                "UPDATE social_posts SET status='ativo', atualizado_em=NOW() WHERE id={0} AND status='pendente'", id);
            return n == 0 ? Results.NotFound() : Results.NoContent();
        })
        .WithSummary("Aprova um post pendente");

        mod.MapPost("/posts/{id:guid}/rejeitar", async (Guid id, AppDbContext db, ClaimsPrincipal user) =>
        {
            var me = await ResolveMedico(db, user);
            if (me is null || !await IsModerador(db, me.MedicoId)) return Results.Forbid();
            var n = await db.Database.ExecuteSqlRawAsync(
                "UPDATE social_posts SET status='rejeitado', atualizado_em=NOW() WHERE id={0} AND status='pendente'", id);
            return n == 0 ? Results.NotFound() : Results.NoContent();
        })
        .WithSummary("Rejeita um post pendente");
    }

    private static async Task<MedicoCtx?> ResolveMedico(AppDbContext db, ClaimsPrincipal user)
    {
        var sub = user.FindFirst("sub")?.Value;
        if (!Guid.TryParse(sub, out var usuarioId)) return null;
        return await db.Database.SqlQueryRaw<MedicoCtx>(
            "SELECT m.id AS medico_id, m.nome, m.crm, m.especialidade, m.crm_situacao FROM medicos m WHERE m.usuario_id = {0}",
            usuarioId).FirstOrDefaultAsync();
    }

    private static bool Verificado(MedicoCtx me) =>
        string.Equals(me.CrmSituacao, "Regular", StringComparison.OrdinalIgnoreCase);

    private static Task<bool> IsModerador(AppDbContext db, Guid medicoId) =>
        db.Database.SqlQueryRaw<int>(
            "SELECT 1 FROM social_moderadores WHERE medico_id = {0} LIMIT 1", medicoId).AnyAsync();
}

public record CriarPostFotoRequest(string? Corpo, Guid? ComunidadeId, string[]? Midias);

public record PostPendenteDto(
    Guid Id, string Corpo, string? Midias, DateTime CriadoEm, string AutorNome, string AutorHandle);
