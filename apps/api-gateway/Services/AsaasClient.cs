using System.Net.Http.Json;
using System.Text.Json;

namespace ApiGateway.Services;

/// <summary>
/// Cliente HTTP tipado para o Asaas (gateway de pagamento BR — Pix/boleto/cartão).
///
/// Fluxo B (ADR-033): o MÉDICO cobra o PACIENTE pela consulta. A cobrança é criada
/// pela CONTA-MÃE (plataforma) com SPLIT para a `walletId` da subconta do médico —
/// o líquido cai pro médico, a plataforma fica com a taxa. O gateway só orquestra;
/// a cobrança LEGAL e a NFS-e vivem no Asaas.
///
/// Config (env):
///   ASAAS_API_KEY        (obrigatório — conta-mãe)
///   ASAAS_ENV            (sandbox|prod; default sandbox)
///   ASAAS_API_BASE       (override opcional)
///
/// Sem key configurada o gateway sobe normal — só os endpoints de cobrança
/// respondem erro claro (não derruba o serviço).
/// </summary>
public sealed class AsaasClient
{
    private readonly HttpClient _http;
    private readonly IConfiguration _cfg;
    private readonly ILogger<AsaasClient> _logger;

    public AsaasClient(HttpClient http, IConfiguration cfg, ILogger<AsaasClient> logger)
    {
        _http = http;
        _cfg = cfg;
        _logger = logger;
    }

    public bool Configurado => !string.IsNullOrWhiteSpace(_cfg["ASAAS_API_KEY"]);

    private (string apiKey, string baseUrl)? ResolveConfig()
    {
        var k = _cfg["ASAAS_API_KEY"];
        if (string.IsNullOrWhiteSpace(k)) return null;
        var explicitBase = _cfg["ASAAS_API_BASE"];
        var baseUrl = !string.IsNullOrWhiteSpace(explicitBase)
            ? explicitBase!.TrimEnd('/')
            : (string.Equals(_cfg["ASAAS_ENV"], "prod", StringComparison.OrdinalIgnoreCase)
                ? "https://api.asaas.com/v3"
                : "https://sandbox.asaas.com/api/v3");
        return (k, baseUrl);
    }

    private HttpRequestMessage Req(HttpMethod m, string baseUrl, string apiKey, string path, object? body = null)
    {
        var r = new HttpRequestMessage(m, $"{baseUrl}{path}");
        r.Headers.Add("access_token", apiKey);
        if (body is not null) r.Content = JsonContent.Create(body);
        return r;
    }

