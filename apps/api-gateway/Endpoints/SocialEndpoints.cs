using ApiGateway.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using System.Text.RegularExpressions;

namespace ApiGateway.Endpoints;

// =============================================================================
// Rede Social Cérebro Amigo (médicos verificados) — Onda 0 + feed básico.
//
// Domínio social é PÚBLICO entre médicos verificados (não é dado de paciente),
// portanto NÃO é escopado por tenant — diferente das tabelas clínicas. Ver
// ADR-026. Não chama LLM. Não armazena/loga PII de paciente (guard abaixo).
// =============================================================================
public static class SocialEndpoints
{
    public static void Map(WebApplication app)
    {
        var g = app.MapGroup("/api/v1/rede").WithTags("rede").RequireAuthorization();

        // ── Perfil do médico logado (cria sob demanda no 1º acesso) ──────────
        g.MapGet("/perfil/me", async (AppDbContext db, ClaimsPrincipal user) =>
        {
            var me = await ResolveMedico(db, user);
            if (me is null) return Results.Forbid();

            await EnsurePerfil(db, me);

            var dto = await db.Database.SqlQueryRaw<PerfilDto>(@"
                SELECT m.id AS medico_id, sp.handle, m.nome, m.crm, m.especialidade,
                       sp.bio, sp.foto_url, sp.capa_url, sp.cidade, sp.instituicao,
                       (m.crm_situacao = 'Regular') AS verificado,
                       COALESCE(a.plano, 'trial') AS plano,
                       (SELECT count(*) FROM social_follows f WHERE f.seguido_id = m.id)  AS seguidores,
                       (SELECT count(*) FROM social_follows f WHERE f.seguidor_id = m.id) AS seguindo,
                       (SELECT count(*) FROM social_posts p WHERE p.autor_medico_id = m.id AND p.status = 'ativo') AS posts
                FROM medicos m
                JOIN social_perfis sp ON sp.medico_id = m.id
                LEFT JOIN assinaturas a ON a.medico_id = m.id AND a.status IN ('ativa', 'trial')
                WHERE m.id = {0}",
                me.MedicoId).FirstOrDefaultAsync();

            return dto is null ? Results.Forbid() : Results.Ok(dto);
        })
        .WithSummary("Perfil social do médico logado");

        // ── Atualiza o próprio perfil ────────────────────────────────────────
        g.MapPut("/perfil", async (
            [FromBody] AtualizarPerfilSocialRequest req,
            AppDbContext db, ClaimsPrincipal user) =>
        {
            var me = await ResolveMedico(db, user);
            if (me is null) return Results.Forbid();
            await EnsurePerfil(db, me);

            // Handle opcional: só atualiza se enviado e válido.
            if (!string.IsNullOrWhiteSpace(req.Handle))
            {
                var handle = req.Handle.Trim().ToLowerInvariant();
                if (!Regex.IsMatch(handle, "^[a-z0-9._-]{3,30}$"))
                    return Results.BadRequest(new { error = "handle_invalido" });

                var emUso = await db.Database.SqlQueryRaw<int>(
                    "SELECT 1 FROM social_perfis WHERE handle = {0} AND medico_id <> {1} LIMIT 1",
                    handle, me.MedicoId).AnyAsync();
                if (emUso) return Results.Conflict(new { error = "handle_em_uso" });

                await db.Database.ExecuteSqlRawAsync(
                    "UPDATE social_perfis SET handle = {0} WHERE medico_id = {1}",
                    handle, me.MedicoId);
            }

            await db.Database.ExecuteSqlRawAsync(@"
                UPDATE social_perfis
                   SET bio = {0}, foto_url = {1}, capa_url = {2},
                       cidade = {3}, instituicao = {4}, atualizado_em = NOW()
                 WHERE medico_id = {5}",
                req.Bio, req.FotoUrl, req.CapaUrl, req.Cidade, req.Instituicao, me.MedicoId);

            return Results.NoContent();
        })
        .WithSummary("Atualiza o perfil social do médico logado");

        // ── Perfil público por handle ────────────────────────────────────────
        g.MapGet("/perfil/{handle}", async (
            string handle, AppDbContext db, ClaimsPrincipal user) =>
        {
            var me = await ResolveMedico(db, user);
            if (me is null) return Results.Forbid();

            var dto = await db.Database.SqlQueryRaw<PerfilPublicoDto>(@"
                SELECT m.id AS medico_id, sp.handle, m.nome, m.especialidade,
                       sp.bio, sp.foto_url, sp.capa_url, sp.cidade, sp.instituicao,
                       (m.crm_situacao = 'Regular') AS verificado,
                       COALESCE(a.plano, 'trial') AS plano,
                       (SELECT count(*) FROM social_follows f WHERE f.seguido_id = m.id)  AS seguidores,
                       (SELECT count(*) FROM social_follows f WHERE f.seguidor_id = m.id) AS seguindo,
                       (SELECT count(*) FROM social_posts p WHERE p.autor_medico_id = m.id AND p.status = 'ativo') AS posts,
                       EXISTS(SELECT 1 FROM social_follows f WHERE f.seguidor_id = {1} AND f.seguido_id = m.id) AS seguindo_eu,
                       (m.id = {1}) AS sou_eu
                FROM social_perfis sp
                JOIN medicos m ON m.id = sp.medico_id
                LEFT JOIN assinaturas a ON a.medico_id = m.id AND a.status IN ('ativa', 'trial')
                WHERE sp.handle = {0} AND sp.visivel = TRUE",
                handle.ToLowerInvariant(), me.MedicoId).FirstOrDefaultAsync();

            return dto is null ? Results.NotFound() : Results.Ok(dto);
        })
        .WithSummary("Perfil social público por handle");

        // ── Seguir / deixar de seguir (requer verificado) ────────────────────
        g.MapPost("/perfil/{medicoId:guid}/seguir", async (
            Guid medicoId, AppDbContext db, ClaimsPrincipal user) =>
        {
            var me = await ResolveMedico(db, user);
            if (me is null) return Results.Forbid();
            if (!Verificado(me)) return CrmNaoVerificado();
            if (medicoId == me.MedicoId) return Results.BadRequest(new { error = "nao_pode_seguir_a_si" });

            await db.Database.ExecuteSqlRawAsync(@"
                INSERT INTO social_follows (seguidor_id, seguido_id)
                VALUES ({0}, {1})
                ON CONFLICT (seguidor_id, seguido_id) DO NOTHING",
                me.MedicoId, medicoId);
            return Results.NoContent();
        })
        .WithSummary("Seguir um médico");

        g.MapDelete("/perfil/{medicoId:guid}/seguir", async (
            Guid medicoId, AppDbContext db, ClaimsPrincipal user) =>
        {
            var me = await ResolveMedico(db, user);
            if (me is null) return Results.Forbid();

            await db.Database.ExecuteSqlRawAsync(
                "DELETE FROM social_follows WHERE seguidor_id = {0} AND seguido_id = {1}",
                me.MedicoId, medicoId);
            return Results.NoContent();
        })
        .WithSummary("Deixar de seguir um médico");

        // ── Comunidades ──────────────────────────────────────────────────────
        g.MapGet("/comunidades", async (AppDbContext db) =>
        {
            var rows = await db.Database.SqlQueryRaw<ComunidadeDto>(
                "SELECT id, nome, slug, descricao, especialidade FROM social_comunidades ORDER BY ordem, nome")
                .ToListAsync();
            return Results.Ok(rows);
        })
        .WithSummary("Lista de comunidades");

        // ── Sugestões de quem seguir ──────────────────────────────────────────
        g.MapGet("/sugestoes", async (AppDbContext db, ClaimsPrincipal user, int? limite) =>
        {
            var me = await ResolveMedico(db, user);
            if (me is null) return Results.Forbid();

            var top = Math.Clamp(limite ?? 5, 1, 20);
            var rows = await db.Database.SqlQueryRaw<SugestaoDto>(@"
                SELECT m.id AS medico_id, COALESCE(sp.handle, '') AS handle,
                       m.nome, m.especialidade,
                       sp.foto_url, (m.crm_situacao = 'Regular') AS verificado,
                       (SELECT count(*) FROM social_follows f WHERE f.seguido_id = m.id) AS seguidores
                FROM medicos m
                LEFT JOIN social_perfis sp ON sp.medico_id = m.id
                WHERE m.crm_situacao = 'Regular'
                  AND m.id <> {0}
                  AND m.id NOT IN (SELECT seguido_id FROM social_follows WHERE seguidor_id = {0})
                ORDER BY seguidores DESC
                LIMIT {1}",
                me.MedicoId, top).ToListAsync();
            return Results.Ok(rows);
        })
        .WithSummary("Sugestões de médicos para seguir");

        // ── Feed ─────────────────────────────────────────────────────────────
        // escopo = descobrir (tudo) | seguindo (de quem o médico segue + ele mesmo)
        g.MapGet("/feed", async (
            AppDbContext db, ClaimsPrincipal user,
            string? escopo, string? comunidade, int? pagina) =>
        {
            var me = await ResolveMedico(db, user);
            if (me is null) return Results.Forbid();

            var p = Math.Max(0, (pagina ?? 0));
            const int limite = 20;
            var offset = p * limite;

            // Parâmetros posicionais: {0}=medicoId  {1}=limite  {2}=offset  {3}=slug
            var filtroSeguindo = escopo == "seguindo"
                ? "AND (p.autor_medico_id IN (SELECT seguido_id FROM social_follows WHERE seguidor_id = {0}) OR p.autor_medico_id = {0})"
                : "";
            var filtroComunidade = string.IsNullOrWhiteSpace(comunidade)
                ? ""
                : "AND c.slug = {3}";

            var sql = $@"
                SELECT p.id, p.corpo, p.criado_em,
                       m.id AS autor_id, COALESCE(sp.handle, '') AS autor_handle,
                       m.nome AS autor_nome, sp.foto_url AS autor_foto,
                       m.especialidade AS autor_especialidade,
                       (m.crm_situacao = 'Regular') AS autor_verificado,
                       c.nome AS comunidade_nome, c.slug AS comunidade_slug,
                       (SELECT count(*) FROM social_reacoes r WHERE r.alvo_tipo = 'post' AND r.alvo_id = p.id AND r.tipo = 'curtir') AS curtidas,
                       (SELECT count(*) FROM social_comentarios cm WHERE cm.post_id = p.id AND cm.status = 'ativo') AS comentarios,
                       EXISTS(SELECT 1 FROM social_reacoes r2 WHERE r2.alvo_tipo = 'post' AND r2.alvo_id = p.id AND r2.tipo = 'curtir' AND r2.medico_id = {0}) AS curtido,
                       (p.autor_medico_id = {0}) AS meu
                FROM social_posts p
                JOIN medicos m ON m.id = p.autor_medico_id
                LEFT JOIN social_perfis sp ON sp.medico_id = m.id
                LEFT JOIN social_comunidades c ON c.id = p.comunidade_id
                WHERE p.status = 'ativo' {filtroSeguindo} {filtroComunidade}
                ORDER BY p.criado_em DESC
                LIMIT {{1}} OFFSET {{2}}";

            // Sempre passa os 4 parâmetros; o slug ({3}) só é referenciado quando há filtro.
            object[] prms = string.IsNullOrWhiteSpace(comunidade)
                ? [me.MedicoId, limite, offset]
                : [me.MedicoId, limite, offset, comunidade];
            var rows = await db.Database.SqlQueryRaw<PostDto>(sql, prms).ToListAsync();
            return Results.Ok(rows);
        })
        .WithSummary("Feed de posts (descobrir | seguindo)");

        // ── Criar post (requer verificado + guard de PII) ────────────────────
        g.MapPost("/posts", async (
            [FromBody] CriarPostRequest req, AppDbContext db, ClaimsPrincipal user) =>
        {
            var me = await ResolveMedico(db, user);
            if (me is null) return Results.Forbid();
            if (!Verificado(me)) return CrmNaoVerificado();

            var corpo = (req.Corpo ?? "").Trim();
            if (corpo.Length == 0) return Results.BadRequest(new { error = "corpo_vazio" });
            if (corpo.Length > 5000) return Results.BadRequest(new { error = "corpo_muito_longo" });
            if (ContemPii(corpo)) return PiiBloqueado();

            await EnsurePerfil(db, me);

            var id = Guid.NewGuid();
            await db.Database.ExecuteSqlRawAsync(@"
                INSERT INTO social_posts (id, autor_medico_id, comunidade_id, corpo)
                VALUES ({0}, {1}, NULLIF({2}, '')::uuid, {3})",
                id, me.MedicoId, req.ComunidadeId?.ToString() ?? "", corpo);

            return Results.Created($"/api/v1/rede/posts/{id}", new { id });
        })
        .WithSummary("Cria um post no feed");

        // ── Remover post (autor; soft delete) ────────────────────────────────
        g.MapDelete("/posts/{id:guid}", async (
            Guid id, AppDbContext db, ClaimsPrincipal user) =>
        {
            var me = await ResolveMedico(db, user);
            if (me is null) return Results.Forbid();

            var afetados = await db.Database.ExecuteSqlRawAsync(
                "UPDATE social_posts SET status = 'removido', atualizado_em = NOW() WHERE id = {0} AND autor_medico_id = {1} AND status = 'ativo'",
                id, me.MedicoId);
            return afetados == 0 ? Results.NotFound() : Results.NoContent();
        })
        .WithSummary("Remove o próprio post");

        // ── Curtir / descurtir ───────────────────────────────────────────────
        g.MapPost("/posts/{id:guid}/curtir", async (
            Guid id, AppDbContext db, ClaimsPrincipal user) =>
        {
            var me = await ResolveMedico(db, user);
            if (me is null) return Results.Forbid();
            if (!Verificado(me)) return CrmNaoVerificado();

            await db.Database.ExecuteSqlRawAsync(@"
                INSERT INTO social_reacoes (alvo_tipo, alvo_id, medico_id, tipo)
                VALUES ('post', {0}, {1}, 'curtir')
                ON CONFLICT (alvo_tipo, alvo_id, medico_id, tipo) DO NOTHING",
                id, me.MedicoId);
            return Results.NoContent();
        })
        .WithSummary("Curtir um post");

        g.MapDelete("/posts/{id:guid}/curtir", async (
            Guid id, AppDbContext db, ClaimsPrincipal user) =>
        {
            var me = await ResolveMedico(db, user);
            if (me is null) return Results.Forbid();

            await db.Database.ExecuteSqlRawAsync(
                "DELETE FROM social_reacoes WHERE alvo_tipo = 'post' AND alvo_id = {0} AND medico_id = {1} AND tipo = 'curtir'",
                id, me.MedicoId);
            return Results.NoContent();
        })
        .WithSummary("Remover curtida de um post");

        // ── Comentários ──────────────────────────────────────────────────────
        g.MapGet("/posts/{id:guid}/comentarios", async (
            Guid id, AppDbContext db, ClaimsPrincipal user) =>
        {
            var me = await ResolveMedico(db, user);
            if (me is null) return Results.Forbid();

            var rows = await db.Database.SqlQueryRaw<ComentarioDto>(@"
                SELECT cm.id, cm.corpo, cm.criado_em, cm.parent_id,
                       m.id AS autor_id, COALESCE(sp.handle, '') AS autor_handle,
                       m.nome AS autor_nome, sp.foto_url AS autor_foto,
                       (m.crm_situacao = 'Regular') AS autor_verificado
                FROM social_comentarios cm
                JOIN medicos m ON m.id = cm.autor_medico_id
                LEFT JOIN social_perfis sp ON sp.medico_id = m.id
                WHERE cm.post_id = {0} AND cm.status = 'ativo'
                ORDER BY cm.criado_em ASC",
                id).ToListAsync();
            return Results.Ok(rows);
        })
        .WithSummary("Lista comentários de um post");

        g.MapPost("/posts/{id:guid}/comentarios", async (
            Guid id, [FromBody] CriarComentarioRequest req,
            AppDbContext db, ClaimsPrincipal user) =>
        {
            var me = await ResolveMedico(db, user);
            if (me is null) return Results.Forbid();
            if (!Verificado(me)) return CrmNaoVerificado();

            var corpo = (req.Corpo ?? "").Trim();
            if (corpo.Length == 0) return Results.BadRequest(new { error = "corpo_vazio" });
            if (corpo.Length > 2000) return Results.BadRequest(new { error = "corpo_muito_longo" });
            if (ContemPii(corpo)) return PiiBloqueado();

            var existe = await db.Database.SqlQueryRaw<int>(
                "SELECT 1 FROM social_posts WHERE id = {0} AND status = 'ativo' LIMIT 1", id).AnyAsync();
            if (!existe) return Results.NotFound();

            await EnsurePerfil(db, me);

            var novoId = Guid.NewGuid();
            await db.Database.ExecuteSqlRawAsync(@"
                INSERT INTO social_comentarios (id, post_id, autor_medico_id, corpo, parent_id)
                VALUES ({0}, {1}, {2}, {3}, NULLIF({4}, '')::uuid)",
                novoId, id, me.MedicoId, corpo, req.ParentId?.ToString() ?? "");

            return Results.Created($"/api/v1/rede/posts/{id}/comentarios/{novoId}", new { id = novoId });
        })
        .WithSummary("Comenta em um post");
    }

