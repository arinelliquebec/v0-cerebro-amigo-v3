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
        _http.Timeout = TimeSpan.FromSeconds(20);
    }

    /// <summary>
    /// Consulta o CFM via Infosimples.
    /// </summary>
    /// <param name="crm">Número do CRM (só dígitos/alfanumérico).</param>
    /// <param name="uf">UF de inscrição (2 letras, ex.: "SP").</param>
    /// <param name="ct">CancellationToken.</param>
    /// <returns>
    ///   <c>Erro != null</c> → serviço indisponível (não é "não encontrado").<br/>
    ///   <c>Encontrado = false</c> → CRM não existe no CFM.<br/>
    ///   <c>Situacao != "Regular"</c> → médico suspenso/cancelado.
    /// </returns>
    public async Task<CrmValidationResult> ValidarAsync(
        string crm, string uf, CancellationToken ct = default)
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

        var payload = new InfosimplesRequest(
            Token: _token,
            Inscricao: crm.Replace(" ", ""),
            Uf: uf.ToUpperInvariant());

        try
        {
            // Infosimples espera POST com parâmetros form-encoded
            var content = new FormUrlEncodedContent(new[]
            {
                new KeyValuePair<string, string>("token",    payload.Token),
                new KeyValuePair<string, string>("inscricao", payload.Inscricao),
                new KeyValuePair<string, string>("uf",       payload.Uf),
            });

            var resp = await _http.PostAsync("", content, ct);
            var statusCode = (int)resp.StatusCode;

            // Infosimples retorna 200 mesmo p/ "não encontrado" (code 600 no body)
            if (!resp.IsSuccessStatusCode)
            {
                _logger.LogWarning(
                    "Infosimples HTTP {Status} ao consultar CRM {Crm}/{Uf}", statusCode, crm, uf);
                return new CrmValidationResult(
                    Encontrado: false, Situacao: null,
                    Nome: null, Especialidade: null,
                    Erro: $"Infosimples HTTP {statusCode}");
            }

            InfosimplesResponse? body;
            try
            {
                body = await resp.Content.ReadFromJsonAsync<InfosimplesResponse>(
                    cancellationToken: ct);
            }
            catch
            {
                _logger.LogWarning("Infosimples: resposta não-parsável para CRM {Crm}/{Uf}", crm, uf);
                return new CrmValidationResult(
                    Encontrado: false, Situacao: null,
                    Nome: null, Especialidade: null, Erro: "resposta inválida");
            }

            // Semântica Infosimples:
            //   600 = consulta não encontrou registro → CRM realmente não existe (→ 422).
            //   612 = "site de origem não retornou dados" = portal CFM instável/indisponível.
            //   Só (200 COM dados) é "encontrado". Qualquer outra coisa NÃO é "CRM inválido"
            //   — é "não deu pra confirmar" → Erro (503/retry), p/ NUNCA rejeitar médico
            //   válido por hiccup do CFM.
            if (body is null)
            {
                _logger.LogWarning("Infosimples: corpo nulo para CRM {Crm}/{Uf}", crm, uf);
                return new CrmValidationResult(false, null, null, null, "resposta inválida");
            }

            if (body.Code == 600)
            {
                _logger.LogInformation("CRM {Crm}/{Uf} não encontrado no CFM (code 600)", crm, uf);
                return new CrmValidationResult(false, null, null, null, Erro: null);
            }

            if (body.Code != 200 || body.Data is null || body.Data.Count == 0)
            {
                _logger.LogWarning(
                    "Infosimples não confirmou CRM {Crm}/{Uf} (code {Code}: {Msg}) — tratado como indisponível",
                    crm, uf, body.Code, body.CodeMessage);
                return new CrmValidationResult(
                    false, null, null, null, Erro: $"Infosimples code {body.Code}");
            }

            var dado = body.Data[0];
            var situacao = dado.Situacao ?? "";
            // LGPD: logar só situação, nunca conteúdo clínico/PII desnecessária
            _logger.LogInformation(
                "CRM {Crm}/{Uf} consultado — situação: {Situacao}", crm, uf, situacao);

            return new CrmValidationResult(
                Encontrado: true,
                Situacao: situacao,
                Nome: dado.Nome,
                Especialidade: dado.Especialidade,
                Erro: null);
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

    // ─── DTOs ────────────────────────────────────────────────────────────────

    private sealed record InfosimplesRequest(string Token, string Inscricao, string Uf);

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
