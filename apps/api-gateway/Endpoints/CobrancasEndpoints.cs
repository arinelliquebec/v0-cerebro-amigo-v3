using ApiGateway.Data;
using ApiGateway.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using System.Text.Json;

namespace ApiGateway.Endpoints;

/// <summary>
/// Cobranças do médico ao paciente (Fluxo B, ADR-033) via Asaas (Pix). Transacional
/// puro — a IA não toca. Tenant: paciente sempre validado por JOIN pacientes
/// (medico_responsavel_id). A cobrança LEGAL vive no Asaas; aqui é espelho +
/// orquestração. Webhook do Asaas confirma o pagamento (idempotente por asaas id).
/// </summary>
public static class CobrancasEndpoints
{
    public static void Map(WebApplication app)
    {
        var g = app.MapGroup("/api/v1/cobrancas").WithTags("cobrancas").RequireAuthorization();

        // Médico cria cobrança Pix para um paciente seu.
        g.MapPost("", async (
            [FromBody] CriarCobrancaRequest req, AppDbContext db, AsaasClient asaas, ClaimsPrincipal user) =>
        {
            var medicoId = await GetMedicoIdAsync(db, user);
            if (medicoId is null) return Results.Forbid();
            if (req.Valor <= 0) return Results.BadRequest(new { error = "valor_invalido" });
            if (!asaas.Configurado) return Results.Json(new { error = "asaas_nao_configurado" }, statusCode: 503);

            // Tenant: o paciente é do médico? (1ª cláusula)
            var pac = await db.Database.SqlQueryRaw<PacienteCobranca>(@"
                SELECT c.id AS paciente_id, c.nome, c.email, c.wa_id AS telefone, p.cpf
                FROM clientes c
                JOIN pacientes p ON p.cliente_id = c.id
                WHERE c.id = {0} AND p.medico_responsavel_id = {1}",
                req.PacienteId, medicoId.Value).FirstOrDefaultAsync();
            if (pac is null) return Results.NotFound(new { error = "paciente_nao_encontrado" });

            var cfg = await db.Database.SqlQueryRaw<AsaasMedicoCfg>(@"
                SELECT asaas_wallet_id AS wallet_id, split_percentual AS fee_pct
                FROM medico_asaas_config WHERE medico_id = {0}",
                medicoId.Value).FirstOrDefaultAsync();

            var cobrancaId = Guid.NewGuid();
            var venc = req.Vencimento ?? DateOnly.FromDateTime(DateTime.UtcNow).AddDays(3);
            var desc = string.IsNullOrWhiteSpace(req.Descricao) ? "Consulta" : req.Descricao!.Trim();

            await db.Database.ExecuteRawAsync(@"
                INSERT INTO cobrancas
                    (id, medico_id, paciente_id, consulta_id, descricao, valor, metodo, status, vencimento)
                VALUES ({0}, {1}, {2}, {3}, {4}, {5}, 'pix', 'pendente', {6})",
                cobrancaId, medicoId.Value, req.PacienteId,
                (object?)req.ConsultaId ?? DBNull.Value, desc, req.Valor, venc);

            var res = await asaas.CriarCobrancaPixAsync(new AsaasCobrancaInput(
                cobrancaId.ToString(), pac.PacienteId.ToString(), pac.Nome ?? "Paciente",
                pac.Cpf, pac.Email, pac.Telefone, req.Valor, venc, desc,
                cfg?.WalletId, cfg?.FeePct ?? 0m));

            if (!res.Sucesso)
            {
                await db.Database.ExecuteRawAsync(
                    "UPDATE cobrancas SET status = 'erro_gateway', atualizado_em = NOW() WHERE id = {0}", cobrancaId);
                return Results.Json(new { error = "asaas_falhou", detalhe = res.Erro }, statusCode: 502);
            }

            await db.Database.ExecuteRawAsync(@"
                UPDATE cobrancas SET
                    asaas_cobranca_id = {1}, asaas_invoice_url = {2},
                    pix_copia_cola = {3}, pix_qr_base64 = {4}, atualizado_em = NOW()
                WHERE id = {0}",
                cobrancaId, res.AsaasId, (object?)res.InvoiceUrl ?? DBNull.Value,
                (object?)res.PixCopiaCola ?? DBNull.Value, (object?)res.PixQrBase64 ?? DBNull.Value);

            return Results.Ok(new
            {
                id = cobrancaId, valor = req.Valor, vencimento = venc, status = "pendente",
                invoiceUrl = res.InvoiceUrl, pixCopiaCola = res.PixCopiaCola, pixQrBase64 = res.PixQrBase64,
            });
        });

        // Lista de cobranças do médico (default: todas, recentes primeiro).
        g.MapGet("", async ([FromQuery] string? status, AppDbContext db, ClaimsPrincipal user) =>
        {
            var medicoId = await GetMedicoIdAsync(db, user);
            if (medicoId is null) return Results.Forbid();

            var rows = await db.Database.SqlQueryRaw<CobrancaItem>(@"
                SELECT co.id, co.descricao, co.valor, co.metodo, co.status, co.vencimento,
                       co.pago_em, co.asaas_invoice_url, co.nfse_status, co.nfse_url,
                       co.paciente_id, c.nome AS paciente_nome
                FROM cobrancas co
                JOIN clientes c ON c.id = co.paciente_id
                JOIN pacientes p ON p.cliente_id = co.paciente_id
                WHERE p.medico_responsavel_id = {0}
                  AND ({1} = '' OR co.status = {1})
                ORDER BY co.criado_em DESC
                LIMIT 200",
                medicoId.Value, status ?? "").ToListAsync();
            return Results.Ok(rows);
        });

        // Resumo financeiro + ROI (cockpit de monetização).
        app.MapGet("/api/v1/financeiro/resumo", async (AppDbContext db, ClaimsPrincipal user) =>
        {
            var medicoId = await GetMedicoIdAsync(db, user);
            if (medicoId is null) return Results.Forbid();

            var r = await db.Database.SqlQueryRaw<FinanceiroResumo>(@"
                WITH cob AS (
                  SELECT co.* FROM cobrancas co
                  JOIN pacientes p ON p.cliente_id = co.paciente_id
                  WHERE p.medico_responsavel_id = {0}
                )
                SELECT
                  COALESCE((SELECT SUM(valor) FROM cob
                            WHERE status = 'pago'
                              AND date_trunc('month', pago_em) = date_trunc('month', NOW())), 0) AS recebido_mes,
                  COALESCE((SELECT SUM(valor) FROM cob WHERE status = 'pendente'), 0) AS pendente_total,
                  COALESCE((SELECT SUM(valor) FROM cob
                            WHERE status = 'pendente' AND vencimento < CURRENT_DATE), 0) AS vencido_total,
                  (SELECT COUNT(*) FROM cob WHERE status = 'pago'
                     AND date_trunc('month', pago_em) = date_trunc('month', NOW()))::int AS pagas_mes,
                  (SELECT COUNT(*) FROM cob
                     WHERE date_trunc('month', criado_em) = date_trunc('month', NOW()))::int AS emitidas_mes,
                  (SELECT COUNT(*) FROM pacientes p2
                     WHERE p2.medico_responsavel_id = {0}
                       AND NOT EXISTS (
                         SELECT 1 FROM consultas k
                         WHERE k.paciente_id = p2.cliente_id AND k.status = 'realizada'
                           AND k.inicia_em > NOW() - INTERVAL '90 days'))::int AS pacientes_inativos
                ",
                medicoId.Value).FirstAsync();
            return Results.Ok(r);
        }).WithTags("cobrancas").RequireAuthorization();

        // ── Médico: minha assinatura da plataforma (Fluxo A, ADR-034). ──
        // Status + valor + link p/ pagar (invoiceUrl do Asaas) + histórico.
        app.MapGet("/api/v1/minha-assinatura", async (AppDbContext db, AsaasClient asaas, ClaimsPrincipal user) =>
        {
            var medicoId = await GetMedicoIdAsync(db, user);
            if (medicoId is null) return Results.Forbid();

            var a = await db.Database.SqlQueryRaw<MinhaAssinatura>(@"
                SELECT plano, valor_mensal, moeda, status, trial_ate, asaas_subscription_id
                FROM assinaturas WHERE medico_id = {0}", medicoId.Value).FirstOrDefaultAsync();
            if (a is null) return Results.NotFound(new { error = "sem_assinatura" });

            string? invoiceUrl = null;
            if (!string.IsNullOrWhiteSpace(a.AsaasSubscriptionId) && asaas.Configurado)
                invoiceUrl = await asaas.ObterLinkAtualAsync(a.AsaasSubscriptionId);

            var pagamentos = await db.Database.SqlQueryRaw<PagamentoMedico>(@"
                SELECT pm.valor, pm.referencia, pm.metodo, pm.pago_em
                FROM pagamentos_manuais pm
                JOIN assinaturas s ON s.id = pm.assinatura_id
                WHERE s.medico_id = {0} AND pm.status = 'confirmado'
                ORDER BY pm.pago_em DESC NULLS LAST LIMIT 24", medicoId.Value).ToListAsync();

            return Results.Ok(new
            {
                plano = a.Plano, valorMensal = a.ValorMensal, moeda = a.Moeda,
                status = a.Status, trialAte = a.TrialAte,
                cobrancaAtiva = !string.IsNullOrWhiteSpace(a.AsaasSubscriptionId),
                invoiceUrl, pagamentos,
            });
        }).WithTags("cobrancas").RequireAuthorization();

        // ── Portal do paciente: vê as próprias cobranças (Pix p/ pagar). ──
        app.MapGet("/api/v1/portal/paciente/cobrancas", async (AppDbContext db, ClaimsPrincipal user) =>
        {
            var pid = PacienteAuthEndpoints.GetPacienteId(user);
            if (pid is null) return Results.Unauthorized();

            var rows = await db.Database.SqlQueryRaw<CobrancaPortal>(@"
                SELECT co.id, co.descricao, co.valor, co.status, co.vencimento,
                       co.asaas_invoice_url, co.pix_copia_cola, co.pix_qr_base64
                FROM cobrancas co
                WHERE co.paciente_id = {0} AND co.status IN ('pendente', 'vencido')
                ORDER BY co.vencimento",
                pid.Value).ToListAsync();
            return Results.Ok(rows);
        }).WithTags("portal-paciente").RequireAuthorization("paciente");

        // ── Webhook Asaas: confirma pagamento (sem JWT; valida token de header). ──
        app.MapPost("/api/v1/asaas/webhook", async (HttpRequest http, AppDbContext db, IConfiguration cfg) =>
        {
            var esperado = cfg["ASAAS_WEBHOOK_TOKEN"];
            if (!string.IsNullOrWhiteSpace(esperado))
            {
                var recebido = http.Headers["asaas-access-token"].ToString();
                if (recebido != esperado) return Results.Unauthorized();
            }

            using var doc = await JsonDocument.ParseAsync(http.Body);
            var root = doc.RootElement;
            var evento = root.TryGetProperty("event", out var ev) ? ev.GetString() : null;
            if (!root.TryGetProperty("payment", out var pay) || !pay.TryGetProperty("id", out var idEl))
                return Results.Ok(new { ignored = true });
            var asaasId = idEl.GetString();

            string? novoStatus = evento switch
            {
                "PAYMENT_RECEIVED" or "PAYMENT_CONFIRMED" => "pago",
                "PAYMENT_OVERDUE" => "vencido",
                "PAYMENT_REFUNDED" => "estornado",
                "PAYMENT_DELETED" => "cancelado",
                _ => null,
            };
            if (novoStatus is null || string.IsNullOrEmpty(asaasId))
                return Results.Ok(new { ignored = true });

            // Fluxo B (legado): cobrança médico→paciente, casada por asaas_cobranca_id.
            if (novoStatus == "pago")
                await db.Database.ExecuteRawAsync(@"
                    UPDATE cobrancas SET status = 'pago', pago_em = COALESCE(pago_em, NOW()), atualizado_em = NOW()
                    WHERE asaas_cobranca_id = {0} AND status <> 'pago'", asaasId);
            else
                await db.Database.ExecuteRawAsync(@"
                    UPDATE cobrancas SET status = {1}, atualizado_em = NOW()
                    WHERE asaas_cobranca_id = {0} AND status NOT IN ('pago')", asaasId, novoStatus);

            // Fluxo A (ADR-034): pagamento de assinatura do médico, casado por subscription.
            var subId = pay.TryGetProperty("subscription", out var sb) ? sb.GetString() : null;
            if (!string.IsNullOrEmpty(subId))
            {
                if (novoStatus == "pago")
                {
                    var valor = pay.TryGetProperty("value", out var vv) && vv.TryGetDecimal(out var d) ? d : 0m;
                    var refMes = DateTime.UtcNow.ToString("yyyy-MM");
                    // Registra o pagamento (idempotente por asaas_payment_id) e ativa a assinatura.
                    await db.Database.ExecuteRawAsync(@"
                        INSERT INTO pagamentos_manuais
                            (id, assinatura_id, valor, moeda, referencia, status, metodo, pago_em, asaas_payment_id)
                        SELECT gen_random_uuid(), a.id, {2}, a.moeda, {3}, 'confirmado', 'asaas', NOW(), {1}
                        FROM assinaturas a WHERE a.asaas_subscription_id = {0}
                        ON CONFLICT (asaas_payment_id) DO NOTHING", subId, asaasId, valor, refMes);
                    await db.Database.ExecuteRawAsync(@"
                        UPDATE assinaturas SET status = 'ativa', atualizado_em = NOW()
                        WHERE asaas_subscription_id = {0} AND status <> 'cancelada'", subId);
                }
                else if (novoStatus == "vencido")
                {
                    await db.Database.ExecuteRawAsync(@"
                        UPDATE assinaturas SET status = 'suspensa', atualizado_em = NOW()
                        WHERE asaas_subscription_id = {0} AND status <> 'cancelada'", subId);
                }
            }

            return Results.Ok(new { ok = true });
        }).WithTags("cobrancas").AllowAnonymous();
    }

    private static async Task<Guid?> GetMedicoIdAsync(AppDbContext db, ClaimsPrincipal user)
    {
        var sub = user.FindFirst("sub")?.Value;
        if (!Guid.TryParse(sub, out var userId)) return null;
        return await db.Database.ExecuteScalarAsync<Guid?>(
            "SELECT id FROM medicos WHERE usuario_id = {0}", userId);
    }
}

public record CriarCobrancaRequest(Guid PacienteId, decimal Valor, string? Descricao, Guid? ConsultaId, DateOnly? Vencimento);

public record MinhaAssinatura(string Plano, decimal ValorMensal, string Moeda, string Status, DateTime? TrialAte, string? AsaasSubscriptionId);
public record PagamentoMedico(decimal Valor, string? Referencia, string? Metodo, DateTime? PagoEm);

public record CobrancaItem(
    Guid Id, string Descricao, decimal Valor, string Metodo, string Status, DateOnly? Vencimento,
    DateTime? PagoEm, string? AsaasInvoiceUrl, string NfseStatus, string? NfseUrl,
    Guid PacienteId, string? PacienteNome);

public record CobrancaPortal(
    Guid Id, string Descricao, decimal Valor, string Status, DateOnly? Vencimento,
    string? AsaasInvoiceUrl, string? PixCopiaCola, string? PixQrBase64);

public record FinanceiroResumo(
    decimal RecebidoMes, decimal PendenteTotal, decimal VencidoTotal,
    int PagasMes, int EmitidasMes, int PacientesInativos);

file record PacienteCobranca(Guid PacienteId, string? Nome, string? Email, string? Telefone, string? Cpf);
file record AsaasMedicoCfg(string? WalletId, decimal FeePct);