    // ─── Helpers ─────────────────────────────────────────────────────────────

    private static async Task<MedicoCtx?> ResolveMedico(AppDbContext db, ClaimsPrincipal user)
    {
        var sub = user.FindFirst("sub")?.Value;
        if (!Guid.TryParse(sub, out var usuarioId)) return null;

        return await db.Database.SqlQueryRaw<MedicoCtx>(@"
            SELECT m.id AS medico_id, m.nome, m.crm, m.especialidade, m.crm_situacao
            FROM medicos m
            WHERE m.usuario_id = {0}",
            usuarioId).FirstOrDefaultAsync();
    }

    private static bool Verificado(MedicoCtx me) =>
        string.Equals(me.CrmSituacao, "Regular", StringComparison.OrdinalIgnoreCase);

    private static IResult CrmNaoVerificado() =>
        Results.Json(new { error = "crm_nao_verificado" }, statusCode: 403);

    private static IResult PiiBloqueado() =>
        Results.Json(new { error = "pii_bloqueada" }, statusCode: 422);

    // Cria o perfil social se ainda não existir. Handle derivado do nome.
    private static async Task EnsurePerfil(AppDbContext db, MedicoCtx me)
    {
        var existe = await db.Database.SqlQueryRaw<int>(
            "SELECT 1 FROM social_perfis WHERE medico_id = {0} LIMIT 1", me.MedicoId).AnyAsync();
        if (existe) return;

        var handle = GerarHandle(me.Nome, me.MedicoId);
        await db.Database.ExecuteSqlRawAsync(@"
            INSERT INTO social_perfis (medico_id, handle)
            VALUES ({0}, {1})
            ON CONFLICT (medico_id) DO NOTHING",
            me.MedicoId, handle);
    }

