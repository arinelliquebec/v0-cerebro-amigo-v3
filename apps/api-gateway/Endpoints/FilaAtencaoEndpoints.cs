using ApiGateway.Data;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace ApiGateway.Endpoints;

/// <summary>
/// Fila de atenção do médico — uma lista única, ranqueada, do que precisa dele
/// AGORA. Agrega sinais que hoje vivem espalhados em widgets:
///   crise ativa &gt; escalação humana &gt; insight crítico/urgente &gt;
///   check-in perdido &gt; dose esquecida.
///
/// Tudo escopado ao médico (tenant). É só leitura agregada — as ações (visto,
/// descartar, retomar) usam os endpoints próprios de cada domínio.
/// </summary>
public static class FilaAtencaoEndpoints
{
    public static void Map(WebApplication app)
    {
        app.MapGet("/api/v1/fila-atencao", async (AppDbContext db, ClaimsPrincipal user) =>
        {
            var medicoId = await GetMedicoIdAsync(db, user);
            if (medicoId is null) return Results.Forbid();

            var rows = await db.Database.SqlQueryRaw<FilaItemDto>(@"
                WITH itens AS (
                    -- 1. Crise ativa (automação pausada) — prioridade máxima
                    SELECT 'crise' AS tipo, p.cliente_id AS paciente_id, cl.nome AS paciente_nome,
                           'critico' AS severidade,
                           'Crise — automação pausada' AS titulo,
                           COALESCE(pc.criado_em, p.criado_em) AS quando,
                           1 AS prioridade
                    FROM pacientes p
                    JOIN clientes cl ON cl.id = p.cliente_id
                    LEFT JOIN LATERAL (
                        SELECT criado_em FROM protocolos_crise_acionados
                        WHERE paciente_id = p.cliente_id ORDER BY criado_em DESC LIMIT 1
                    ) pc ON TRUE
                    WHERE p.medico_responsavel_id = {0} AND p.automacao_pausada = TRUE

                    UNION ALL
                    -- 2. Conversa escalada para atendimento humano
                    SELECT 'escalacao', cl.id, cl.nome, 'urgente',
                           'Conversa escalada para atendimento humano',
                           co.criada_em, 2
                    FROM conversas co
                    JOIN clientes cl ON cl.id = co.cliente_id
                    JOIN pacientes p ON p.cliente_id = co.cliente_id
                    WHERE p.medico_responsavel_id = {0} AND co.status = 'humano'

                    UNION ALL
                    -- 3. Insight crítico/urgente pendente (não visto, não descartado, válido)
                    SELECT 'insight', i.paciente_id, cl.nome, i.severidade,
                           i.titulo, i.criado_em,
                           CASE i.severidade WHEN 'critico' THEN 3 ELSE 4 END
                    FROM insights i
                    JOIN clientes cl ON cl.id = i.paciente_id
                    WHERE i.medico_id = {0}
                      AND i.severidade IN ('critico','urgente')
                      AND i.descartado_em IS NULL
                      AND i.visualizado_em IS NULL
                      AND (i.valido_ate IS NULL OR i.valido_ate > NOW())

                    UNION ALL
                    -- 4. Check-in expirado sem resposta (últimos 7 dias)
                    SELECT 'checkin_perdido', ch.paciente_id, cl.nome, 'atencao',
                           'Check-in não respondido', ch.expirado_em, 5
                    FROM checkins ch
                    JOIN clientes cl ON cl.id = ch.paciente_id
                    JOIN pacientes p ON p.cliente_id = ch.paciente_id
                    WHERE p.medico_responsavel_id = {0}
                      AND ch.respondido_em IS NULL
                      AND ch.expirado_em IS NOT NULL
                      AND ch.expirado_em < NOW()
                      AND ch.expirado_em > NOW() - INTERVAL '7 days'

                    UNION ALL
                    -- 5. Dose registrada como esquecida (últimos 3 dias)
                    SELECT 'nao_adesao', tm.paciente_id, cl.nome, 'atencao',
                           'Dose registrada como esquecida', tm.horario_previsto, 6
                    FROM tomadas_medicacao tm
                    JOIN clientes cl ON cl.id = tm.paciente_id
                    JOIN pacientes p ON p.cliente_id = tm.paciente_id
                    WHERE p.medico_responsavel_id = {0}
                      AND tm.status = 'esquecida'
                      AND tm.horario_previsto > NOW() - INTERVAL '3 days'
                )
                SELECT tipo, paciente_id, paciente_nome, severidade, titulo, quando
                FROM itens
                ORDER BY prioridade, quando DESC
                LIMIT 50",
                medicoId.Value).ToListAsync();

            return Results.Ok(rows);
        }).RequireAuthorization().WithTags("fila");
    }

    private static async Task<Guid?> GetMedicoIdAsync(AppDbContext db, ClaimsPrincipal user)
    {
        var sub = user.FindFirst("sub")?.Value;
        if (!Guid.TryParse(sub, out var userId)) return null;
        return await db.Database.ExecuteScalarAsync<Guid?>(
            "SELECT id FROM medicos WHERE usuario_id = {0}", userId);
    }
}

public record FilaItemDto(
    string Tipo, Guid PacienteId, string? PacienteNome,
    string Severidade, string Titulo, DateTime Quando);
