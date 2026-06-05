using ApiGateway.Data;
using ApiGateway.Hubs;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using System.Text.RegularExpressions;

namespace ApiGateway.Endpoints;

// =============================================================================
// Chat da Rede Social — endpoints REST.
// SignalR (ChatHub) distribui em tempo real; estes endpoints fazem o CRUD.
// Gate: crm_situacao = 'Regular' em toda escrita. PII guard no corpo.
// =============================================================================
public static class ChatEndpoints
{
    public static void Map(WebApplication app)
    {
        var g = app.MapGroup("/api/v1/rede/chat").WithTags("chat").RequireAuthorization();

        // ── Listar conversas do médico logado (com preview) ─────────────────
        g.MapGet("/conversas", async (AppDbContext db, ClaimsPrincipal user) =>
        {
            var me = await ResolveMedicoChat(db, user);
            if (me is null) return Results.Forbid();

            var rows = await db.Database.SqlQueryRaw<ConversaPreviewDto>(@"
                SELECT c.id, c.tipo, c.nome, c.foto_url,
                       (SELECT sm.corpo FROM social_mensagens sm
                        WHERE sm.conversa_id = c.id AND sm.status = 'ativo'
                        ORDER BY sm.criado_em DESC LIMIT 1) AS ultima_mensagem,
                       (SELECT sm.criado_em FROM social_mensagens sm
                        WHERE sm.conversa_id = c.id AND sm.status = 'ativo'
                        ORDER BY sm.criado_em DESC LIMIT 1) AS ultima_mensagem_em,
                       (SELECT sm.autor_medico_id FROM social_mensagens sm
                        WHERE sm.conversa_id = c.id AND sm.status = 'ativo'
                        ORDER BY sm.criado_em DESC LIMIT 1) AS ultimo_autor_id,
                       (SELECT count(*) FROM social_mensagens sm
                        WHERE sm.conversa_id = c.id AND sm.status = 'ativo'
                          AND sm.criado_em > COALESCE(cm.ultima_leitura_em, cm.entrou_em)) AS nao_lidas,
                       cm.ultima_leitura_em
                FROM social_conversa_membros cm
                JOIN social_conversas c ON c.id = cm.conversa_id
                WHERE cm.medico_id = {0}
                ORDER BY COALESCE(
                    (SELECT sm2.criado_em FROM social_mensagens sm2
                     WHERE sm2.conversa_id = c.id AND sm2.status = 'ativo'
                     ORDER BY sm2.criado_em DESC LIMIT 1),
                    c.criado_em) DESC",
                me.MedicoId).ToListAsync();

            return Results.Ok(rows);
        })
        .WithSummary("Conversas do médico logado");

        // ── Criar conversa (DM ou grupo) ───────────────────────────────────
        g.MapPost("/conversas", async (
            [FromBody] CriarConversaRequest req,
            AppDbContext db, ClaimsPrincipal user) =>
        {
            var me = await ResolveMedicoChat(db, user);
            if (me is null) return Results.Forbid();
            if (!Verificado(me)) return CrmNaoVerificado();

            var tipo = (req.Tipo ?? "dm").ToLowerInvariant();
            if (tipo != "dm" && tipo != "grupo")
                return Results.BadRequest(new { error = "tipo_invalido" });

            var membrosIds = (req.Membros ?? [])
                .Where(id => Guid.TryParse(id, out _) && id != me.MedicoId.ToString())
                .Distinct()
                .ToList();

            if (membrosIds.Count == 0)
                return Results.BadRequest(new { error = "membros_vazio" });

            // DM: verifica se já existe conversa 1:1 entre esses dois.
            if (tipo == "dm")
            {
                if (membrosIds.Count != 1)
                    return Results.BadRequest(new { error = "dm_requer_um_membro" });

                var outroId = Guid.Parse(membrosIds[0]);
                var existente = await db.Database.SqlQueryRaw<ConversaIdDto>(@"
                    SELECT c.id
                    FROM social_conversas c
                    WHERE c.tipo = 'dm'
                      AND EXISTS(SELECT 1 FROM social_conversa_membros m1 WHERE m1.conversa_id = c.id AND m1.medico_id = {0})
                      AND EXISTS(SELECT 1 FROM social_conversa_membros m2 WHERE m2.conversa_id = c.id AND m2.medico_id = {1})
                    LIMIT 1",
                    me.MedicoId, outroId).FirstOrDefaultAsync();

                if (existente is not null)
                    return Results.Ok(new { id = existente.Id, existente = true });
            }

            if (tipo == "grupo" && string.IsNullOrWhiteSpace(req.Nome))
                return Results.BadRequest(new { error = "nome_obrigatorio_para_grupo" });

            // Premium gate: criar grupo requer plano pro ou enterprise.
            if (tipo == "grupo" && !await PlanoPremium(db, me.MedicoId))
                return Results.Json(new { error = "plano_insuficiente", minimo = "pro" }, statusCode: 403);

            var conversaId = Guid.NewGuid();
            await db.Database.ExecuteSqlRawAsync(@"
                INSERT INTO social_conversas (id, tipo, nome)
                VALUES ({0}, {1}, NULLIF({2}, ''))",
                conversaId, tipo, req.Nome?.Trim() ?? "");

            // Adiciona o criador como admin.
            await db.Database.ExecuteSqlRawAsync(@"
                INSERT INTO social_conversa_membros (conversa_id, medico_id, role)
                VALUES ({0}, {1}, 'admin')",
                conversaId, me.MedicoId);

            // Adiciona demais membros.
            foreach (var membroIdStr in membrosIds)
            {
                var membroId = Guid.Parse(membroIdStr);
                await db.Database.ExecuteSqlRawAsync(@"
                    INSERT INTO social_conversa_membros (conversa_id, medico_id, role)
                    VALUES ({0}, {1}, 'membro')
                    ON CONFLICT DO NOTHING",
                    conversaId, membroId);
            }

            return Results.Created($"/api/v1/rede/chat/conversas/{conversaId}", new { id = conversaId, existente = false });
        })
        .WithSummary("Cria conversa DM ou grupo");

        // ── Mensagens de uma conversa (paginado) ───────────────────────────
        g.MapGet("/conversas/{conversaId:guid}/mensagens", async (
            Guid conversaId, AppDbContext db, ClaimsPrincipal user, int? pagina) =>
        {
            var me = await ResolveMedicoChat(db, user);
            if (me is null) return Results.Forbid();

            // Verifica se é membro.
            var eMembro = await db.Database.SqlQueryRaw<int>(
                "SELECT 1 FROM social_conversa_membros WHERE conversa_id = {0} AND medico_id = {1} LIMIT 1",
                conversaId, me.MedicoId).AnyAsync();
            if (!eMembro) return Results.Forbid();

            var p = Math.Max(0, pagina ?? 0);
            const int limite = 50;
            var offset = p * limite;

            var rows = await db.Database.SqlQueryRaw<MensagemDto>(@"
                SELECT sm.id, sm.corpo, sm.tipo_conteudo, sm.criado_em,
                       m.id AS autor_id, COALESCE(sp.handle, '') AS autor_handle,
                       m.nome AS autor_nome, sp.foto_url AS autor_foto,
                       (m.crm_situacao = 'Regular') AS autor_verificado,
                       (sm.autor_medico_id = {2}) AS minha
                FROM social_mensagens sm
                JOIN medicos m ON m.id = sm.autor_medico_id
                LEFT JOIN social_perfis sp ON sp.medico_id = m.id
                WHERE sm.conversa_id = {0} AND sm.status = 'ativo'
                ORDER BY sm.criado_em DESC
                LIMIT {3} OFFSET {4}",
                conversaId, me.MedicoId, me.MedicoId, limite, offset).ToListAsync();

            return Results.Ok(rows);
        })
        .WithSummary("Mensagens de uma conversa (paginado, mais recentes primeiro)");

        // ── Enviar mensagem (grava + broadcast SignalR) ─────────────────────
        g.MapPost("/conversas/{conversaId:guid}/mensagens", async (
            Guid conversaId, [FromBody] EnviarMensagemRequest req,
            AppDbContext db, ClaimsPrincipal user,
            IHubContext<ChatHub> hub) =>
        {
            var me = await ResolveMedicoChat(db, user);
            if (me is null) return Results.Forbid();
            if (!Verificado(me)) return CrmNaoVerificado();

            var corpo = (req.Corpo ?? "").Trim();
            if (corpo.Length == 0) return Results.BadRequest(new { error = "corpo_vazio" });
            if (corpo.Length > 5000) return Results.BadRequest(new { error = "corpo_muito_longo" });
            if (ContemPii(corpo)) return PiiBloqueado();

            // Verifica se é membro.
            var eMembro = await db.Database.SqlQueryRaw<int>(
                "SELECT 1 FROM social_conversa_membros WHERE conversa_id = {0} AND medico_id = {1} LIMIT 1",
                conversaId, me.MedicoId).AnyAsync();
            if (!eMembro) return Results.Forbid();

            var msgId = Guid.NewGuid();
            await db.Database.ExecuteSqlRawAsync(@"
                INSERT INTO social_mensagens (id, conversa_id, autor_medico_id, corpo)
                VALUES ({0}, {1}, {2}, {3})",
                msgId, conversaId, me.MedicoId, corpo);

            // Atualiza ultima_leitura do remetente.
            await db.Database.ExecuteSqlRawAsync(@"
                UPDATE social_conversa_membros SET ultima_leitura_em = NOW()
                WHERE conversa_id = {0} AND medico_id = {1}",
                conversaId, me.MedicoId);

            // Broadcast via SignalR.
            var payload = new
            {
                id = msgId,
                conversaId,
                autorId = me.MedicoId,
                autorNome = me.Nome,
                corpo,
                criadoEm = DateTime.UtcNow,
            };
            await hub.Clients.Group($"chat:{conversaId}").SendAsync("NovaMensagem", payload);

            return Results.Created($"/api/v1/rede/chat/conversas/{conversaId}/mensagens/{msgId}", new { id = msgId });
        })
        .WithSummary("Envia mensagem em uma conversa");

        // ── Marcar como lido ────────────────────────────────────────────────
        g.MapPatch("/conversas/{conversaId:guid}/leitura", async (
            Guid conversaId, AppDbContext db, ClaimsPrincipal user) =>
        {
            var me = await ResolveMedicoChat(db, user);
            if (me is null) return Results.Forbid();

            await db.Database.ExecuteSqlRawAsync(@"
                UPDATE social_conversa_membros SET ultima_leitura_em = NOW()
                WHERE conversa_id = {0} AND medico_id = {1}",
                conversaId, me.MedicoId);
            return Results.NoContent();
        })
        .WithSummary("Marca conversa como lida");

        // ── Detalhes da conversa (membros) ──────────────────────────────────
        g.MapGet("/conversas/{conversaId:guid}", async (
            Guid conversaId, AppDbContext db, ClaimsPrincipal user) =>
        {
            var me = await ResolveMedicoChat(db, user);
            if (me is null) return Results.Forbid();

            var eMembro = await db.Database.SqlQueryRaw<int>(
                "SELECT 1 FROM social_conversa_membros WHERE conversa_id = {0} AND medico_id = {1} LIMIT 1",
                conversaId, me.MedicoId).AnyAsync();
            if (!eMembro) return Results.Forbid();

            var membros = await db.Database.SqlQueryRaw<MembroDto>(@"
                SELECT m.id AS medico_id, COALESCE(sp.handle, '') AS handle,
                       m.nome, m.especialidade, sp.foto_url,
                       (m.crm_situacao = 'Regular') AS verificado,
                       cm.role, cm.entrou_em
                FROM social_conversa_membros cm
                JOIN medicos m ON m.id = cm.medico_id
                LEFT JOIN social_perfis sp ON sp.medico_id = m.id
                WHERE cm.conversa_id = {0}
                ORDER BY cm.entrou_em",
                conversaId).ToListAsync();

            var conv = await db.Database.SqlQueryRaw<ConversaInfoDto>(@"
                SELECT id, tipo, nome, foto_url, criado_em
                FROM social_conversas WHERE id = {0}",
                conversaId).FirstOrDefaultAsync();

            return Results.Ok(new { conversa = conv, membros });
        })
        .WithSummary("Detalhes e membros de uma conversa");
    }

