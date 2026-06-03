using ApiGateway.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using System.Text.Json;

namespace ApiGateway.Endpoints;

/// <summary>
/// Configurações do próprio médico (timezone, horário de trabalho, preferências
/// de notificação). Escopo = self, via GetMedicoIdAsync. Consumido pela agenda,
/// pelo agendamento de conduta e pela notificação externa (canal opt-in).
/// </summary>
public static class ConfigEndpoints
{
    public static void Map(WebApplication app)
    {
        var g = app.MapGroup("/api/v1/me/config").WithTags("config").RequireAuthorization();

        g.MapGet("/", async (AppDbContext db, ClaimsPrincipal user) =>
        {
            var medicoId = await GetMedicoIdAsync(db, user);
            if (medicoId is null) return Results.Forbid();

            var cfg = await db.Database.SqlQueryRaw<MedicoConfigDto>(@"
                SELECT timezone,
                       horario_trabalho::text AS horario_trabalho,
                       notif_prefs::text AS notif_prefs
                FROM medicos WHERE id = {0}",
                medicoId.Value).FirstOrDefaultAsync();

            return cfg is null ? Results.NotFound() : Results.Ok(cfg);
        });

        g.MapPatch("/", async (
            [FromBody] MedicoConfigPatchRequest req, AppDbContext db, ClaimsPrincipal user) =>
        {
            var medicoId = await GetMedicoIdAsync(db, user);
            if (medicoId is null) return Results.Forbid();

            var horario = req.HorarioTrabalho?.GetRawText() ?? "";
            var prefs = req.NotifPrefs?.GetRawText() ?? "";

            await db.Database.ExecuteSqlRawAsync(@"
                UPDATE medicos SET
                    timezone         = COALESCE(NULLIF({1}, ''), timezone),
                    horario_trabalho = COALESCE(NULLIF({2}, '')::jsonb, horario_trabalho),
                    notif_prefs      = COALESCE(NULLIF({3}, '')::jsonb, notif_prefs)
                WHERE id = {0}",
                medicoId.Value, req.Timezone ?? "", horario, prefs);

            return Results.NoContent();
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

public record MedicoConfigDto(string Timezone, string HorarioTrabalho, string NotifPrefs);

public record MedicoConfigPatchRequest(
    string? Timezone, JsonElement? HorarioTrabalho, JsonElement? NotifPrefs);
