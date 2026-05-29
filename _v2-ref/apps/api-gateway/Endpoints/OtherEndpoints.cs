using ApiGateway.Data;
using ApiGateway.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ApiGateway.Endpoints;

public static class ConversasEndpoints
{
    public static void Map(WebApplication app)
    {
        var g = app.MapGroup("/api/v1/conversas")
            .WithTags("conversas")
            .RequireAuthorization();

        g.MapGet("/", async (
            AppDbContext db,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 20,
            [FromQuery] string? status = null) =>
        {
            var q = db.Conversas.AsQueryable();
            if (!string.IsNullOrEmpty(status)) q = q.Where(c => c.Status == status);

            var total = await q.CountAsync();
            var items = await q
                .OrderByDescending(c => c.CriadaEm)
                .Skip((page - 1) * pageSize).Take(pageSize)
                .Join(db.Clientes, c => c.ClienteId, cli => cli.Id, (c, cli) => new
                {
                    c.Id, c.Status, c.Intencao, c.CriadaEm,
                    Cliente = new { cli.Id, cli.Nome, cli.WaId }
                })
                .ToListAsync();

            return Results.Ok(new { total, page, pageSize, items });
        });

        g.MapGet("/{id:guid}", async (Guid id, AppDbContext db) =>
        {
            var conv = await db.Conversas.FirstOrDefaultAsync(c => c.Id == id);
            if (conv is null) return Results.NotFound();

            var cliente = await db.Clientes.FirstOrDefaultAsync(c => c.Id == conv.ClienteId);
            var msgs = await db.Mensagens
                .Where(m => m.ConversaId == id)
                .OrderBy(m => m.CriadaEm)
                .ToListAsync();

            return Results.Ok(new { conversa = conv, cliente, mensagens = msgs });
        });
    }
}

public static class MetricasEndpoints
{
    public static void Map(WebApplication app)
    {
        var g = app.MapGroup("/api/v1/metricas")
            .WithTags("metricas")
            .RequireAuthorization();

        g.MapGet("/", async (AppDbContext db) =>
        {
            var hoje = DateTime.UtcNow.Date;
            var inicioMes = new DateTime(hoje.Year, hoje.Month, 1, 0, 0, 0, DateTimeKind.Utc);

            var conversasHoje = await db.Conversas.CountAsync(c => c.CriadaEm >= hoje);
            var conversasMes = await db.Conversas.CountAsync(c => c.CriadaEm >= inicioMes);

            var custoHoje = await db.Mensagens
                .Where(m => m.CriadaEm >= hoje && m.CustoUsd != null)
                .SumAsync(m => m.CustoUsd ?? 0);
            var custoMes = await db.Mensagens
                .Where(m => m.CriadaEm >= inicioMes && m.CustoUsd != null)
                .SumAsync(m => m.CustoUsd ?? 0);

            var totalClientes = await db.Clientes.CountAsync();

            // Taxa autônoma simplificada: % conversas que NÃO foram marcadas como críticas
            var taxa = conversasMes == 0 ? 0.0 :
                (double)await db.Conversas
                    .Where(c => c.CriadaEm >= inicioMes && c.Intencao != "reclamacao")
                    .CountAsync() / conversasMes * 100.0;

            return Results.Ok(new MetricasResponse(
                ConversasHoje: conversasHoje,
                ConversasMes: conversasMes,
                CustoLlmHoje: custoHoje,
                CustoLlmMes: custoMes,
                TaxaAutonoma: Math.Round(taxa, 1),
                TotalClientes: totalClientes));
        });
    }
}

public static class AgentesEndpoints
{
    public static void Map(WebApplication app)
    {
        var g = app.MapGroup("/api/v1/agentes")
            .WithTags("agentes")
            .RequireAuthorization();

        g.MapGet("/", async (AppDbContext db) =>
            Results.Ok(await db.Agentes.OrderBy(a => a.Nome).ToListAsync()));

        g.MapPatch("/{id:guid}", async (
            Guid id,
            [FromBody] AtualizarAgenteRequest req,
            AppDbContext db) =>
        {
            var ag = await db.Agentes.FirstOrDefaultAsync(a => a.Id == id);
            if (ag is null) return Results.NotFound();

            if (req.SystemPrompt != null) ag.SystemPrompt = req.SystemPrompt;
            if (req.ModeloDefault != null) ag.ModeloDefault = req.ModeloDefault;
            if (req.Ativo.HasValue) ag.Ativo = req.Ativo.Value;
            ag.AtualizadoEm = DateTime.UtcNow;

            await db.SaveChangesAsync();
            return Results.Ok(ag);
        });
    }
}

public static class NotaFiscalEndpoints
{
    public static void Map(WebApplication app)
    {
        var g = app.MapGroup("/api/v1/notas-fiscais")
            .WithTags("notas-fiscais")
            .RequireAuthorization();

        g.MapGet("/", async (AppDbContext db,
            [FromQuery] int page = 1, [FromQuery] int pageSize = 20) =>
        {
            var q = db.NotasFiscais.OrderByDescending(n => n.CriadaEm);
            var total = await q.CountAsync();
            var items = await q.Skip((page - 1) * pageSize).Take(pageSize).ToListAsync();
            return Results.Ok(new { total, page, pageSize, items });
        });
    }
}
