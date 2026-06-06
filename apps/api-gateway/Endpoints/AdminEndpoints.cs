using ApiGateway.Auth;
using ApiGateway.Data;
using ApiGateway.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace ApiGateway.Endpoints;

/// <summary>
/// Painel do dono da plataforma (role=owner / role=admin).
/// Todos os endpoints requerem policy "admin_geral" (owner OU admin).
/// Operações destrutivas (change role) exigem policy "owner".
/// ZERO escopo de tenant — vê tudo da plataforma.
/// </summary>
public static class AdminEndpoints
{
    public static void Map(WebApplication app)
    {
        var g = app.MapGroup("/api/v1/admin")
            .WithTags("admin")
            .RequireAuthorization("admin_geral");

        // ─── Métricas gerais da plataforma ───────────────────────────────────

        g.MapGet("/metricas", async (AppDbContext db) =>
        {
            var agora = DateTime.UtcNow;
            var inicioMes = new DateTime(agora.Year, agora.Month, 1, 0, 0, 0, DateTimeKind.Utc);
            var sete = agora.AddDays(-7);

            // Médicos e pacientes
            var totalMedicos = await db.Database.ExecuteScalarAsync<int?>("SELECT COUNT(*)::int FROM medicos") ?? 0;
            var totalPacientes = await db.Database.ExecuteScalarAsync<int?>("SELECT COUNT(*)::int FROM clientes") ?? 0;

            // Ativos 7 dias
            var medicosAtivos7d = await db.Database.ExecuteScalarAsync<int?>(
                "SELECT COUNT(DISTINCT m.id)::int FROM medicos m " +
                "JOIN pacientes p ON p.medico_responsavel_id = m.id " +
                "JOIN conversas c ON c.cliente_id = p.cliente_id " +
                "JOIN mensagens ms ON ms.conversa_id = c.id " +
                "WHERE ms.criada_em >= {0}", sete) ?? 0;

            var pacientesAtivos7d = await db.Database.ExecuteScalarAsync<int?>(
                "SELECT COUNT(DISTINCT p.cliente_id)::int FROM pacientes p " +
                "JOIN conversas c ON c.cliente_id = p.cliente_id " +
                "JOIN mensagens ms ON ms.conversa_id = c.id " +
                "WHERE ms.criada_em >= {0}", sete) ?? 0;

            // Mensagens e checkins 7d
            var mensagens7d = await db.Database.ExecuteScalarAsync<int?>(
                "SELECT COUNT(*)::int FROM mensagens WHERE criada_em >= {0}", sete) ?? 0;

            var checkinsRespondidos7d = await db.Database.ExecuteScalarAsync<int?>(
                "SELECT COUNT(*)::int FROM checkins WHERE respondido_em >= {0}", sete) ?? 0;

            // Custo LLM mês atual
            var custoLlmMes = await db.Database.ExecuteScalarAsync<decimal?>(
                "SELECT COALESCE(SUM(custo_usd), 0)::numeric FROM agente_execucoes " +
                "WHERE iniciado_em >= {0}", inicioMes) ?? 0;

            // Billing: MRR (assinaturas ativas)
            var mrr = await db.Database.ExecuteScalarAsync<decimal?>(
                "SELECT COALESCE(SUM(valor_mensal), 0)::numeric FROM assinaturas WHERE status = 'ativa'") ?? 0;

            // Receita confirmada do mês
            var receitaMes = await db.Database.ExecuteScalarAsync<decimal?>(
                "SELECT COALESCE(SUM(pm.valor), 0)::numeric FROM pagamentos_manuais pm " +
                "WHERE pm.status = 'confirmado' AND pm.pago_em >= {0}", inicioMes) ?? 0;

            // Receita total histórica
            var receitaTotal = await db.Database.ExecuteScalarAsync<decimal?>(
                "SELECT COALESCE(SUM(valor), 0)::numeric FROM pagamentos_manuais WHERE status = 'confirmado'") ?? 0;

            // Custo LLM histórico
            var custoLlmTotal = await db.Database.ExecuteScalarAsync<decimal?>(
                "SELECT COALESCE(SUM(custo_usd), 0)::numeric FROM agente_execucoes") ?? 0;

            // Trials ativos
            var trials = await db.Database.ExecuteScalarAsync<int?>(
                "SELECT COUNT(*)::int FROM assinaturas WHERE status = 'trial'") ?? 0;

            // Assinaturas ativas
            var assinaturasAtivas = await db.Database.ExecuteScalarAsync<int?>(
                "SELECT COUNT(*)::int FROM assinaturas WHERE status = 'ativa'") ?? 0;

            return Results.Ok(new
            {
                // Plataforma
                totalMedicos,
                totalPacientes,
                medicosAtivos7d,
                pacientesAtivos7d,
                mensagens7d,
                checkinsRespondidos7d,
                trials,
                assinaturasAtivas,
                // Financeiro (USD e BRL separados — LLM é USD, billing é BRL)
                mrr,                 // BRL/mês — base MRR
                receitaMes,          // BRL confirmado este mês
                receitaTotal,        // BRL histórico
                custoLlmMesUsd = custoLlmMes,
                custoLlmTotalUsd = custoLlmTotal,
                lucroBrutoMes = receitaMes,  // Por enquanto = receita (infra não rastreada aqui)
                calculadoEm = agora,
            });
        });

        // Custo LLM por mês (histórico 12 meses)
        g.MapGet("/custos-llm", async (AppDbContext db) =>
        {
            var rows = await db.Database.SqlQueryRaw<CustoMes>(@"
                SELECT DATE_TRUNC('month', iniciado_em)::date AS mes,
                       agente,
                       COUNT(*)::int                          AS execucoes,
                       SUM(tokens_in)::int                   AS tokens_in_total,
                       SUM(tokens_out)::int                  AS tokens_out_total,
                       ROUND(SUM(custo_usd)::numeric, 6)     AS custo_total_usd
                FROM agente_execucoes
                WHERE iniciado_em >= NOW() - INTERVAL '12 months'
                  AND custo_usd IS NOT NULL
                GROUP BY 1, 2
                ORDER BY 1 DESC, 3 DESC").ToListAsync();
            return Results.Ok(rows);
        });

        // ─── Saúde / execução dos agentes analíticos (últimos 30 dias) ─────────
        // Read-only sobre agente_execucoes (append-only). Só metadados técnicos —
        // sem conteúdo clínico. paciente_id não é exposto aqui.
        g.MapGet("/agentes-saude", async (AppDbContext db) =>
        {
            var agentes = await db.Database.SqlQueryRaw<AgenteSaude>(@"
                SELECT
                    agente,
                    COUNT(*)::int                                     AS total,
                    COUNT(*) FILTER (WHERE sucesso IS TRUE)::int      AS sucessos,
                    COUNT(*) FILTER (WHERE sucesso IS FALSE)::int     AS falhas,
                    COUNT(*) FILTER (WHERE concluido_em IS NULL)::int AS em_aberto,
                    ROUND(AVG(EXTRACT(EPOCH FROM (concluido_em - iniciado_em)) * 1000)::numeric, 0) AS latencia_media_ms,
                    ROUND(PERCENTILE_CONT(0.95) WITHIN GROUP (
                        ORDER BY EXTRACT(EPOCH FROM (concluido_em - iniciado_em)) * 1000)::numeric, 0) AS latencia_p95ms,
                    ROUND(COALESCE(SUM(custo_usd), 0)::numeric, 4)    AS custo_usd_total,
                    MAX(iniciado_em)                                  AS ultimo_run
                FROM agente_execucoes
                WHERE iniciado_em >= NOW() - INTERVAL '30 days'
                GROUP BY agente
                ORDER BY total DESC").ToListAsync();

            // Erros técnicos recentes (exceções do runner — não conteúdo de paciente).
            var errosRecentes = await db.Database.SqlQueryRaw<AgenteErro>(@"
                SELECT agente, erro, iniciado_em
                FROM agente_execucoes
                WHERE sucesso IS FALSE AND erro IS NOT NULL
                  AND iniciado_em >= NOW() - INTERVAL '30 days'
                ORDER BY iniciado_em DESC
                LIMIT 20").ToListAsync();

            return Results.Ok(new { agentes, errosRecentes });
        });

        // ─── Usuários ─────────────────────────────────────────────────────────

        g.MapGet("/usuarios", async ([FromQuery] bool? desativados, AppDbContext db) =>
        {
            // ?desativados=true → lista desativados (p/ aba de reativação).
            var sql = desativados == true ? @"
                SELECT u.id, u.nome, u.email, u.role, u.ultimo_login,
                       m.id AS medico_id, m.crm, m.especialidade,
                       a.plano AS plano_assinatura, a.status AS status_assinatura,
                       u.desativado_em
                FROM usuarios u
                LEFT JOIN medicos m ON m.usuario_id = u.id
                LEFT JOIN assinaturas a ON a.medico_id = m.id
                WHERE u.desativado_em IS NOT NULL
                ORDER BY u.desativado_em DESC, u.nome" : @"
                SELECT u.id, u.nome, u.email, u.role, u.ultimo_login,
                       m.id AS medico_id, m.crm, m.especialidade,
                       a.plano AS plano_assinatura, a.status AS status_assinatura,
                       u.desativado_em
                FROM usuarios u
                LEFT JOIN medicos m ON m.usuario_id = u.id
                LEFT JOIN assinaturas a ON a.medico_id = m.id
                WHERE u.desativado_em IS NULL
                ORDER BY u.role DESC, u.nome";
            var rows = await db.Database.SqlQueryRaw<UsuarioAdmin>(sql).ToListAsync();
            return Results.Ok(rows);
        });

        // Reativar usuário desativado (desfaz soft delete).
        g.MapPost("/usuarios/{id:guid}/reativar", async (
            Guid id, AppDbContext db, ClaimsPrincipal caller) =>
        {
            var callerRole = caller.FindFirst("role")?.Value ?? "";
            if (callerRole != "owner" && callerRole != "admin")
                return Results.Forbid();

            var ok = await db.Database.ExecuteSqlRawAsync(
                "UPDATE usuarios SET desativado_em = NULL WHERE id = {0} AND desativado_em IS NOT NULL", id);
            return ok == 0 ? Results.NotFound() : Results.NoContent();
        });

        // Criar usuário (owner/admin cria médicos, admins, etc.)
        g.MapPost("/usuarios", async (
            [FromBody] CriarUsuarioAdminRequest req,
            AppDbContext db,
            IPasswordHasher hasher,
            ClaimsPrincipal caller) =>
        {
            // Só owner pode criar outros owners ou admins
            var callerRole = caller.FindFirst("role")?.Value ?? "";
            if ((req.Role == "owner" || req.Role == "admin") && callerRole != "owner")
                return Results.Forbid();

            var email = req.Email.Trim().ToLowerInvariant();
            var existe = await db.Database.ExistsAsync("SELECT 1 FROM usuarios WHERE email = {0}", email);
            if (existe) return Results.Conflict(new { error = "email_em_uso" });

            var usuarioId = Guid.NewGuid();
            var senhaHash = hasher.Hash(req.Senha);
            await db.Database.ExecuteSqlRawAsync(
                "INSERT INTO usuarios (id, email, senha_hash, nome, role) VALUES ({0},{1},{2},{3},{4})",
                usuarioId, email, senhaHash, req.Nome.Trim(), req.Role ?? "medico");

            return Results.Created($"/api/v1/admin/usuarios/{usuarioId}", new { id = usuarioId });
        });

        // Trocar senha de qualquer usuario (útil para reset manual)
        g.MapPatch("/usuarios/{id:guid}/senha", async (
            Guid id, [FromBody] TrocarSenhaAdminRequest req,
            AppDbContext db, IPasswordHasher hasher) =>
        {
            if (string.IsNullOrWhiteSpace(req.NovaSenha) || req.NovaSenha.Length < 8)
                return Results.BadRequest(new { error = "senha minimo 8 caracteres" });

            var hash = hasher.Hash(req.NovaSenha);
            var ok = await db.Database.ExecuteSqlRawAsync(
                "UPDATE usuarios SET senha_hash = {0} WHERE id = {1}", hash, id);
            return ok == 0 ? Results.NotFound() : Results.NoContent();
        });

        // Promover / rebaixar role (SOMENTE owner)
        g.MapPatch("/usuarios/{id:guid}/role", async (
            Guid id, [FromBody] MudarRoleRequest req,
            AppDbContext db, ClaimsPrincipal caller) =>
        {
            var callerRole = caller.FindFirst("role")?.Value ?? "";
            if (callerRole != "owner")
                return Results.Forbid();

            // Não deixa owner remover ele mesmo
            var callerSub = caller.FindFirst("sub")?.Value;
            var targetUsuarioId = await db.Database.ExecuteScalarAsync<Guid?>(
                "SELECT id FROM usuarios WHERE id = {0}", id);
            if (Guid.TryParse(callerSub, out var cId) && cId == id && req.Role != "owner")
                return Results.BadRequest(new { error = "nao pode rebaixar a propria conta owner" });

            var roles = new[] { "owner", "admin", "medico" };
            if (!roles.Contains(req.Role))
                return Results.BadRequest(new { error = "role invalida" });

            var ok = await db.Database.ExecuteSqlRawAsync(
                "UPDATE usuarios SET role = {0} WHERE id = {1}", req.Role, id);
            return ok == 0 ? Results.NotFound() : Results.NoContent();
        });

        // Editar dados básicos (nome + e-mail). Qualquer admin (policy do grupo).
        // Role tem rota própria (owner-only); senha idem.
        g.MapPatch("/usuarios/{id:guid}", async (
            Guid id, [FromBody] EditarUsuarioRequest req, AppDbContext db) =>
        {
            var nome = (req.Nome ?? "").Trim();
            var email = (req.Email ?? "").Trim().ToLowerInvariant();
            if (nome.Length < 3) return Results.BadRequest(new { error = "nome invalido" });
            if (string.IsNullOrEmpty(email) || !email.Contains('@'))
                return Results.BadRequest(new { error = "email invalido" });

            var emailEmUso = await db.Database.ExistsAsync(
                "SELECT 1 FROM usuarios WHERE email = {0} AND id <> {1}", email, id);
            if (emailEmUso) return Results.Conflict(new { error = "email_em_uso" });

            var ok = await db.Database.ExecuteSqlRawAsync(
                "UPDATE usuarios SET nome = {1}, email = {2} WHERE id = {0}", id, nome, email);
            if (ok == 0) return Results.NotFound();
            // Mantém medicos.nome (denormalizado) em sincronia.
            await db.Database.ExecuteSqlRawAsync(
                "UPDATE medicos SET nome = {1} WHERE usuario_id = {0}", id, nome);
            return Results.NoContent();
        });

        // Desativar usuário (SOFT delete). Qualquer admin (policy do grupo).
        // Não apaga: preserva dados clínicos + auditoria (FK RESTRICT). Bloqueia
        // login + some da lista. Reversível (limpar desativado_em).
        g.MapDelete("/usuarios/{id:guid}", async (
            Guid id, AppDbContext db, ClaimsPrincipal caller) =>
        {
            var callerSub = caller.FindFirst("sub")?.Value;
            if (Guid.TryParse(callerSub, out var cId) && cId == id)
                return Results.BadRequest(new { error = "nao_pode_desativar_propria_conta" });

            var alvoRole = await db.Database.ExecuteScalarAsync<string?>(
                "SELECT role FROM usuarios WHERE id = {0}", id);
            if (alvoRole is null) return Results.NotFound();
            if (string.Equals(alvoRole, "owner", StringComparison.OrdinalIgnoreCase))
                return Results.BadRequest(new { error = "nao_pode_desativar_owner" });

            var ok = await db.Database.ExecuteSqlRawAsync(
                "UPDATE usuarios SET desativado_em = NOW() WHERE id = {0} AND desativado_em IS NULL", id);
            return ok == 0 ? Results.NotFound() : Results.NoContent();
        });

        // ─── Onboarding de médico ──────────────────────────────────────────────
        // Cria usuario + medico + assinatura trial + token de convite + envia email.
        g.MapPost("/onboarding/medico", async (
            [FromBody] OnboardingMedicoRequest req,
            AppDbContext db, IPasswordHasher hasher,
            ResendClient resend, CfmClient cfm, IConfiguration cfg) =>
        {
            var email = (req.Email ?? "").Trim().ToLowerInvariant();
            var nome  = (req.Nome  ?? "").Trim();
            var crm   = (req.Crm   ?? "").Trim();
            if (string.IsNullOrEmpty(email) || string.IsNullOrEmpty(nome) || string.IsNullOrEmpty(crm))
                return Results.BadRequest(new { error = "nome, email e CRM são obrigatórios" });

            var plano = (req.Plano ?? "trial").ToLowerInvariant();
            if (!new[] { "trial", "starter", "pro", "enterprise" }.Contains(plano))
                return Results.BadRequest(new { error = "plano inválido" });

            // UF obrigatória p/ validar CRM.
            var crmUf = (req.CrmUf ?? "").Trim().ToUpperInvariant();
            if (string.IsNullOrEmpty(crmUf))
                return Results.BadRequest(new { error = "crm_uf_obrigatorio" });

            var existe = await db.Database.ExistsAsync(
                "SELECT 1 FROM usuarios WHERE email = {0}", email);
            if (existe) return Results.Conflict(new { error = "email_em_uso" });

            // Valida CRM contra o CFM via Infosimples (hard gate) — ANTES de gravar
            // qualquer coisa, senão um CFM fora do ar deixava o usuário órfão no banco.
            var val = await cfm.ValidarAsync(crm, crmUf, nome);
            if (val.Erro is not null)
            {
                if (val.Erro.StartsWith("INFOSIMPLES_TOKEN"))
                    return Results.Json(new { error = "crm_validacao_nao_configurada" }, statusCode: 500);
                // Soft-fail: CFM indisponível após 3 tentativas → cria conta pendente de
                // verificação manual. Não bloqueia o admin — médico entra, CRM fica como
                // PendenteVerificacao p/ revisão posterior.
                val = new CrmValidationResult(true, "PendenteVerificacao", null, null, null);
            }
            // "NaoValidado" = bypass (CRM_VALIDATION_ENABLED=false). "PendenteVerificacao" = soft-fail.
            if (!val.Encontrado ||
                (!string.Equals(val.Situacao, "Regular", StringComparison.OrdinalIgnoreCase) &&
                 !string.Equals(val.Situacao, "NaoValidado", StringComparison.OrdinalIgnoreCase) &&
                 !string.Equals(val.Situacao, "PendenteVerificacao", StringComparison.OrdinalIgnoreCase)))
                return Results.Json(new { error = "crm_invalido", situacao = val.Situacao }, statusCode: 422);

            // Tudo validado → grava de forma ATÔMICA (usuario + medico + assinatura + token).
            // Senha placeholder: não loga antes de ativar.
            var usuarioId = Guid.NewGuid();
            var medicoId  = Guid.NewGuid();
            var placeholder = "!" + Convert.ToBase64String(
                System.Security.Cryptography.RandomNumberGenerator.GetBytes(16));
            var cpf = new string((req.Cpf ?? "").Where(char.IsDigit).ToArray());
            var assinaturaId = Guid.NewGuid();
            var tokenBytes = System.Security.Cryptography.RandomNumberGenerator.GetBytes(32);
            var token = Convert.ToBase64String(tokenBytes)
                .Replace("+", "-").Replace("/", "_").Replace("=", "");
            var tokenHash = AdminSha256(token);

            await using (var tx = await db.Database.BeginTransactionAsync())
            {
                await db.Database.ExecuteSqlRawAsync(
                    "INSERT INTO usuarios (id, email, senha_hash, nome, role) VALUES ({0},{1},{2},{3},'medico')",
                    usuarioId, email, placeholder, nome);

                await db.Database.ExecuteSqlRawAsync(
                    "INSERT INTO medicos (id, usuario_id, nome, crm, crm_uf, cpf, especialidade, crm_situacao, crm_validado_em, crm_fonte, crm_nome_cfm) " +
                    "VALUES ({0},{1},{2},{3},NULLIF({4},''),NULLIF({5},''),'psiquiatria',{6},NOW(),'infosimples',NULLIF({7},''))",
                    medicoId, usuarioId, nome, crm, crmUf, cpf,
                    val.Situacao ?? "NaoValidado", val.Nome ?? "");

                await db.Database.ExecuteSqlRawAsync(@"
                    INSERT INTO assinaturas (id, medico_id, plano, valor_mensal, status, trial_ate)
                    VALUES ({0},{1},{2},{3},'trial', NOW() + INTERVAL '30 days')",
                    assinaturaId, medicoId, plano, req.ValorMensal ?? 0m);

                await db.Database.ExecuteSqlRawAsync(
                    "INSERT INTO medico_invite_tokens (usuario_id, token_hash, expira_em) VALUES ({0},{1}, NOW() + INTERVAL '24 hours')",
                    usuarioId, tokenHash);

                await tx.CommitAsync();
            }

            // Email com link de ativação (fora da transação — falha não desfaz a conta)
            var baseUrl = cfg["PORTAL_PACIENTE_URL"] ?? "http://localhost:3000";
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
            try { emailResult = await resend.SendAsync(email, "Convite — Cérebro Amigo", html, txt); }
            catch (Exception ex) { emailResult = new SendEmailResult(false, null, ex.Message); }

            return Results.Created($"/api/v1/admin/medicos/{medicoId}", new
            {
                usuarioId,
                medicoId,
                emailEnviado = emailResult.Success,
                emailErro = emailResult.Error,
                ativarContaUrl = emailResult.Success ? null : link,
                crmPendente = string.Equals(val.Situacao, "PendenteVerificacao",
                    StringComparison.OrdinalIgnoreCase),
            });
        });

        // ─── Perfil 360° do médico (drill-down) ───────────────────────────────
        // Visão de plataforma (owner/admin vê todos). Só metadados e contagens —
        // NUNCA conteúdo clínico (mensagem/sintoma/diário). clinical-safety regra 4.
        g.MapGet("/medicos/{id:guid}", async (Guid id, AppDbContext db) =>
        {
            var perfil = await db.Database.SqlQueryRaw<MedicoPerfil>(@"
                SELECT
                    m.id, m.nome, m.crm, m.crm_uf, m.cpf, m.especialidade, m.timezone,
                    m.crm_situacao, m.crm_validado_em, m.crm_nome_cfm, m.criado_em,
                    u.email, u.ultimo_login,
                    a.plano, a.valor_mensal, a.moeda, a.status AS status_assinatura, a.trial_ate, a.inicio_em,
                    (SELECT COUNT(*)::int FROM pacientes p WHERE p.medico_responsavel_id = m.id) AS total_pacientes,
                    (SELECT COUNT(*)::int FROM pacientes p
                        JOIN conversas c  ON c.cliente_id = p.cliente_id
                        JOIN mensagens ms ON ms.conversa_id = c.id
                        WHERE p.medico_responsavel_id = m.id
                          AND ms.criada_em >= NOW() - INTERVAL '30 days') AS mensagens_recentes,
                    (SELECT COUNT(*)::int FROM consultas co WHERE co.medico_id = m.id) AS total_consultas,
                    (SELECT COUNT(*)::int FROM protocolos_crise_acionados pc WHERE pc.medico_id = m.id) AS crises_total,
                    (SELECT COUNT(*)::int FROM checkins ck
                        JOIN pacientes p ON p.cliente_id = ck.paciente_id
                        WHERE p.medico_responsavel_id = m.id AND ck.respondido_em IS NOT NULL) AS checkins_respondidos,
                    COALESCE((SELECT SUM(ms.custo_usd) FROM pacientes p
                        JOIN conversas c  ON c.cliente_id = p.cliente_id
                        JOIN mensagens ms ON ms.conversa_id = c.id
                        WHERE p.medico_responsavel_id = m.id), 0)::numeric AS custo_conversa_usd,
                    COALESCE((SELECT SUM(ae.custo_usd) FROM pacientes p
                        JOIN agente_execucoes ae ON ae.paciente_id = p.cliente_id
                        WHERE p.medico_responsavel_id = m.id), 0)::numeric AS custo_agentes_usd
                FROM medicos m
                JOIN usuarios u ON u.id = m.usuario_id
                LEFT JOIN assinaturas a ON a.medico_id = m.id
                WHERE m.id = {0}", id).FirstOrDefaultAsync();

            return perfil is null ? Results.NotFound() : Results.Ok(perfil);
        });

        // ─── Assinaturas / Billing ────────────────────────────────────────────

        g.MapGet("/assinaturas", async (AppDbContext db) =>
        {
            var rows = await db.Database.SqlQueryRaw<AssinaturaAdmin>(@"
                SELECT a.id, a.plano, a.valor_mensal, a.moeda, a.status,
                       a.trial_ate, a.inicio_em, a.cancelado_em, a.notas,
                       m.id AS medico_id, m.nome AS medico_nome, m.crm,
                       u.email AS medico_email,
                       COALESCE(SUM(pm.valor) FILTER (WHERE pm.status='confirmado'), 0) AS total_pago,
                       COUNT(pm.id) FILTER (WHERE pm.status='confirmado') AS pagamentos_confirmados,
                       a.asaas_subscription_id
                FROM assinaturas a
                JOIN medicos m ON m.id = a.medico_id
                JOIN usuarios u ON u.id = m.usuario_id
                LEFT JOIN pagamentos_manuais pm ON pm.assinatura_id = a.id
                GROUP BY a.id, m.id, u.email
                ORDER BY a.status, m.nome").ToListAsync();
            return Results.Ok(rows);
        });

        g.MapPost("/assinaturas", async (
            [FromBody] CriarAssinaturaRequest req, AppDbContext db) =>
        {
            var planos = new[] { "trial", "starter", "pro", "enterprise" };
            var statuses = new[] { "trial", "ativa", "suspensa", "cancelada" };
            if (!planos.Contains(req.Plano)) return Results.BadRequest(new { error = "plano invalido" });
            if (!statuses.Contains(req.Status)) return Results.BadRequest(new { error = "status invalido" });

            var id = Guid.NewGuid();
            await db.Database.ExecuteRawAsync(@"
                INSERT INTO assinaturas (id, medico_id, plano, valor_mensal, status, trial_ate, notas)
                VALUES ({0}, {1}, {2}, {3}, {4}, {5}, {6})
                ON CONFLICT (medico_id) DO UPDATE SET
                    plano = EXCLUDED.plano, valor_mensal = EXCLUDED.valor_mensal,
                    status = EXCLUDED.status, trial_ate = EXCLUDED.trial_ate,
                    notas = EXCLUDED.notas, atualizado_em = NOW()",
                id, req.MedicoId, req.Plano, req.ValorMensal, req.Status,
                (object?)req.TrialAte ?? DBNull.Value,
                (object?)req.Notas ?? DBNull.Value);

            return Results.Created($"/api/v1/admin/assinaturas/{id}", new { id });
        });

        g.MapPatch("/assinaturas/{id:guid}", async (
            Guid id, [FromBody] AtualizarAssinaturaRequest req, AppDbContext db) =>
        {
            var ok = await db.Database.ExecuteRawAsync(@"
                UPDATE assinaturas SET
                    plano        = COALESCE({2}, plano),
                    valor_mensal = COALESCE({3}, valor_mensal),
                    status       = COALESCE({4}, status),
                    trial_ate    = COALESCE({5}, trial_ate),
                    notas        = COALESCE({6}, notas),
                    atualizado_em = NOW()
                WHERE id = {0}",
                id, id,
                (object?)req.Plano ?? DBNull.Value,
                (object?)req.ValorMensal ?? DBNull.Value,
                (object?)req.Status ?? DBNull.Value,
                (object?)req.TrialAte ?? DBNull.Value,
                (object?)req.Notas ?? DBNull.Value);
            return ok == 0 ? Results.NotFound() : Results.NoContent();
        });

        // Registrar pagamento manual
        g.MapPost("/assinaturas/{id:guid}/pagamento", async (
            Guid id, [FromBody] RegistrarPagamentoRequest req, AppDbContext db) =>
        {
            var existe = await db.Database.ExistsAsync(
                "SELECT 1 FROM assinaturas WHERE id = {0}", id);
            if (!existe) return Results.NotFound();

            var pagId = Guid.NewGuid();
            await db.Database.ExecuteRawAsync(@"
                INSERT INTO pagamentos_manuais
                    (id, assinatura_id, valor, moeda, referencia, status, metodo, pago_em, notas)
                VALUES ({0}, {1}, {2}, {3}, {4}, 'confirmado', {5}, {6}, {7})",
                pagId, id, req.Valor, req.Moeda ?? "BRL",
                (object?)req.Referencia ?? DBNull.Value,
                (object?)req.Metodo ?? DBNull.Value,
                req.PagoEm ?? DateTime.UtcNow,
                (object?)req.Notas ?? DBNull.Value);

            // Ativa assinatura se estava em trial (primeiro pagamento)
            await db.Database.ExecuteRawAsync(@"
                UPDATE assinaturas SET status = 'ativa', atualizado_em = NOW()
                WHERE id = {0} AND status = 'trial'", id);

            return Results.Created($"/api/v1/admin/pagamentos/{pagId}", new { id = pagId });
        });

        // ── Cobrança recorrente do médico via Asaas (Fluxo A, ADR-034) ──────────
        // Plataforma cobra o médico (assinatura SaaS). Sem split, dinheiro direto.
        g.MapPost("/assinaturas/{id:guid}/cobranca-asaas", async (
            Guid id, AppDbContext db, AsaasClient asaas) =>
        {
            if (!asaas.Configurado)
                return Results.Json(new { error = "asaas_nao_configurado" }, statusCode: 503);

            var row = await db.Database.SqlQueryRaw<AssinaturaAsaasRow>(@"
                SELECT a.id AS assinatura_id, a.valor_mensal, a.trial_ate,
                       a.asaas_customer_id, a.asaas_subscription_id,
                       m.id AS medico_id, m.nome AS medico_nome, m.cpf, m.wa_id AS telefone,
                       u.email AS medico_email
                FROM assinaturas a
                JOIN medicos m ON m.id = a.medico_id
                JOIN usuarios u ON u.id = m.usuario_id
                WHERE a.id = {0}", id).FirstOrDefaultAsync();
            if (row is null) return Results.NotFound();
            if (!string.IsNullOrWhiteSpace(row.AsaasSubscriptionId))
                return Results.Conflict(new { error = "ja_ativa", subscriptionId = row.AsaasSubscriptionId });
            if (row.ValorMensal <= 0)
                return Results.BadRequest(new { error = "valor_mensal_zero" });
            if (string.IsNullOrWhiteSpace(row.Cpf))
                return Results.BadRequest(new { error = "medico_sem_cpf" });

            // 1) Customer do médico (cria só se ainda não tem).
            var customerId = row.AsaasCustomerId;
            if (string.IsNullOrWhiteSpace(customerId))
            {
                var cust = await asaas.CriarCustomerAsync(
                    row.MedicoId.ToString(), row.MedicoNome, row.Cpf, row.MedicoEmail, row.Telefone);
                if (!cust.Sucesso)
                    return Results.Json(new { error = "asaas_customer_falhou", detalhe = cust.Erro }, statusCode: 502);
                customerId = cust.CustomerId;
                await db.Database.ExecuteRawAsync(
                    "UPDATE assinaturas SET asaas_customer_id = {1}, atualizado_em = NOW() WHERE id = {0}", id, customerId!);
            }

            // 2) Assinatura recorrente. 1ª cobrança quando o trial acabar (ou hoje).
            var hoje = DateOnly.FromDateTime(DateTime.UtcNow);
            var proximo = row.TrialAte is { } t && DateOnly.FromDateTime(t) > hoje
                ? DateOnly.FromDateTime(t) : hoje;
            var desc = $"Assinatura Cérebro Amigo — {row.MedicoNome}";
            var sub = await asaas.CriarAssinaturaAsync(customerId!, row.ValorMensal, proximo, desc, id.ToString());
            if (!sub.Sucesso)
                return Results.Json(new { error = "asaas_assinatura_falhou", detalhe = sub.Erro }, statusCode: 502);

            await db.Database.ExecuteRawAsync(
                "UPDATE assinaturas SET asaas_subscription_id = {1}, atualizado_em = NOW() WHERE id = {0}", id, sub.SubscriptionId!);

            return Results.Ok(new { subscriptionId = sub.SubscriptionId, invoiceUrl = sub.InvoiceUrl });
        });

        // Cancela a cobrança recorrente do médico no Asaas.
        g.MapDelete("/assinaturas/{id:guid}/cobranca-asaas", async (
            Guid id, AppDbContext db, AsaasClient asaas) =>
        {
            var subId = await db.Database.ExecuteScalarAsync<string?>(
                "SELECT asaas_subscription_id FROM assinaturas WHERE id = {0}", id);
            if (string.IsNullOrWhiteSpace(subId))
                return Results.NotFound(new { error = "sem_assinatura_asaas" });
            await asaas.CancelarAssinaturaAsync(subId);
            await db.Database.ExecuteRawAsync(
                "UPDATE assinaturas SET asaas_subscription_id = NULL, atualizado_em = NOW() WHERE id = {0}", id);
            return Results.NoContent();
        });

        // Histórico de pagamentos de uma assinatura
        g.MapGet("/assinaturas/{id:guid}/pagamentos", async (Guid id, AppDbContext db) =>
        {
            var rows = await db.Database.SqlQueryRaw<PagamentoAdmin>(@"
                SELECT id, valor, moeda, referencia, status, metodo, pago_em, notas, criado_em
                FROM pagamentos_manuais
                WHERE assinatura_id = {0}
                ORDER BY pago_em DESC NULLS LAST", id).ToListAsync();
            return Results.Ok(rows);
        });
    }

    private static string AdminSha256(string input)
    {
        var bytes = System.Security.Cryptography.SHA256.HashData(
            System.Text.Encoding.UTF8.GetBytes(input));
        return Convert.ToHexString(bytes).ToLowerInvariant();
    }
}

// ─── DTOs ──────────────────────────────────────────────────────────────────────

public record OnboardingMedicoRequest(
    string Nome, string Email, string Crm, string? Plano, decimal? ValorMensal,
    string? CrmUf, string? Cpf);

public record EditarUsuarioRequest(string? Nome, string? Email);

public record CustoMes(
    DateOnly Mes, string Agente,
    int Execucoes, int? TokensInTotal, int? TokensOutTotal, decimal CustoTotalUsd);

public record AgenteSaude(
    string Agente, int Total, int Sucessos, int Falhas, int EmAberto,
    decimal? LatenciaMediaMs, decimal? LatenciaP95Ms, decimal CustoUsdTotal, DateTime? UltimoRun);

public record AgenteErro(string Agente, string? Erro, DateTime IniciadoEm);

public record MedicoPerfil(
    Guid Id, string Nome, string? Crm, string? CrmUf, string? Cpf, string? Especialidade, string? Timezone,
    string? CrmSituacao, DateTime? CrmValidadoEm, string? CrmNomeCfm, DateTime CriadoEm,
    string Email, DateTime? UltimoLogin,
    string? Plano, decimal? ValorMensal, string? Moeda, string? StatusAssinatura, DateTime? TrialAte, DateTime? InicioEm,
    int TotalPacientes, int MensagensRecentes, int TotalConsultas, int CrisesTotal, int CheckinsRespondidos,
    decimal CustoConversaUsd, decimal CustoAgentesUsd);

public record UsuarioAdmin(
    Guid Id, string Nome, string Email, string Role, DateTime? UltimoLogin,
    Guid? MedicoId, string? Crm, string? Especialidade,
    string? PlanoAssinatura, string? StatusAssinatura, DateTime? DesativadoEm);

public record AssinaturaAdmin(
    Guid Id, string Plano, decimal ValorMensal, string Moeda, string Status,
    DateTime? TrialAte, DateTime InicioEm, DateTime? CanceladoEm, string? Notas,
    Guid MedicoId, string? MedicoNome, string? Crm, string? MedicoEmail,
    decimal TotalPago, long PagamentosConfirmados, string? AsaasSubscriptionId);

public record PagamentoAdmin(
    Guid Id, decimal Valor, string Moeda, string? Referencia,
    string Status, string? Metodo, DateTime? PagoEm, string? Notas, DateTime CriadoEm);

public record CriarUsuarioAdminRequest(string Nome, string Email, string Senha, string? Role);
public record TrocarSenhaAdminRequest(string NovaSenha);
public record MudarRoleRequest(string Role);
public record CriarAssinaturaRequest(
    Guid MedicoId, string Plano, decimal ValorMensal, string Status,
    DateTime? TrialAte, string? Notas);
public record AtualizarAssinaturaRequest(
    string? Plano, decimal? ValorMensal, string? Status,
    DateTime? TrialAte, string? Notas);
public record RegistrarPagamentoRequest(
    decimal Valor, string? Moeda, string? Referencia,
    string? Metodo, DateTime? PagoEm, string? Notas);

public record AssinaturaAsaasRow(
    Guid AssinaturaId, decimal ValorMensal, DateTime? TrialAte,
    string? AsaasCustomerId, string? AsaasSubscriptionId,
    Guid MedicoId, string MedicoNome, string? Cpf, string? Telefone, string MedicoEmail);

