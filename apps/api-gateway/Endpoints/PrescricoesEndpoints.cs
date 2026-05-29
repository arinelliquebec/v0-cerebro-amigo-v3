using ApiGateway.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace ApiGateway.Endpoints;

/// <summary>
/// Endpoints de prescrição. Médico adiciona, troca, ajusta, encerra.
/// Cada ação grava um evento em prescricao_eventos (timeline clínica).
/// </summary>
public static class PrescricoesEndpoints
{
    public static void Map(WebApplication app)
    {
        var g = app.MapGroup("/api/v1/prescricoes")
            .WithTags("prescricoes")
            .RequireAuthorization();

        // timestamptz exige Kind=Utc; o JSON entrega Unspecified.
        static DateTime? ToUtc(DateTime? dt) =>
            dt.HasValue ? DateTime.SpecifyKind(dt.Value, DateTimeKind.Utc) : null;

        // ---- lista de prescrições do paciente ----
        g.MapGet("/paciente/{pacienteId:guid}", async (Guid pacienteId, AppDbContext db) =>
        {
            var rows = await db.Database.SqlQueryRaw<PrescricaoDto>(@"
                SELECT id, paciente_id, medicamento, dose_descricao,
                       horarios, inicio_em, fim_em,
                       receita_tipo, receita_validade,
                       observacoes, ativa, criada_em
                FROM prescricoes WHERE paciente_id = {0}
                ORDER BY ativa DESC, criada_em DESC", pacienteId).ToListAsync();
            return Results.Ok(rows);
        });

        // ---- histórico/timeline de eventos do paciente ----
        g.MapGet("/paciente/{pacienteId:guid}/historico", async (Guid pacienteId, AppDbContext db) =>
        {
            try
            {
                var rows = await db.Database.SqlQueryRaw<EventoPrescricaoDto>(@"
                    SELECT id, tipo, medicamento, medicamento_anterior, motivo, criado_em
                    FROM prescricao_eventos
                    WHERE paciente_id = {0}
                    ORDER BY criado_em DESC", pacienteId).ToListAsync();
                return Results.Ok(rows);
            }
            catch
            {
                return Results.Ok(Array.Empty<EventoPrescricaoDto>());
            }
        });

        // ---- criar (adição) ou trocar ----
        g.MapPost("/", async ([FromBody] CriarPrescricaoRequest req, AppDbContext db, ClaimsPrincipal user) =>
        {
            var medicoId = await ResolveMedicoId(db, user);
            if (medicoId is null) return Results.Forbid();

            var horariosArray = req.Horarios.Select(h => TimeOnly.Parse(h)).ToArray();

            var prescricaoId = await db.Database.ExecuteScalarAsync<Guid>(@"
                INSERT INTO prescricoes
                  (paciente_id, medico_id, medicamento, dose_descricao, horarios,
                   inicio_em, fim_em, receita_tipo, receita_validade, observacoes)
                VALUES ({0}, {1}, {2}, {3}, {4}, {5}, {6}, {7}, {8}, {9})
                RETURNING id",
                req.PacienteId, medicoId, req.Medicamento, req.DoseDescricao, horariosArray,
                ToUtc(req.InicioEm) ?? DateTime.UtcNow.Date,
                (object?)ToUtc(req.FimEm) ?? DBNull.Value,
                (object?)req.ReceitaTipo ?? DBNull.Value,
                (object?)ToUtc(req.ReceitaValidade) ?? DBNull.Value,
                (object?)req.Observacoes ?? DBNull.Value);

            if (req.SubstituiPrescricaoId is Guid antigaId)
            {
                var medAntiga = await db.Database.ExecuteScalarAsync<string?>(
                    "SELECT medicamento FROM prescricoes WHERE id = {0}", antigaId);
                await db.Database.ExecuteSqlRawAsync(
                    "UPDATE prescricoes SET ativa = FALSE, fim_em = CURRENT_DATE WHERE id = {0}", antigaId);
                await GravarEvento(db, req.PacienteId, medicoId, prescricaoId,
                    "troca", req.Medicamento, medAntiga, req.Motivo);
            }
            else
            {
                await GravarEvento(db, req.PacienteId, medicoId, prescricaoId,
                    "adicao", req.Medicamento, null, req.Motivo);
            }

            return Results.Created($"/api/v1/prescricoes/{prescricaoId}", null);
        });

        // ---- editar (ajuste) ----
        g.MapPut("/{id:guid}", async (Guid id, [FromBody] EditarPrescricaoRequest req, AppDbContext db, ClaimsPrincipal user) =>
        {
            var horariosArray = req.Horarios.Select(h => TimeOnly.Parse(h)).ToArray();

            var linhas = await db.Database.ExecuteSqlRawAsync(@"
                UPDATE prescricoes SET
                  medicamento = {1}, dose_descricao = {2}, horarios = {3},
                  inicio_em = {4}, fim_em = {5}, receita_tipo = {6},
                  receita_validade = {7}, observacoes = {8}
                WHERE id = {0} AND ativa = TRUE",
                id, req.Medicamento, req.DoseDescricao, horariosArray,
                ToUtc(req.InicioEm) ?? DateTime.UtcNow.Date,
                (object?)ToUtc(req.FimEm) ?? DBNull.Value,
                (object?)req.ReceitaTipo ?? DBNull.Value,
                (object?)ToUtc(req.ReceitaValidade) ?? DBNull.Value,
                (object?)req.Observacoes ?? DBNull.Value);

            if (linhas == 0) return Results.NotFound();

            var medicoId = await ResolveMedicoId(db, user);
            var pacienteId = await db.Database.ExecuteScalarAsync<Guid>(
                "SELECT paciente_id FROM prescricoes WHERE id = {0}", id);
            await GravarEvento(db, pacienteId, medicoId, id, "ajuste", req.Medicamento, null, req.Motivo);

            return Results.NoContent();
        });

        // ---- desativar (remoção) ----
        g.MapPatch("/{id:guid}/desativar", async (Guid id, HttpRequest http, AppDbContext db, ClaimsPrincipal user) =>
        {
            string? motivo = null;
            if (http.ContentLength is > 0)
            {
                try
                {
                    var body = await http.ReadFromJsonAsync<DesativarPrescricaoRequest>();
                    motivo = body?.Motivo;
                }
                catch { /* sem corpo -> motivo null */ }
            }

            var pacienteId = await db.Database.ExecuteScalarAsync<Guid?>(
                "SELECT paciente_id FROM prescricoes WHERE id = {0}", id);
            if (pacienteId is null) return Results.NotFound();
            var medicamento = await db.Database.ExecuteScalarAsync<string?>(
                "SELECT medicamento FROM prescricoes WHERE id = {0}", id);

            await db.Database.ExecuteSqlRawAsync(
                "UPDATE prescricoes SET ativa = FALSE, fim_em = CURRENT_DATE WHERE id = {0}", id);

            var medicoId = await ResolveMedicoId(db, user);
            await GravarEvento(db, pacienteId.Value, medicoId, id,
                "remocao", medicamento ?? "(medicamento)", null, motivo);

            return Results.NoContent();
        });
    }

    static async Task<Guid?> ResolveMedicoId(AppDbContext db, ClaimsPrincipal user)
    {
        var sub = user.FindFirst("sub")?.Value;
        if (!Guid.TryParse(sub, out var userId)) return null;
        return await db.Database.ExecuteScalarAsync<Guid?>(
            "SELECT id FROM medicos WHERE usuario_id = {0}", userId);
    }

    static async Task GravarEvento(
        AppDbContext db, Guid pacienteId, Guid? medicoId, Guid? prescricaoId,
        string tipo, string medicamento, string? medicamentoAnterior, string? motivo)
    {
        try
        {
            await db.Database.ExecuteSqlRawAsync(@"
                INSERT INTO prescricao_eventos
                  (paciente_id, medico_id, prescricao_id, tipo, medicamento, medicamento_anterior, motivo)
                VALUES ({0}, {1}, {2}, {3}, {4}, {5}, {6})",
                pacienteId,
                (object?)medicoId ?? DBNull.Value,
                (object?)prescricaoId ?? DBNull.Value,
                tipo,
                medicamento,
                (object?)medicamentoAnterior ?? DBNull.Value,
                (object?)motivo ?? DBNull.Value);
        }
        catch (Exception ex)
        {
            // Evento e auditoria: nao deve derrubar o fluxo de prescricao.
            // Ex.: tabela ainda nao migrada no banco de destino.
            Console.Error.WriteLine($"[prescricao_eventos] falha ao gravar evento ({tipo}): {ex.Message}");
        }
    }
}

public record CriarPrescricaoRequest(
    Guid PacienteId,
    string Medicamento,
    string DoseDescricao,
    List<string> Horarios,
    DateTime? InicioEm,
    DateTime? FimEm,
    string? ReceitaTipo,
    DateTime? ReceitaValidade,
    string? Observacoes,
    string? Motivo = null,
    Guid? SubstituiPrescricaoId = null);

public record EditarPrescricaoRequest(
    string Medicamento,
    string DoseDescricao,
    List<string> Horarios,
    DateTime? InicioEm,
    DateTime? FimEm,
    string? ReceitaTipo,
    DateTime? ReceitaValidade,
    string? Observacoes,
    string? Motivo = null);

public record DesativarPrescricaoRequest(string? Motivo);

public record PrescricaoDto(
    Guid Id, Guid PacienteId, string Medicamento, string DoseDescricao,
    TimeOnly[] Horarios, DateTime InicioEm, DateTime? FimEm,
    string? ReceitaTipo, DateTime? ReceitaValidade,
    string? Observacoes, bool Ativa, DateTime CriadaEm);

public record EventoPrescricaoDto(
    Guid Id, string Tipo, string Medicamento,
    string? MedicamentoAnterior, string? Motivo, DateTime CriadoEm);


// =============================================================================

/// <summary>
/// Notificações pro médico.
/// </summary>
public static class NotificacoesEndpoints
{
    public static void Map(WebApplication app)
    {
        var g = app.MapGroup("/api/v1/notificacoes")
            .WithTags("notificacoes")
            .RequireAuthorization();

        g.MapGet("/", async (AppDbContext db, ClaimsPrincipal user,
            [FromQuery] bool apenasNaoLidas = true,
            [FromQuery] bool apenasLidas = false) =>
        {
            var sub = user.FindFirst("sub")?.Value;
            if (!Guid.TryParse(sub, out var userId)) return Results.Unauthorized();

            var medicoId = await db.Database.ExecuteScalarAsync<Guid?>(
                "SELECT id FROM medicos WHERE usuario_id = {0}", userId);
            if (medicoId is null) return Results.Forbid();

            string filtroLida;
            string orderBy;
            if (apenasLidas)
            {
                filtroLida = "AND n.lida = TRUE";
                orderBy = "n.lida_em DESC NULLS LAST, n.criada_em DESC";
            }
            else if (apenasNaoLidas)
            {
                filtroLida = "AND n.lida = FALSE";
                orderBy = @"CASE n.severidade
                       WHEN 'critico' THEN 1 WHEN 'urgente' THEN 2
                       WHEN 'atencao' THEN 3
                       WHEN 'critica' THEN 1 WHEN 'alta' THEN 2
                       WHEN 'media' THEN 3 ELSE 4 END,
                     n.criada_em DESC";
            }
            else
            {
                filtroLida = "";
                orderBy = "n.criada_em DESC";
            }

            var sql = $@"SELECT n.id, n.paciente_id, c.nome AS nome_paciente,
                          n.severidade, n.tipo, n.titulo, n.mensagem,
                          n.lida, n.criada_em
                   FROM notificacoes_medico n
                   JOIN clientes c ON c.id = n.paciente_id
                   WHERE n.medico_id = {{0}} {filtroLida}
                   ORDER BY {orderBy}
                   LIMIT 100";

            var rows = await db.Database.SqlQueryRaw<NotificacaoDto>(sql, medicoId)
                .ToListAsync();
            return Results.Ok(rows);
        });

        g.MapPost("/{id:guid}/marcar-lida", async (Guid id, AppDbContext db) =>
        {
            await db.Database.ExecuteSqlRawAsync(
                "UPDATE notificacoes_medico SET lida = TRUE, lida_em = NOW() WHERE id = {0}", id);
            return Results.NoContent();
        });

        g.MapPost("/{id:guid}/marcar-nao-lida", async (Guid id, AppDbContext db) =>
        {
            await db.Database.ExecuteSqlRawAsync(
                "UPDATE notificacoes_medico SET lida = FALSE, lida_em = NULL WHERE id = {0}", id);
            return Results.NoContent();
        });
    }
}

public record NotificacaoDto(
    Guid Id, Guid PacienteId, string? NomePaciente,
    string Severidade, string Tipo, string Titulo, string Mensagem,
    bool Lida, DateTime CriadaEm);
