using ApiGateway.Data;
using ApiGateway.Models;
using ApiGateway.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;

namespace ApiGateway.Endpoints;

public static class PaymentEndpoints
{
    public static void Map(WebApplication app)
    {
        var g = app.MapGroup("/api/v1/payments").WithTags("payments");

        // Cria preferência (link de pagamento) — protegido
        g.MapPost("/preference", async (
            [FromBody] CreatePreferenceRequest req,
            MercadoPagoClient mp,
            AppDbContext db) =>
        {
            var pref = await mp.CreatePreference(req);

            // Salva pagamento como pendente
            var pag = new Pagamento
            {
                Id = Guid.NewGuid(),
                MercadoPagoId = pref.PreferenceId,
                ConversaId = req.ConversaId,
                Status = "pending",
                Valor = req.Valor,
                Descricao = req.Titulo,
                CriadoEm = DateTime.UtcNow
            };
            db.Pagamentos.Add(pag);
            await db.SaveChangesAsync();

            return Results.Ok(pref);
        })
        .RequireAuthorization()
        .WithSummary("Cria link de pagamento Mercado Pago");

        // Webhook do Mercado Pago — anônimo (MP não autentica via header padrão)
        g.MapPost("/webhook", async (
            HttpContext ctx,
            [FromBody] JsonElement payload,
            MercadoPagoClient mp,
            NfeIoClient nfe,
            AppDbContext db,
            ILogger<Program> logger) =>
        {
            // MP envia: { type: "payment", data: { id: "..." } }
            if (!payload.TryGetProperty("type", out var typeEl) ||
                typeEl.GetString() != "payment")
            {
                return Results.Ok(); // ignora outros tipos
            }

            var paymentId = payload.GetProperty("data").GetProperty("id").ToString();
            var payment = await mp.GetPayment(paymentId);

            if (payment is null) return Results.Ok();

            var pag = await db.Pagamentos.FirstOrDefaultAsync(
                p => p.MercadoPagoId == payment.PreferenceId);

            if (pag is null)
            {
                logger.LogWarning("Pagamento desconhecido recebido: {Id}", paymentId);
                return Results.Ok();
            }

            pag.Status = payment.Status;
            if (payment.Status == "approved")
            {
                pag.AprovadoEm = DateTime.UtcNow;
                // Emite nota fiscal automaticamente
                _ = await nfe.EmitirAsync(pag, payment.PayerEmail, payment.PayerName);
            }

            await db.SaveChangesAsync();
            return Results.Ok();
        })
        .AllowAnonymous()
        .WithSummary("Webhook do Mercado Pago");
    }
}