    // ─── Helpers (reutilizados de SocialEndpoints via static, ou redefinidos) ──

    private static async Task<MedicoCtx?> ResolveMedicoChat(AppDbContext db, ClaimsPrincipal user)
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

    private static readonly Regex CpfRegex = new(@"\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b", RegexOptions.Compiled);
    private static readonly Regex TelefoneRegex = new(@"\b(?:\(?\d{2}\)?\s?)?9?\d{4}[-\s]?\d{4}\b", RegexOptions.Compiled);

    private static bool ContemPii(string texto) =>
        CpfRegex.IsMatch(texto) || TelefoneRegex.IsMatch(texto);

    private static async Task<bool> PlanoPremium(AppDbContext db, Guid medicoId) =>
        await db.Database.SqlQueryRaw<int>(
            "SELECT 1 FROM assinaturas WHERE medico_id = {0} AND status = 'ativa' AND plano IN ('pro', 'enterprise') LIMIT 1",
            medicoId).AnyAsync();
}

// ─── DTOs do Chat ────────────────────────────────────────────────────────────

public record ConversaPreviewDto(
    Guid Id, string Tipo, string? Nome, string? FotoUrl,
    string? UltimaMensagem, DateTime? UltimaMensagemEm, Guid? UltimoAutorId,
    long NaoLidas, DateTime? UltimaLeituraEm);

public record ConversaIdDto(Guid Id);

public record ConversaInfoDto(Guid Id, string Tipo, string? Nome, string? FotoUrl, DateTime CriadoEm);

public record MensagemDto(
    Guid Id, string Corpo, string TipoConteudo, DateTime CriadoEm,
    Guid AutorId, string AutorHandle, string AutorNome, string? AutorFoto,
    bool AutorVerificado, bool Minha);

public record MembroDto(
    Guid MedicoId, string Handle, string Nome, string? Especialidade,
    string? FotoUrl, bool Verificado, string Role, DateTime EntrouEm);

public record CriarConversaRequest(string? Tipo, string? Nome, string[]? Membros);

public record EnviarMensagemRequest(string? Corpo);
