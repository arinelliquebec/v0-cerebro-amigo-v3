using ApiGateway.Data;
using Microsoft.EntityFrameworkCore;
using System.Security.Cryptography;
using System.Text;

namespace ApiGateway.Services;

/// <summary>
/// Onboarding de médico: cria usuario + medico + assinatura trial + token de convite
/// (atômico) e envia o e-mail de ativação. Extraído de AdminEndpoints (ADR-046) para
/// ser reusado por dois chamadores:
///   - admin (POST /api/v1/admin/onboarding/medico): AllowCrmSoftFail = true.
///   - self-signup público (POST /api/v1/auth/medico/signup, ADR-046): AllowCrmSoftFail = false.
///
/// O e-mail de ativação (fluxo /ativar-conta) é a prova de posse do e-mail — não há
/// senha no onboarding nem JWT na hora. Token = mesma mecânica do convite admin.
/// </summary>
public sealed class MedicoOnboardingService
{
    private static readonly string[] PlanosValidos = { "trial", "starter", "pro", "enterprise" };

    private readonly AppDbContext _db;
    private readonly CfmClient _cfm;
    private readonly ResendClient _resend;
    private readonly IConfiguration _cfg;

    public MedicoOnboardingService(AppDbContext db, CfmClient cfm, ResendClient resend, IConfiguration cfg)
    {
        _db = db; _cfm = cfm; _resend = resend; _cfg = cfg;
    }

    public async Task<OnboardMedicoResult> OnboardAsync(OnboardMedicoInput input)
    {
        var email = (input.Email ?? "").Trim().ToLowerInvariant();
        var nome  = (input.Nome  ?? "").Trim();
        var crm   = (input.Crm   ?? "").Trim();
        if (string.IsNullOrEmpty(email) || string.IsNullOrEmpty(nome) || string.IsNullOrEmpty(crm))
            return OnboardMedicoResult.Fail("campos_obrigatorios", 400, "nome, email e CRM são obrigatórios");

        var plano = (input.Plano ?? "trial").ToLowerInvariant();
        if (!PlanosValidos.Contains(plano))
            return OnboardMedicoResult.Fail("plano_invalido", 400);

        var crmUf = (input.CrmUf ?? "").Trim().ToUpperInvariant();
        if (string.IsNullOrEmpty(crmUf))
            return OnboardMedicoResult.Fail("crm_uf_obrigatorio", 400);

        if (await _db.Database.ExistsAsync("SELECT 1 FROM usuarios WHERE email = {0}", email))
            return OnboardMedicoResult.Fail("email_em_uso", 409);

        // Valida CRM contra o CFM via Infosimples (hard gate) — ANTES de gravar qualquer
        // coisa, senão um CFM fora do ar deixava o usuário órfão no banco.
        var val = await _cfm.ValidarAsync(crm, crmUf, nome);
        if (val.Erro is not null)
        {
            if (val.Erro.StartsWith("INFOSIMPLES_TOKEN"))
                return OnboardMedicoResult.Fail("crm_validacao_nao_configurada", 500);

            if (input.AllowCrmSoftFail)
                // admin: CFM indisponível após retries → cria conta PendenteVerificacao
                // (revisão manual depois). Não bloqueia o onboarding administrativo.
                val = new CrmValidationResult(true, "PendenteVerificacao", null, null, null);
            else
                // self-signup: SEM soft-fail (ADR-046). CFM fora do ar → não cria conta;
                // peça p/ tentar de novo. Evita conta pública não-verificada.
                return OnboardMedicoResult.Fail("crm_indisponivel", 503,
                    "Não foi possível validar seu CRM agora. Tente novamente em instantes.");
        }

        // "NaoValidado" = bypass (CRM_VALIDATION_ENABLED=false). "PendenteVerificacao" = soft-fail (só admin).
        var situacao = val.Situacao ?? "NaoValidado";
        bool aceita = input.AllowCrmSoftFail
            ? (val.Encontrado && (Eq(situacao, "Regular") || Eq(situacao, "NaoValidado") || Eq(situacao, "PendenteVerificacao")))
            : (val.Encontrado && (Eq(situacao, "Regular") || Eq(situacao, "NaoValidado")));
        if (!aceita)
            return OnboardMedicoResult.Fail("crm_invalido", 422, situacao: situacao);

        // Tudo validado → grava ATÔMICO (usuario + medico + assinatura + token).
        // Senha placeholder: a conta só loga depois de ativar (define senha em /ativar-conta).
        var usuarioId = Guid.NewGuid();
        var medicoId  = Guid.NewGuid();
        var placeholder = "!" + Convert.ToBase64String(RandomNumberGenerator.GetBytes(16));
        var cpf = new string((input.Cpf ?? "").Where(char.IsDigit).ToArray());
        var assinaturaId = Guid.NewGuid();
        var tokenBytes = RandomNumberGenerator.GetBytes(32);
        var token = Convert.ToBase64String(tokenBytes).Replace("+", "-").Replace("/", "_").Replace("=", "");
        var tokenHash = Sha256(token);

        await using (var tx = await _db.Database.BeginTransactionAsync())
        {
            await _db.Database.ExecuteSqlRawAsync(
                "INSERT INTO usuarios (id, email, senha_hash, nome, role) VALUES ({0},{1},{2},{3},'medico')",
                usuarioId, email, placeholder, nome);

            await _db.Database.ExecuteSqlRawAsync(
                "INSERT INTO medicos (id, usuario_id, nome, crm, crm_uf, cpf, especialidade, crm_situacao, crm_validado_em, crm_fonte, crm_nome_cfm, signup_source, checkup_rid) " +
                "VALUES ({0},{1},{2},{3},NULLIF({4},''),NULLIF({5},''),'psiquiatria',{6},NOW(),'infosimples',NULLIF({7},''),{8},NULLIF({9},''))",
                medicoId, usuarioId, nome, crm, crmUf, cpf, situacao, val.Nome ?? "",
                input.SignupSource, input.CheckupRid ?? "");

            await _db.Database.ExecuteSqlRawAsync(@"
                INSERT INTO assinaturas (id, medico_id, plano, valor_mensal, status, trial_ate)
                VALUES ({0},{1},{2},{3},'trial', NOW() + INTERVAL '30 days')",
                assinaturaId, medicoId, plano, input.ValorMensal);

            await _db.Database.ExecuteSqlRawAsync(
                "INSERT INTO medico_invite_tokens (usuario_id, token_hash, expira_em) VALUES ({0},{1}, NOW() + INTERVAL '24 hours')",
                usuarioId, tokenHash);

            await tx.CommitAsync();
        }

        // Email com link de ativação (fora da transação — falha não desfaz a conta).
        var baseUrl = _cfg["PORTAL_PACIENTE_URL"] ?? "http://localhost:3000";
        var link = $"{baseUrl}/ativar-conta?token={token}";
        var html = $"""
            <p>Olá, {nome}!</p>
            <p>Você foi convidado(a) para acessar o <strong>Cérebro Amigo</strong>.</p>
            <p><a href="{link}">Clique aqui para criar sua senha</a></p>
            <p>O link é válido por 24 horas.</p>
            <p>Se você não esperava este convite, pode ignorar este e-mail.</p>
            """;
        var txt = $"Olá, {nome}!\n\nCrie sua senha de acesso ao Cérebro Amigo:\n{link}\n\nVálido por 24 horas.";

        SendEmailResult emailResult;
        try { emailResult = await _resend.SendAsync(email, "Convite — Cérebro Amigo", html, txt); }
        catch (Exception ex) { emailResult = new SendEmailResult(false, null, ex.Message); }

        return new OnboardMedicoResult(
            Success: true,
            UsuarioId: usuarioId,
            MedicoId: medicoId,
            EmailEnviado: emailResult.Success,
            EmailErro: emailResult.Error,
            AtivarContaUrl: emailResult.Success ? null : link,
            CrmPendente: Eq(situacao, "PendenteVerificacao"),
            Error: null,
            Situacao: situacao,
            StatusCode: 201);

        static bool Eq(string a, string b) => string.Equals(a, b, StringComparison.OrdinalIgnoreCase);
    }

