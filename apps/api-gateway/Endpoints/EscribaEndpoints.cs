using ApiGateway.Data;
using ApiGateway.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Net.Http.Headers;
using System.Security.Claims;
using System.Text;
using System.Text.Json;

namespace ApiGateway.Endpoints;

/// <summary>
/// Escriba clínico (Ambient Scribe, ADR-040). Áudio da teleconsulta → transcrição
/// (agents-py) → rascunho FACTUAL → médico revisa/aprova → evolução append-only.
///
/// Guardrails (clinical-safety):
///   • Regra #1: rascunho é factual; a IA não decide nada clínico (feito no prompt do agents-py).
///   • Regra #2: doctor-facing; não aciona protocolo de crise patient-facing — só flag mencao_risco.
///   • Regra #3: nada vira evolução sem aprovação do médico.
///   • Regra #4: gravação só com consentimento do paciente; transcrição/rascunho cifrados (ADR-018).
///   • Regra #5: evolucoes_clinicas é append-only.
/// Tenant: médico via JOIN pacientes.medico_responsavel_id; paciente via GetPacienteId.
/// </summary>
public static class EscribaEndpoints
{
    public static void Map(WebApplication app)
    {
        // ─── Paciente: consentir / revogar gravação ───────────────────────────
        app.MapPost("/api/v1/portal/paciente/agenda/{id:guid}/escriba/consentir", async (
            Guid id, AppDbContext db, ClaimsPrincipal user) =>
        {
            var pid = PacienteAuthEndpoints.GetPacienteId(user);
            if (pid is null) return Results.Unauthorized();

            var afetadas = await db.Database.ExecuteSqlRawAsync(@"
                UPDATE consultas
                SET escriba_consentido_em = NOW(),
                    escriba_status = CASE WHEN escriba_status = 'idle' THEN 'consentido' ELSE escriba_status END
                WHERE id = {0} AND paciente_id = {1} AND modalidade = 'teleconsulta'",
                id, pid.Value);
            return afetadas == 0 ? Results.NotFound() : Results.NoContent();
        }).WithTags("escriba-paciente").RequireAuthorization("paciente");

        // Revogar consentimento (direito do titular, LGPD) — só se ainda não aprovado.
        app.MapDelete("/api/v1/portal/paciente/agenda/{id:guid}/escriba/consentir", async (
            Guid id, AppDbContext db, ClaimsPrincipal user) =>
        {
            var pid = PacienteAuthEndpoints.GetPacienteId(user);
            if (pid is null) return Results.Unauthorized();

            var afetadas = await db.Database.ExecuteSqlRawAsync(@"
                UPDATE consultas
                SET escriba_consentido_em = NULL, escriba_status = 'idle'
                WHERE id = {0} AND paciente_id = {1} AND escriba_status <> 'aprovado'",
                id, pid.Value);
            return afetadas == 0 ? Results.NotFound() : Results.NoContent();
        }).WithTags("escriba-paciente").RequireAuthorization("paciente");

        // ─── Médico: status do consentimento (checa antes de gravar) ──────────
        app.MapGet("/api/v1/consultas/{id:guid}/escriba/status", async (
            Guid id, AppDbContext db, ClaimsPrincipal user) =>
        {
            var medicoId = await GetMedicoIdAsync(db, user);
            if (medicoId is null) return Results.Forbid();

            var info = await ConsultaInfoAsync(db, id, medicoId.Value);
            if (info is null) return Results.NotFound();

            return Results.Ok(new
            {
                consentido = info.EscribaConsentidoEm is not null,
                status = info.EscribaStatus,
            });
        }).WithTags("escriba-medico").RequireAuthorization();

        // ─── Médico: upload do áudio → agents-py → grava cifrado ──────────────
        app.MapPost("/api/v1/consultas/{id:guid}/escriba", async (
            Guid id, [FromBody] EscribaUploadRequest req, AppDbContext db, ClaimsPrincipal user,
            CryptoService crypto, IHttpClientFactory httpFactory, IConfiguration cfg) =>
        {
            var medicoId = await GetMedicoIdAsync(db, user);
            if (medicoId is null) return Results.Forbid();

            var info = await ConsultaInfoAsync(db, id, medicoId.Value);
            if (info is null) return Results.NotFound();
            if (info.Modalidade != "teleconsulta")
                return Results.BadRequest(new { erro = "nao_e_teleconsulta" });
            if (info.EscribaConsentidoEm is null)
                return Results.Conflict(new { erro = "sem_consentimento" });
            if (string.IsNullOrWhiteSpace(req.AudioBase64))
                return Results.BadRequest(new { erro = "audio_vazio" });

            var internalToken = cfg["INTERNAL_API_TOKEN"]
                ?? throw new InvalidOperationException("INTERNAL_API_TOKEN ausente");

            // LLM/Transcribe vivem só no Python (ADR-008). Gateway só orquestra + persiste.
            string transcricao; string rascunhoJson; bool mencaoRisco;
            try
            {
                var http = httpFactory.CreateClient("agents-py");
                var payload = JsonSerializer.Serialize(new
                {
                    audio_base64 = req.AudioBase64,
                    content_type = string.IsNullOrWhiteSpace(req.ContentType) ? "audio/webm" : req.ContentType,
                    paciente_id = info.PacienteId,
                });
                using var msg = new HttpRequestMessage(HttpMethod.Post, "/internal/escriba/transcrever")
                {
                    Content = new StringContent(payload, Encoding.UTF8, "application/json"),
                };
                msg.Headers.Authorization = new AuthenticationHeaderValue("Bearer", internalToken);

                using var resp = await http.SendAsync(msg);
                if (!resp.IsSuccessStatusCode) return Results.StatusCode(502);

                var json = await resp.Content.ReadAsStringAsync();
                using var doc = JsonDocument.Parse(json);
                transcricao = doc.RootElement.GetProperty("transcricao").GetString() ?? "";
                rascunhoJson = doc.RootElement.GetProperty("rascunho").GetRawText();
                mencaoRisco = doc.RootElement.TryGetProperty("mencao_risco", out var mr) && mr.GetBoolean();
            }
            catch
            {
                return Results.StatusCode(502);
            }

            var transcricaoId = Guid.NewGuid();
            await db.Database.ExecuteSqlRawAsync(@"
                INSERT INTO consulta_transcricoes
                  (id, consulta_id, paciente_id, medico_id, transcricao, rascunho, mencao_risco, status)
                VALUES ({0}, {1}, {2}, {3}, {4}, {5}, {6}, 'rascunho')",
                transcricaoId, id, info.PacienteId, medicoId.Value,
                crypto.Encrypt(transcricao) ?? "", crypto.Encrypt(rascunhoJson) ?? "", mencaoRisco);

            await db.Database.ExecuteSqlRawAsync(
                "UPDATE consultas SET escriba_status = 'rascunho' WHERE id = {0}", id);

            return Results.Ok(new
            {
                id = transcricaoId,
                transcricao,
                rascunho = ParseJson(rascunhoJson),
                mencaoRisco,
            });
        }).WithTags("escriba-medico").RequireAuthorization();

        // ─── Médico: leitura do rascunho mais recente (decifrado) ─────────────
        app.MapGet("/api/v1/consultas/{id:guid}/escriba", async (
            Guid id, AppDbContext db, ClaimsPrincipal user, CryptoService crypto) =>
        {
            var medicoId = await GetMedicoIdAsync(db, user);
            if (medicoId is null) return Results.Forbid();

            var row = await db.Database.SqlQueryRaw<TranscricaoRow>(@"
                SELECT ct.transcricao, ct.rascunho, ct.mencao_risco, ct.status
                FROM consulta_transcricoes ct
                JOIN pacientes p ON p.cliente_id = ct.paciente_id
                WHERE ct.consulta_id = {0} AND p.medico_responsavel_id = {1}
                ORDER BY ct.criado_em DESC
                LIMIT 1", id, medicoId.Value).FirstOrDefaultAsync();
            if (row is null) return Results.NotFound();

            return Results.Ok(new
            {
                transcricao = crypto.Decrypt(row.Transcricao),
                rascunho = ParseJson(crypto.Decrypt(row.Rascunho)),
                mencaoRisco = row.MencaoRisco,
                status = row.Status,
            });
        }).WithTags("escriba-medico").RequireAuthorization();

        // ─── Médico: edita o rascunho (médico no loop) — só enquanto 'rascunho' ─
        app.MapPatch("/api/v1/consultas/{id:guid}/escriba", async (
            Guid id, JsonElement body, AppDbContext db, ClaimsPrincipal user, CryptoService crypto) =>
        {
            var medicoId = await GetMedicoIdAsync(db, user);
            if (medicoId is null) return Results.Forbid();
            if (!body.TryGetProperty("rascunho", out var rascunho))
                return Results.BadRequest(new { erro = "rascunho_obrigatorio" });

            var afetadas = await db.Database.ExecuteSqlRawAsync(@"
                UPDATE consulta_transcricoes SET rascunho = {2}
                WHERE consulta_id = {0} AND medico_id = {1} AND status = 'rascunho'",
                id, medicoId.Value, crypto.Encrypt(rascunho.GetRawText()) ?? "");
            return afetadas == 0 ? Results.Conflict(new { erro = "sem_rascunho_editavel" }) : Results.NoContent();
        }).WithTags("escriba-medico").RequireAuthorization();

        // ─── Médico: aprova → evolução append-only + fecha o rascunho ─────────
        app.MapPost("/api/v1/consultas/{id:guid}/escriba/aprovar", async (
            Guid id, JsonElement body, AppDbContext db, ClaimsPrincipal user, CryptoService crypto) =>
        {
            var medicoId = await GetMedicoIdAsync(db, user);
            if (medicoId is null) return Results.Forbid();
            var sub = user.FindFirst("sub")?.Value;
            Guid.TryParse(sub, out var usuarioId);

            if (!body.TryGetProperty("conteudo", out var c) || string.IsNullOrWhiteSpace(c.GetString()))
                return Results.BadRequest(new { erro = "conteudo_obrigatorio" });
            var conteudo = c.GetString()!;

            var info = await ConsultaInfoAsync(db, id, medicoId.Value);
            if (info is null) return Results.NotFound();

            var afetadas = await db.Database.ExecuteSqlRawAsync(@"
                UPDATE consulta_transcricoes SET status = 'aprovado', aprovado_em = NOW()
                WHERE consulta_id = {0} AND medico_id = {1} AND status = 'rascunho'",
                id, medicoId.Value);
            if (afetadas == 0) return Results.Conflict(new { erro = "sem_rascunho_ou_ja_aprovado" });

            var evoId = Guid.NewGuid();
            await db.Database.ExecuteSqlRawAsync(@"
                INSERT INTO evolucoes_clinicas
                  (id, paciente_id, medico_id, consulta_id, origem, conteudo, assistido_ia, criado_por)
                VALUES ({0}, {1}, {2}, {3}, 'escriba', {4}, TRUE, {5})",
                evoId, info.PacienteId, medicoId.Value, id, crypto.Encrypt(conteudo) ?? "", usuarioId);

            await db.Database.ExecuteSqlRawAsync(
                "UPDATE consultas SET escriba_status = 'aprovado' WHERE id = {0}", id);

            return Results.Ok(new { id = evoId });
        }).WithTags("escriba-medico").RequireAuthorization();
    }

    // ─── Helpers ───────────────────────────────────────────────────────────

    private static async Task<EscribaConsultaInfo?> ConsultaInfoAsync(AppDbContext db, Guid consultaId, Guid medicoId) =>
        await db.Database.SqlQueryRaw<EscribaConsultaInfo>(@"
            SELECT co.paciente_id, co.modalidade, co.escriba_status, co.escriba_consentido_em
            FROM consultas co
            JOIN pacientes p ON p.cliente_id = co.paciente_id
            WHERE co.id = {0} AND p.medico_responsavel_id = {1}",
            consultaId, medicoId).FirstOrDefaultAsync();

    private static JsonElement? ParseJson(string? json)
    {
        if (string.IsNullOrWhiteSpace(json)) return null;
        try { return JsonSerializer.Deserialize<JsonElement>(json); }
        catch { return null; }
    }

    private static async Task<Guid?> GetMedicoIdAsync(AppDbContext db, ClaimsPrincipal user)
    {
        var sub = user.FindFirst("sub")?.Value;
        if (!Guid.TryParse(sub, out var userId)) return null;
        return await db.Database.ExecuteScalarAsync<Guid?>(
            "SELECT id FROM medicos WHERE usuario_id = {0}", userId);
    }
}

public record EscribaUploadRequest(string AudioBase64, string ContentType);

public record EscribaConsultaInfo(
    Guid PacienteId, string Modalidade, string EscribaStatus, DateTime? EscribaConsentidoEm);

public record TranscricaoRow(string? Transcricao, string? Rascunho, bool MencaoRisco, string Status);
