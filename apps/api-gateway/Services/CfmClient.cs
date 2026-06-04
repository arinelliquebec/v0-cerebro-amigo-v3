using System.Net.Http.Json;
using System.Text.Json.Serialization;

namespace ApiGateway.Services;

/// <summary>
/// Cliente HTTP tipado para a API Infosimples — consulta cadastro CFM.
///
/// Valida se um CRM existe e está com situação "Regular" (apto a exercer).
/// CRM brasileiro não tem dígito verificador universal, então a única fonte
/// de verdade é o cadastro do CFM.
///
/// Configuração:
///   INFOSIMPLES_TOKEN       (obrigatório) — token da API Infosimples
///   INFOSIMPLES_CFM_URL     (opcional)    — override de URL (default abaixo)
///   CRM_VALIDATION_ENABLED  (opcional)    — false = bypass dev/emergência
///
/// LGPD: logar só CRM+UF+situação/status HTTP. Nunca logar resposta crua.
/// </summary>
public sealed class CfmClient
{
    private readonly HttpClient _http;
    private readonly ILogger<CfmClient> _logger;
    private readonly string _token;
    private readonly bool _enabled;

    public CfmClient(HttpClient http, IConfiguration cfg, ILogger<CfmClient> logger)
    {
        _http = http;
        _logger = logger;

        _token = cfg["INFOSIMPLES_TOKEN"] ?? "";
        _enabled = !string.Equals(cfg["CRM_VALIDATION_ENABLED"], "false",
            StringComparison.OrdinalIgnoreCase);

        var baseUrl = cfg["INFOSIMPLES_CFM_URL"]
            ?? "https://api.infosimples.com/api/v2/consultas/cfm/cadastro";

        _http.BaseAddress ??= new Uri(baseUrl);
        // O scrape do portal CFM pela Infosimples é lento (até ~60s). Timeout folgado.
        _http.Timeout = TimeSpan.FromSeconds(100);
    }

