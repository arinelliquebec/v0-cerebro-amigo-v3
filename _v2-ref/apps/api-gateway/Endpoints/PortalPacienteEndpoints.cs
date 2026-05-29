using ApiGateway.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace ApiGateway.Endpoints;

/// <summary>
/// Endpoints do portal do paciente.
///
/// Princípios:
///  - Paciente só vê SEUS dados.
///  - Paciente NÃO vê: notas privadas do médico, classificações de IA sobre ele,
///    diagnóstico CID atribuído.
///  - Paciente DECIDE explicitamente o que compartilha (diário).
/// </summary>
public static class PortalPacienteEndpoints
{
    public static void Map(WebApplication app)
    {
        var g = app.MapGroup("/api/v1/portal/paciente")
            .WithTags("portal-paciente")
            .RequireAuthorization("paciente");

        // ====================================================================
        // VISÃO GERAL (home do portal)
        // ====================================================================
        g.MapGet("/home", async (AppDbContext db, ClaimsPrincipal user) =>
        {
            var pid = PacienteAuthEndpoints.GetPacienteId(user);
            if (pid is null) return Results.Unauthorized();

            var perfil = await db.Database.SqlQueryRaw<PerfilHome>(@"
                SELECT c.nome, m.nome AS nome_medico
                FROM clientes c
                JOIN pacientes p ON p.cliente_id = c.id
                JOIN medicos m ON m.id = p.medico_responsavel_id
                WHERE c.id = {0}", pid.Value).FirstOrDefaultAsync();

            // Próximas tomadas hoje
            var tomadasHoje = await db.Database.SqlQueryRaw<TomadaHoje>(@"
                SELECT t.id, t.horario_previsto,
                       t.status, pr.medicamento,
                       pr.dose_descricao AS dose
                FROM tomadas_medicacao t
                JOIN prescricoes pr ON pr.id = t.prescricao_id
                WHERE t.paciente_id = {0}
                  AND t.horario_previsto::date = CURRENT_DATE
                ORDER BY t.horario_previsto", pid.Value).ToListAsync();

            // Próxima consulta
            var proxConsulta = await db.Database.SqlQueryRaw<ProximaConsulta>(@"
                SELECT inicia_em, modalidade, status
                FROM consultas
                WHERE paciente_id = {0} AND inicia_em > NOW() AND status IN ('agendada','confirmada')
                ORDER BY inicia_em LIMIT 1", pid.Value).FirstOrDefaultAsync();

            // Último humor registrado
            var ultimoHumor = await db.Database.ExecuteScalarAsync<int?>(@"
                SELECT humor FROM sintomas
                WHERE paciente_id = {0} AND humor IS NOT NULL
                ORDER BY registrado_em DESC LIMIT 1", pid.Value);

            return Results.Ok(new
            {
                perfil = perfil ?? new PerfilHome("", ""),
                tomadasHoje,
                proxConsulta,
                ultimoHumor,
                jaRegistrouHumorHoje = await db.Database.ExecuteScalarAsync<int>(@"
                    SELECT COUNT(*)::int FROM sintomas
                    WHERE paciente_id = {0} AND humor IS NOT NULL
                      AND registrado_em::date = CURRENT_DATE", pid.Value) > 0
            });
        });

        // ====================================================================
        // DIÁRIO
        // ====================================================================
        var d = app.MapGroup("/api/v1/portal/paciente/diario")
            .WithTags("portal-paciente-diario")
            .RequireAuthorization("paciente");

        d.MapGet("/", async (AppDbContext db, ClaimsPrincipal user,
            [FromQuery] int page = 1, [FromQuery] int pageSize = 20) =>
        {
            var pid = PacienteAuthEndpoints.GetPacienteId(user);
            if (pid is null) return Results.Unauthorized();

            var entradas = await db.Database.SqlQueryRaw<DiarioEntrada>(@"
                SELECT id, titulo, conteudo,
                       humor, tags,
                       compartilhada_com_medico,
                       criada_em, atualizada_em
                FROM diario_entradas
                WHERE paciente_id = {0}
                ORDER BY criada_em DESC
                OFFSET {1} LIMIT {2}",
                pid.Value, (page - 1) * pageSize, pageSize).ToListAsync();

            return Results.Ok(entradas);
        });

        d.MapGet("/{id:guid}", async (Guid id, AppDbContext db, ClaimsPrincipal user) =>
        {
            var pid = PacienteAuthEndpoints.GetPacienteId(user);
            if (pid is null) return Results.Unauthorized();

            var e = await db.Database.SqlQueryRaw<DiarioEntrada>(@"
                SELECT id, titulo, conteudo,
                       humor, tags,
                       compartilhada_com_medico,
                       criada_em, atualizada_em
                FROM diario_entradas
                WHERE id = {0} AND paciente_id = {1}",
                id, pid.Value).FirstOrDefaultAsync();

            return e is null ? Results.NotFound() : Results.Ok(e);
        });

        d.MapPost("/", async (
            [FromBody] CriarDiarioRequest req,
            AppDbContext db, ClaimsPrincipal user) =>
        {
            var pid = PacienteAuthEndpoints.GetPacienteId(user);
            if (pid is null) return Results.Unauthorized();

            var id = Guid.NewGuid();
            await db.Database.ExecuteSqlRawAsync(@"
                INSERT INTO diario_entradas
                  (id, paciente_id, titulo, conteudo, humor, tags, compartilhada_com_medico)
                VALUES ({0}, {1}, NULLIF({2}, ''), {3}, {4}, {5}, {6})",
                id, pid.Value, req.Titulo ?? "", req.Conteudo,
                req.Humor, req.Tags ?? Array.Empty<string>(), req.CompartilharComMedico);

            return Results.Created($"/api/v1/portal/paciente/diario/{id}", new { id });
        });

        d.MapPatch("/{id:guid}", async (
            Guid id, [FromBody] AtualizarDiarioRequest req,
            AppDbContext db, ClaimsPrincipal user) =>
        {
            var pid = PacienteAuthEndpoints.GetPacienteId(user);
            if (pid is null) return Results.Unauthorized();

            var rows = await db.Database.ExecuteSqlRawAsync(@"
                UPDATE diario_entradas
                SET titulo = COALESCE({0}, titulo),
                    conteudo = COALESCE({1}, conteudo),
                    humor = COALESCE({2}, humor),
                    tags = COALESCE({3}, tags),
                    compartilhada_com_medico = COALESCE({4}, compartilhada_com_medico),
                    atualizada_em = NOW()
                WHERE id = {5} AND paciente_id = {6}",
                req.Titulo, req.Conteudo, req.Humor, req.Tags, req.CompartilharComMedico,
                id, pid.Value);

            return rows > 0 ? Results.NoContent() : Results.NotFound();
        });

        d.MapDelete("/{id:guid}", async (Guid id, AppDbContext db, ClaimsPrincipal user) =>
        {
            var pid = PacienteAuthEndpoints.GetPacienteId(user);
            if (pid is null) return Results.Unauthorized();

            await db.Database.ExecuteSqlRawAsync(
                "DELETE FROM diario_entradas WHERE id = {0} AND paciente_id = {1}",
                id, pid.Value);
            return Results.NoContent();
        });

        // ====================================================================
        // HUMOR (registro rápido)
        // ====================================================================
        g.MapPost("/humor", async (
            [FromBody] RegistrarHumorRequest req,
            AppDbContext db, ClaimsPrincipal user) =>
        {
            var pid = PacienteAuthEndpoints.GetPacienteId(user);
            if (pid is null) return Results.Unauthorized();

            await db.Database.ExecuteSqlRawAsync(@"
                INSERT INTO sintomas (paciente_id, humor, ansiedade, sono_horas, energia, nota)
                VALUES ({0}, {1}, {2}, {3}, {4}, NULLIF({5}, ''))",
                pid.Value, req.Humor, req.Ansiedade, req.SonoHoras, req.Energia, req.Nota ?? "");
            return Results.NoContent();
        });

        g.MapGet("/humor/historico", async (
            AppDbContext db, ClaimsPrincipal user, [FromQuery] int dias = 30) =>
        {
            var pid = PacienteAuthEndpoints.GetPacienteId(user);
            if (pid is null) return Results.Unauthorized();

            var pontos = await db.Database.SqlQueryRaw<PontoHumor>(@"
                SELECT DATE(registrado_em) AS data,
                       AVG(humor)::float AS humor,
                       AVG(ansiedade)::float AS ansiedade
                FROM sintomas
                WHERE paciente_id = {0}
                  AND registrado_em >= NOW() - ({1} || ' days')::interval
                GROUP BY DATE(registrado_em)
                ORDER BY data", pid.Value, dias).ToListAsync();
            return Results.Ok(pontos);
        });

        // ====================================================================
        // MEDICAÇÕES (visão do paciente)
        // ====================================================================
        g.MapGet("/medicacoes", async (AppDbContext db, ClaimsPrincipal user) =>
        {
            var pid = PacienteAuthEndpoints.GetPacienteId(user);
            if (pid is null) return Results.Unauthorized();

            var meds = await db.Database.SqlQueryRaw<MedicacaoPaciente>(@"
                SELECT id, medicamento,
                       dose_descricao, horarios,
                       inicio_em, observacoes
                FROM prescricoes
                WHERE paciente_id = {0} AND ativa = TRUE
                ORDER BY medicamento", pid.Value).ToListAsync();
            return Results.Ok(meds);
        });

        // Confirmar tomada via portal (alternativa ao WhatsApp)
        g.MapPost("/medicacoes/confirmar/{tomadaId:guid}", async (
            Guid tomadaId, [FromBody] ConfirmarTomadaRequest req,
            AppDbContext db, ClaimsPrincipal user) =>
        {
            var pid = PacienteAuthEndpoints.GetPacienteId(user);
            if (pid is null) return Results.Unauthorized();

            var rows = await db.Database.ExecuteSqlRawAsync(@"
                UPDATE tomadas_medicacao
                SET status = {0}, horario_real = NOW(), nota_paciente = NULLIF({1}, '')
                WHERE id = {2} AND paciente_id = {3}",
                req.Status, req.Nota ?? "", tomadaId, pid.Value);

            return rows > 0 ? Results.NoContent() : Results.NotFound();
        });

        // ====================================================================
        // PERFIL
        // ====================================================================
        g.MapGet("/perfil", async (AppDbContext db, ClaimsPrincipal user) =>
        {
            var pid = PacienteAuthEndpoints.GetPacienteId(user);
            if (pid is null) return Results.Unauthorized();

            var p = await db.Database.SqlQueryRaw<PerfilCompleto>(@"
                SELECT c.id, c.nome, c.email, c.wa_id,
                       p.cpf, p.data_nascimento,
                       p.consentimento_lgpd_em,
                       p.config_lembretes,
                       m.nome AS nome_medico, m.crm AS crm_medico
                FROM clientes c
                JOIN pacientes p ON p.cliente_id = c.id
                JOIN medicos m ON m.id = p.medico_responsavel_id
                WHERE c.id = {0}", pid.Value).FirstOrDefaultAsync();
            return p is null ? Results.NotFound() : Results.Ok(p);
        });

        g.MapPatch("/perfil", async (
            [FromBody] AtualizarPerfilRequest req,
            AppDbContext db, ClaimsPrincipal user) =>
        {
            var pid = PacienteAuthEndpoints.GetPacienteId(user);
            if (pid is null) return Results.Unauthorized();

            await db.Database.ExecuteSqlRawAsync(@"
                UPDATE clientes SET nome = COALESCE({0}, nome), email = COALESCE({1}, email)
                WHERE id = {2}", req.Nome, req.Email, pid.Value);
            return Results.NoContent();
        });
    }
}

// =============================================================================
// DTOs
// =============================================================================

public record PerfilHome(string Nome, string NomeMedico);
public record TomadaHoje(Guid Id, DateTime HorarioPrevisto, string Status,
    string Medicamento, string Dose);
public record ProximaConsulta(DateTime IniciaEm, string Modalidade, string Status);

public record DiarioEntrada(Guid Id, string? Titulo, string Conteudo, int? Humor,
    string[] Tags, bool CompartilhadaComMedico, DateTime CriadaEm, DateTime AtualizadaEm);

public record CriarDiarioRequest(string? Titulo, string Conteudo, int? Humor,
    string[]? Tags, bool CompartilharComMedico = false);

public record AtualizarDiarioRequest(string? Titulo, string? Conteudo, int? Humor,
    string[]? Tags, bool? CompartilharComMedico);

public record RegistrarHumorRequest(int Humor, int? Ansiedade,
    decimal? SonoHoras, int? Energia, string? Nota);

public record MedicacaoPaciente(Guid Id, string Medicamento, string DoseDescricao,
    TimeOnly[] Horarios, DateTime InicioEm, string? Observacoes);

public record ConfirmarTomadaRequest(string Status, string? Nota);

public record PerfilCompleto(Guid Id, string? Nome, string? Email, string WaId,
    string? Cpf, DateTime? DataNascimento, DateTime? ConsentimentoLgpdEm,
    string ConfigLembretes, string NomeMedico, string CrmMedico);

public record AtualizarPerfilRequest(string? Nome, string? Email);
