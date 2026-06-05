using ApiGateway.Data;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace ApiGateway.Endpoints;

/// <summary>
/// Presença online da rede social (ADR-031) por heartbeat REST. O cliente dá
/// ping periódico; "online" = ping nos últimos 60s. Sem SignalR (compatível com
/// o cookie httpOnly atual). Só dado volátil de presença — nada clínico.
/// </summary>
public static class RedePresencaEndpoints
{
    public static void Map(WebApplication app)
    {
        var g = app.MapGroup("/api/v1/rede/presenca").WithTags("rede-presenca").RequireAuthorization();

        // Heartbeat: marca o médico como online agora.
        g.MapPost("/ping", async (AppDbContext db, ClaimsPrincipal user) =>
        {
            var medicoId = await ResolveMedicoId(db, user);
            if (medicoId is null) return Results.Forbid();
            await db.Database.ExecuteSqlRawAsync(@"
                INSERT INTO social_presenca (medico_id, ultimo_ping) VALUES ({0}, NOW())
                ON CONFLICT (medico_id) DO UPDATE SET ultimo_ping = NOW()",
                medicoId.Value);
            return Results.NoContent();
        })
        .WithSummary("Heartbeat de presença online");

        // Quem está online agora (ping < 60s), exceto o próprio médico.
        g.MapGet("/online", async (AppDbContext db, ClaimsPrincipal user) =>
        {
            var medicoId = await ResolveMedicoId(db, user);
            if (medicoId is null) return Results.Forbid();
            var rows = await db.Database.SqlQueryRaw<OnlineDto>(@"
                SELECT m.id AS medico_id, m.nome, COALESCE(sp.handle, '') AS handle, sp.foto_url AS foto_url
                FROM social_presenca pr
                JOIN medicos m ON m.id = pr.medico_id
                LEFT JOIN social_perfis sp ON sp.medico_id = m.id
                WHERE pr.ultimo_ping > NOW() - INTERVAL '60 seconds'
                  AND m.id <> {0}
                ORDER BY pr.ultimo_ping DESC
                LIMIT 30",
                medicoId.Value).ToListAsync();
            return Results.Ok(rows);
        })
        .WithSummary("Médicos online agora");
    }

    private static async Task<Guid?> ResolveMedicoId(AppDbContext db, ClaimsPrincipal user)
    {
        var sub = user.FindFirst("sub")?.Value;
        if (!Guid.TryParse(sub, out var userId)) return null;
        return await db.Database.ExecuteScalarAsync<Guid?>(
            "SELECT id FROM medicos WHERE usuario_id = {0}", userId);
    }
}

public record OnlineDto(Guid MedicoId, string Nome, string Handle, string? FotoUrl);