    private static string GerarHandle(string nome, Guid medicoId)
    {
        var baseSlug = Regex.Replace(nome.Trim().ToLowerInvariant(), "[^a-z0-9]+", "-").Trim('-');
        if (baseSlug.Length > 22) baseSlug = baseSlug[..22].Trim('-');
        if (baseSlug.Length < 3) baseSlug = "dr";
        // Sufixo curto do id garante unicidade prática.
        var sufixo = medicoId.ToString("N")[..6];
        return $"{baseSlug}-{sufixo}";
    }

    // Guard mínimo de LGPD: bloqueia padrões óbvios de PII de paciente (CPF /
    // telefone). Não loga o conteúdo. Não substitui moderação (Onda 4).
    private static readonly Regex CpfRegex = new(@"\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b", RegexOptions.Compiled);
    private static readonly Regex TelefoneRegex = new(@"\b(?:\(?\d{2}\)?\s?)?9?\d{4}[-\s]?\d{4}\b", RegexOptions.Compiled);

    private static bool ContemPii(string texto) =>
        CpfRegex.IsMatch(texto) || TelefoneRegex.IsMatch(texto);
}

// ─── DTOs / Requests ─────────────────────────────────────────────────────────

internal record MedicoCtx(Guid MedicoId, string Nome, string? Crm, string? Especialidade, string? CrmSituacao);