    /// <summary>
    /// Consulta o CFM via Infosimples.
    /// </summary>
    /// <param name="crm">Número do CRM (só dígitos/alfanumérico).</param>
    /// <param name="uf">UF de inscrição (2 letras, ex.: "SP").</param>
    /// <param name="nome">Nome do médico — a consulta CFM/Infosimples usa o nome
    ///   além da inscrição (a busca do portal CFM é por nome). Sem ele, a origem
    ///   pode não retornar dados (code 612).</param>
    /// <param name="ct">CancellationToken.</param>
    /// <returns>
    ///   <c>Erro != null</c> → serviço indisponível (não é "não encontrado").<br/>
    ///   <c>Encontrado = false</c> → CRM não existe no CFM.<br/>
    ///   <c>Situacao != "Regular"</c> → médico suspenso/cancelado.
    /// </returns>
    public async Task<CrmValidationResult> ValidarAsync(
        string crm, string uf, string? nome = null, CancellationToken ct = default)
    {
        if (!_enabled)
        {
            _logger.LogWarning(
                "CRM_VALIDATION_ENABLED=false: CRM {Crm}/{Uf} não validado contra CFM", crm, uf);
            return new CrmValidationResult(
                Encontrado: true, Situacao: "NaoValidado",
                Nome: null, Especialidade: null, Erro: null);
        }

        if (string.IsNullOrEmpty(_token))
        {
            _logger.LogError("INFOSIMPLES_TOKEN não configurado — validação CRM impossível");
            return new CrmValidationResult(
                Encontrado: false, Situacao: null,
                Nome: null, Especialidade: null, Erro: "INFOSIMPLES_TOKEN ausente");
        }

        // A consulta CFM/cadastro da Infosimples só retorna dados buscando por NOME (+uf);
        // busca por inscrição devolve vazio (code 612). Então: nome é obrigatório.
        if (string.IsNullOrWhiteSpace(nome))
        {
            _logger.LogWarning("CRM {Crm}/{Uf}: nome ausente — CFM só consulta por nome", crm, uf);
            return new CrmValidationResult(false, null, null, null, "nome ausente");
        }

        var crmDigits = SoDigitos(crm).TrimStart('0');

        try
        {
            // POST form-encoded: busca por nome + uf. A inscrição é casada localmente
            // nos resultados (o CFM pode ter homônimos → escolhemos pela inscrição).
            var content = new FormUrlEncodedContent(new[]
            {
                new KeyValuePair<string, string>("token", _token),
                new KeyValuePair<string, string>("nome",  nome.Trim()),
                new KeyValuePair<string, string>("uf",    uf.ToUpperInvariant()),
            });

            var resp = await _http.PostAsync("", content, ct);
            var statusCode = (int)resp.StatusCode;
            if (!resp.IsSuccessStatusCode)
            {
                _logger.LogWarning(
                    "Infosimples HTTP {Status} ao consultar CRM {Crm}/{Uf}", statusCode, crm, uf);
                return new CrmValidationResult(false, null, null, null, $"Infosimples HTTP {statusCode}");
            }

            InfosimplesResponse? body;
            try
            {
                body = await resp.Content.ReadFromJsonAsync<InfosimplesResponse>(cancellationToken: ct);
            }
            catch
            {
                _logger.LogWarning("Infosimples: resposta não-parsável para CRM {Crm}/{Uf}", crm, uf);
                return new CrmValidationResult(false, null, null, null, "resposta inválida");
            }

            // Semântica Infosimples:
            //   600 = nome não encontrado → trata como não-encontrado (→ 422).
            //   612 / não-200 = origem (portal CFM) instável → indisponível (→ 503, retry),
            //                   p/ NUNCA rejeitar médico válido por hiccup do CFM.
            if (body is null)
                return new CrmValidationResult(false, null, null, null, "resposta inválida");

            if (body.Code == 600)
            {
                _logger.LogInformation("CFM: nome não encontrado p/ CRM {Crm}/{Uf} (code 600)", crm, uf);
                return new CrmValidationResult(false, null, null, null, Erro: null);
            }

            if (body.Code != 200 || body.Data is null || body.Data.Count == 0)
            {
                _logger.LogWarning(
                    "Infosimples não confirmou CRM {Crm}/{Uf} (code {Code}: {Msg}) — indisponível",
                    crm, uf, body.Code, body.CodeMessage);
                return new CrmValidationResult(false, null, null, null, Erro: $"Infosimples code {body.Code}");
            }

            // Casa a inscrição informada (CRM) com algum registro retornado pelo nome.
            var match = body.Data.FirstOrDefault(d =>
                crmDigits.Length > 0 && SoDigitos(d.Inscricao ?? "").TrimStart('0') == crmDigits);

            if (match is null)
            {
                _logger.LogInformation(
                    "CFM: nome encontrado mas CRM {Crm}/{Uf} não confere ({Count} registro(s))",
                    crm, uf, body.Data.Count);
                return new CrmValidationResult(false, null, null, null, Erro: null); // → 422 (não confere)
            }

            var situacao = match.Situacao ?? "";
            // LGPD: logar só situação, nunca PII desnecessária
            _logger.LogInformation("CRM {Crm}/{Uf} consultado — situação: {Situacao}", crm, uf, situacao);
            return new CrmValidationResult(true, situacao, match.Nome, match.Especialidade, null);
        }
        catch (Exception ex) when (ex is HttpRequestException or TaskCanceledException)
        {
            _logger.LogError(ex, "Infosimples inalcançável ao consultar CRM {Crm}/{Uf}", crm, uf);
            return new CrmValidationResult(
                Encontrado: false, Situacao: null,
                Nome: null, Especialidade: null,
                Erro: $"infosimples inalcançável: {ex.Message}");
        }
    }

    private static string SoDigitos(string s) => new(s.Where(char.IsDigit).ToArray());

    // ─── DTOs ────────────────────────────────────────────────────────────────

    private sealed class InfosimplesResponse
    {
        [JsonPropertyName("code")]
        public int Code { get; set; }

        [JsonPropertyName("code_message")]
        public string? CodeMessage { get; set; }

        [JsonPropertyName("data")]
        public List<InfosimplesMedicoData>? Data { get; set; }
    }

    private sealed class InfosimplesMedicoData
    {
        [JsonPropertyName("nome")]
        public string? Nome { get; set; }

        [JsonPropertyName("situacao")]
        public string? Situacao { get; set; }

        [JsonPropertyName("especialidade")]
        public string? Especialidade { get; set; }

        [JsonPropertyName("inscricao")]
        public string? Inscricao { get; set; }
    }
}

/// <summary>Resultado da consulta CRM no CFM via Infosimples.</summary>
/// <param name="Encontrado">CRM existe na base do CFM.</param>
/// <param name="Situacao">Regular | Cancelado | Suspenso | NaoValidado | null.</param>
/// <param name="Nome">Nome retornado pelo CFM (p/ cross-check, pode ser null).</param>
/// <param name="Especialidade">Especialidade registrada no CFM.</param>
/// <param name="Erro">
///   Descrição de erro de comunicação/serviço. null = consulta executou
///   (mesmo que não tenha encontrado). Erro != null ⇒ CFM indisponível.
/// </param>
public sealed record CrmValidationResult(
    bool Encontrado,
    string? Situacao,
    string? Nome,
    string? Especialidade,
    string? Erro);