    private static string Sha256(string input)
    {
        var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(input));
        return Convert.ToHexString(bytes).ToLowerInvariant();
    }
}

/// <param name="SignupSource">'admin' | 'self' | 'checkup' — origem do cadastro (atribuição).</param>
/// <param name="CheckupRid">rid de 8 chars do Check-up (quando veio do QR), senão null.</param>
/// <param name="AllowCrmSoftFail">admin=true (tolera PendenteVerificacao); self=false (Regular obrigatório).</param>
public sealed record OnboardMedicoInput(
    string? Nome,
    string? Email,
    string? Crm,
    string? CrmUf,
    string? Cpf,
    string? Plano,
    decimal ValorMensal,
    string SignupSource,
    string? CheckupRid,
    bool AllowCrmSoftFail);

public sealed record OnboardMedicoResult(
    bool Success,
    Guid? UsuarioId,
    Guid? MedicoId,
    bool EmailEnviado,
    string? EmailErro,
    string? AtivarContaUrl,
    bool CrmPendente,
    string? Error,
    string? Situacao,
    int StatusCode)
{
    /// <summary>Mensagem amigável opcional (pt-BR) p/ erros.</summary>
    public string? Mensagem { get; init; }

    public static OnboardMedicoResult Fail(string error, int statusCode, string? mensagem = null, string? situacao = null)
        => new(false, null, null, false, null, null, false, error, situacao, statusCode) { Mensagem = mensagem };
}
