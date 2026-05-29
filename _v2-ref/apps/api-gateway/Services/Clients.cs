using ApiGateway.Models;
using System.Net.Http.Json;

namespace ApiGateway.Services;

public record MpPreferenceResponse(string PreferenceId, string InitPoint);
public record MpPayment(string Id, string PreferenceId, string Status,
    decimal TransactionAmount, string PayerEmail, string PayerName);

public class MercadoPagoClient(HttpClient http, ILogger<MercadoPagoClient> logger)
{
    public async Task<CreatePreferenceResponse> CreatePreference(CreatePreferenceRequest req)
    {
        var payload = new
        {
            items = new[]
            {
                new
                {
                    title = req.Titulo,
                    quantity = 1,
                    unit_price = (double)req.Valor,
                    currency_id = "BRL"
                }
            },
            external_reference = req.ConversaId?.ToString(),
            payer = req.CustomerEmail is null ? null : new { email = req.CustomerEmail }
        };

        var resp = await http.PostAsJsonAsync("checkout/preferences", payload);
        resp.EnsureSuccessStatusCode();

        var data = await resp.Content.ReadFromJsonAsync<MpPreferenceRaw>()
                   ?? throw new InvalidOperationException("MP retornou null");

        logger.LogInformation("Preferência criada: {Id}", data.id);
        return new CreatePreferenceResponse(data.init_point, data.id);
    }

    public async Task<MpPayment?> GetPayment(string paymentId)
    {
        var resp = await http.GetAsync($"v1/payments/{paymentId}");
        if (!resp.IsSuccessStatusCode) return null;

        var raw = await resp.Content.ReadFromJsonAsync<MpPaymentRaw>();
        if (raw is null) return null;

        return new MpPayment(
            Id: raw.id.ToString()!,
            PreferenceId: raw.preference_id ?? "",
            Status: raw.status ?? "unknown",
            TransactionAmount: (decimal)(raw.transaction_amount ?? 0),
            PayerEmail: raw.payer?.email ?? "",
            PayerName: $"{raw.payer?.first_name} {raw.payer?.last_name}".Trim());
    }

    // ---- DTOs internos ----
    private record MpPreferenceRaw(string id, string init_point);
    private record MpPaymentRaw(
        long id,
        string? preference_id,
        string? status,
        double? transaction_amount,
        MpPayer? payer);
    private record MpPayer(string? email, string? first_name, string? last_name);
}

public class NfeIoClient(
    HttpClient http,
    IConfiguration config,
    ILogger<NfeIoClient> logger,
    Data.AppDbContext db)
{
    public async Task<NotaFiscal?> EmitirAsync(Pagamento pag, string clienteEmail, string clienteNome)
    {
        var companyId = config["NFEIO_COMPANY_ID"];
        if (string.IsNullOrEmpty(companyId))
        {
            logger.LogWarning("NFEIO_COMPANY_ID não configurado");
            return null;
        }

        var nf = new NotaFiscal
        {
            Id = Guid.NewGuid(),
            PagamentoId = pag.Id,
            NfeIoId = "",
            Status = "pendente",
            CriadaEm = DateTime.UtcNow
        };

        try
        {
            var payload = new
            {
                cityServiceCode = "PERSONALIZE", // código do serviço no seu município
                description = pag.Descricao,
                servicesAmount = (double)pag.Valor,
                borrower = new
                {
                    name = clienteNome,
                    email = clienteEmail,
                    federalTaxNumber = (string?)null // CPF/CNPJ se tiver
                }
            };

            var resp = await http.PostAsJsonAsync(
                $"v2/companies/{companyId}/serviceinvoices", payload);

            if (resp.IsSuccessStatusCode)
            {
                var raw = await resp.Content.ReadFromJsonAsync<NfeIoResponse>();
                nf.NfeIoId = raw?.id ?? "";
                nf.UrlPdf = raw?.pdfUrl;
                nf.Status = "emitida";
                logger.LogInformation("NF emitida: {Id}", nf.NfeIoId);
            }
            else
            {
                nf.Status = "erro";
                logger.LogError("NFE.io retornou {Status}", resp.StatusCode);
            }
        }
        catch (Exception ex)
        {
            nf.Status = "erro";
            logger.LogError(ex, "Erro emitindo NF");
        }

        db.NotasFiscais.Add(nf);
        await db.SaveChangesAsync();
        return nf;
    }

    private record NfeIoResponse(string id, string? pdfUrl);
}