    /// <summary>
    /// Cria (customer + cobrança Pix) e busca o QR/copia-e-cola. Com walletId +
    /// taxa da plataforma, aplica split (médico recebe o líquido).
    /// </summary>
    public async Task<AsaasCobrancaResult> CriarCobrancaPixAsync(AsaasCobrancaInput inp, CancellationToken ct = default)
    {
        var cfg = ResolveConfig();
        if (cfg is null) return AsaasCobrancaResult.Falha("ASAAS_API_KEY não configurada no gateway");
        var (apiKey, baseUrl) = cfg.Value;

        try
        {
            // 1) Customer (idempotência simples por externalReference = paciente_id).
            var custBody = new
            {
                name = inp.PacienteNome,
                cpfCnpj = string.IsNullOrWhiteSpace(inp.PacienteCpf) ? null : inp.PacienteCpf,
                email = inp.PacienteEmail,
                mobilePhone = inp.PacienteTelefone,
                externalReference = inp.PacienteId,
            };
            var custResp = await _http.SendAsync(Req(HttpMethod.Post, baseUrl, apiKey, "/customers", custBody), ct);
            var custJson = await custResp.Content.ReadAsStringAsync(ct);
            if (!custResp.IsSuccessStatusCode)
                return AsaasCobrancaResult.Falha($"Asaas customer {(int)custResp.StatusCode}: {Resumo(custJson)}");
            using var custDoc = JsonDocument.Parse(custJson);
            var customerId = custDoc.RootElement.GetProperty("id").GetString();

            // 2) Pagamento Pix (+ split opcional p/ a subconta do médico).
            object? split = null;
            if (!string.IsNullOrWhiteSpace(inp.WalletId) && inp.PlataformaFeePct < 100)
            {
                var medicoPct = Math.Round(100m - inp.PlataformaFeePct, 2);
                split = new[] { new { walletId = inp.WalletId, percentualValue = medicoPct } };
            }
            var payBody = new
            {
                customer = customerId,
                billingType = "PIX",
                value = inp.Valor,
                dueDate = inp.Vencimento.ToString("yyyy-MM-dd"),
                description = inp.Descricao,
                externalReference = inp.CobrancaId,
                split,
            };
            var payResp = await _http.SendAsync(Req(HttpMethod.Post, baseUrl, apiKey, "/payments", payBody), ct);
            var payJson = await payResp.Content.ReadAsStringAsync(ct);
            if (!payResp.IsSuccessStatusCode)
                return AsaasCobrancaResult.Falha($"Asaas payment {(int)payResp.StatusCode}: {Resumo(payJson)}");
            using var payDoc = JsonDocument.Parse(payJson);
            var pe = payDoc.RootElement;
            var asaasId = pe.GetProperty("id").GetString()!;
            var invoiceUrl = pe.TryGetProperty("invoiceUrl", out var iu) ? iu.GetString() : null;
            var status = pe.TryGetProperty("status", out var st) ? st.GetString() : "PENDING";

            // 3) QR Pix (copia-e-cola + imagem).
            string? copiaCola = null, qrBase64 = null;
            try
            {
                var qrResp = await _http.SendAsync(Req(HttpMethod.Get, baseUrl, apiKey, $"/payments/{asaasId}/pixQrCode"), ct);
                if (qrResp.IsSuccessStatusCode)
                {
                    using var qrDoc = JsonDocument.Parse(await qrResp.Content.ReadAsStringAsync(ct));
                    copiaCola = qrDoc.RootElement.TryGetProperty("payload", out var pl) ? pl.GetString() : null;
                    qrBase64 = qrDoc.RootElement.TryGetProperty("encodedImage", out var ei) ? ei.GetString() : null;
                }
            }
            catch (Exception ex) { _logger.LogWarning(ex, "Asaas pixQrCode falhou (segue sem QR)"); }

            return AsaasCobrancaResult.Ok(asaasId, invoiceUrl, copiaCola, qrBase64, status);
        }
        catch (Exception ex) when (ex is HttpRequestException or TaskCanceledException)
        {
            _logger.LogError(ex, "Asaas inalcançável");
            return AsaasCobrancaResult.Falha($"Asaas inalcançável: {ex.Message}");
        }
        catch (JsonException ex)
        {
            _logger.LogError(ex, "Asaas resposta inválida");
            return AsaasCobrancaResult.Falha("Asaas retornou resposta inesperada");
        }
    }

    private static string Resumo(string body)
    {
        body = body.Trim();
        return body.Length > 300 ? body[..300] : body;
    }
}

public record AsaasCobrancaInput(
    string CobrancaId, string PacienteId, string PacienteNome,
    string? PacienteCpf, string? PacienteEmail, string? PacienteTelefone,
    decimal Valor, DateOnly Vencimento, string Descricao,
    string? WalletId, decimal PlataformaFeePct);

public sealed record AsaasCobrancaResult(
    bool Sucesso, string? AsaasId, string? InvoiceUrl, string? PixCopiaCola,
    string? PixQrBase64, string? Status, string? Erro)
{
    public static AsaasCobrancaResult Ok(string id, string? url, string? copia, string? qr, string? status) =>
        new(true, id, url, copia, qr, status, null);
    public static AsaasCobrancaResult Falha(string erro) => new(false, null, null, null, null, null, erro);
}
