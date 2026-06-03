using ApiGateway.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace ApiGateway.Endpoints;

/// <summary>
/// Agenda do médico — CRUD de <c>consultas</c>. Tenant = médico logado,
/// escopado SEMPRE via JOIN em <c>pacientes.medico_responsavel_id</c>
/// (regra clínica: filtro de tenant é a 1ª cláusula, nunca opcional).
///
/// Usado pela tela /dashboard/agenda e para resolver consulta→paciente
/// no briefing pré-consulta (/dashboard/consultas/{id}/briefing).
/// </summary>
public static class ConsultasEndpoints
{
    private static readonly string[] Modalidades = { "presencial", "teleconsulta" };
    private static readonly string[] Status =
        { "agendada", "confirmada", "realizada", "cancelada" };

    public static void Map(WebApplication app)
    {
        var g = app.MapGroup("/api/v1/consultas")
            .WithTags("consultas")
            .RequireAuthorization();

        // Agenda no intervalo [de, ate). Default: hoje .. +7 dias.
        g.MapGet("/", async (
            AppDbContext db, ClaimsPrincipal user,
            [FromQuery] string? de, [FromQuery] string? ate) =>
        {
            var medicoId = await GetMedicoIdAsync(db, user);
            if (medicoId is null) return Results.Forbid();

            var inicio = DateTime.TryParse(de, out var d) ? d.Date : DateTime.UtcNow.Date;
            var fim = DateTime.TryParse(ate, out var a) ? a.Date.AddDays(1) : inicio.AddDays(7);

            var rows = await db.Database.SqlQueryRaw<ConsultaListItem>(@"
                SELECT co.id, co.paciente_id, cl.nome AS paciente_nome,
                       co.inicia_em, co.modalidade, co.status, co.notas
                FROM consultas co
                JOIN clientes cl ON cl.id = co.paciente_id
                JOIN pacientes p ON p.cliente_id = co.paciente_id
                WHERE p.medico_responsavel_id = {0}
                  AND co.inicia_em >= {1} AND co.inicia_em < {2}
                ORDER BY co.inicia_em",
                medicoId.Value, inicio, fim).ToListAsync();

            return Results.Ok(rows);
        });

        // Detalhe de uma consulta (resolve paciente — usado pelo briefing).
        g.MapGet("/{id:guid}", async (Guid id, AppDbContext db, ClaimsPrincipal user) =>
        {
            var medicoId = await GetMedicoIdAsync(db, user);
            if (medicoId is null) return Results.Forbid();

            var row = await db.Database.SqlQueryRaw<ConsultaListItem>(@"
                SELECT co.id, co.paciente_id, cl.nome AS paciente_nome,
                       co.inicia_em, co.modalidade, co.status, co.notas
                FROM consultas co
                JOIN clientes cl ON cl.id = co.paciente_id
                JOIN pacientes p ON p.cliente_id = co.paciente_id
                WHERE co.id = {0} AND p.medico_responsavel_id = {1}",
                id, medicoId.Value).FirstOrDefaultAsync();

            return row is null ? Results.NotFound() : Results.Ok(row);
        });

        // Agendar consulta.
        g.MapPost("/", async (
            [FromBody] CriarConsultaRequest req, AppDbContext db, ClaimsPrincipal user) =>
        {
            var medicoId = await GetMedicoIdAsync(db, user);
            if (medicoId is null) return Results.Forbid();

            // Paciente precisa ser do médico (tenant).
            var ehDoMedico = await db.Database.ExistsAsync(
                "SELECT 1 FROM pacientes WHERE cliente_id = {0} AND medico_responsavel_id = {1}",
                req.PacienteId, medicoId.Value);
            if (!ehDoMedico) return Results.Forbid();

            var modalidade = (req.Modalidade ?? "presencial").ToLowerInvariant();
            if (!Modalidades.Contains(modalidade))
                return Results.BadRequest(new { erro = "modalidade inválida" });

            var novoId = await db.Database.ExecuteScalarAsync<Guid>(@"
                INSERT INTO consultas (paciente_id, medico_id, inicia_em, modalidade, status, notas)
                VALUES ({0}, {1}, {2}, {3}, 'agendada', {4})
                RETURNING id",
                req.PacienteId, medicoId.Value, req.IniciaEm, modalidade, (object?)req.Notas ?? DBNull.Value);

            return Results.Created($"/api/v1/consultas/{novoId}", new { id = novoId });
        });

        // Atualizar consulta (status, horário, modalidade, notas). Campos null = inalterados.
        g.MapPatch("/{id:guid}", async (
            Guid id, [FromBody] AtualizarConsultaRequest req,
            AppDbContext db, ClaimsPrincipal user) =>
        {
            var medicoId = await GetMedicoIdAsync(db, user);
            if (medicoId is null) return Results.Forbid();

            string? status = req.Status?.ToLowerInvariant();
            if (status is not null && !Status.Contains(status))
                return Results.BadRequest(new { erro = "status inválido" });

            string? modalidade = req.Modalidade?.ToLowerInvariant();
            if (modalidade is not null && !Modalidades.Contains(modalidade))
                return Results.BadRequest(new { erro = "modalidade inválida" });

            var afetadas = await db.Database.ExecuteSqlRawAsync(@"
                UPDATE consultas SET
                    status     = COALESCE({2}, status),
                    inicia_em  = COALESCE({3}, inicia_em),
                    modalidade = COALESCE({4}, modalidade),
                    notas      = COALESCE({5}, notas)
                WHERE id = {0}
                  AND paciente_id IN (
                      SELECT cliente_id FROM pacientes WHERE medico_responsavel_id = {1}
                  )",
                id, medicoId.Value,
                (object?)status ?? DBNull.Value,
                (object?)req.IniciaEm ?? DBNull.Value,
                (object?)modalidade ?? DBNull.Value,
                (object?)req.Notas ?? DBNull.Value);

            return afetadas == 0 ? Results.NotFound() : Results.NoContent();
        });

        // Desfecho pós-consulta: registra notas e marca a consulta como realizada.
        // O médico autora as notas; a IA não interpreta nada. As condutas de
        // acompanhamento são definidas na aba Conduta (CondutasEndpoints).
        g.MapPost("/{id:guid}/desfecho", async (
            Guid id, [FromBody] DesfechoRequest req, AppDbContext db, ClaimsPrincipal user) =>
        {
            var medicoId = await GetMedicoIdAsync(db, user);
            if (medicoId is null) return Results.Forbid();

            var afetadas = await db.Database.ExecuteSqlRawAsync(@"
                UPDATE consultas SET
                    notas  = COALESCE(NULLIF({2}, ''), notas),
                    status = 'realizada'
                WHERE id = {0}
                  AND paciente_id IN (
                      SELECT cliente_id FROM pacientes WHERE medico_responsavel_id = {1}
                  )",
                id, medicoId.Value, req.Notas ?? "");

            return afetadas == 0 ? Results.NotFound() : Results.NoContent();
        });
    }

    private static async Task<Guid?> GetMedicoIdAsync(AppDbContext db, ClaimsPrincipal user)
    {
        var sub = user.FindFirst("sub")?.Value;
        if (!Guid.TryParse(sub, out var userId)) return null;
        return await db.Database.ExecuteScalarAsync<Guid?>(
            "SELECT id FROM medicos WHERE usuario_id = {0}", userId);
    }
}

public record ConsultaListItem(
    Guid Id, Guid PacienteId, string? PacienteNome,
    DateTime IniciaEm, string Modalidade, string Status, string? Notas);

public record CriarConsultaRequest(
    Guid PacienteId, DateTime IniciaEm, string? Modalidade, string? Notas);

public record AtualizarConsultaRequest(
    string? Status, DateTime? IniciaEm, string? Modalidade, string? Notas);

public record DesfechoRequest(string? Notas);