public record PerfilDto(
    Guid MedicoId, string Handle, string Nome, string? Crm, string? Especialidade,
    string? Bio, string? FotoUrl, string? CapaUrl, string? Cidade, string? Instituicao,
    bool Verificado, string Plano, long Seguidores, long Seguindo, long Posts);

public record PerfilPublicoDto(
    Guid MedicoId, string Handle, string Nome, string? Especialidade,
    string? Bio, string? FotoUrl, string? CapaUrl, string? Cidade, string? Instituicao,
    bool Verificado, string Plano, long Seguidores, long Seguindo, long Posts,
    bool SeguindoEu, bool SouEu);

public record ComunidadeDto(Guid Id, string Nome, string Slug, string? Descricao, string? Especialidade);

public record SugestaoDto(
    Guid MedicoId, string Handle, string Nome, string? Especialidade,
    string? FotoUrl, bool Verificado, long Seguidores);

public record PostDto(
    Guid Id, string Corpo, DateTime CriadoEm,
    Guid AutorId, string AutorHandle, string AutorNome, string? AutorFoto,
    string? AutorEspecialidade, bool AutorVerificado,
    string? ComunidadeNome, string? ComunidadeSlug,
    long Curtidas, long Comentarios, bool Curtido, bool Meu);

public record ComentarioDto(
    Guid Id, string Corpo, DateTime CriadoEm, Guid? ParentId,
    Guid AutorId, string AutorHandle, string AutorNome, string? AutorFoto, bool AutorVerificado);

public record AtualizarPerfilSocialRequest(
    string? Handle, string? Bio, string? FotoUrl, string? CapaUrl, string? Cidade, string? Instituicao);

public record CriarPostRequest(string? Corpo, Guid? ComunidadeId);

public record CriarComentarioRequest(string? Corpo, Guid? ParentId);
