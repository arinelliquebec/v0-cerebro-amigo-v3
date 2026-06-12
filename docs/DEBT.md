# Dívida Técnica — Cérebro Amigo V3

Documento vivo. Itens são removidos quando resolvidos, adicionados quando descobertos.

## Tier 0 — Segurança clínica & LGPD (pendências pós-entrega)

| # | Item | Severidade | Rationale | Caminho para resolver |
|---|---|---|---|---|
| T0-1 | **Nenhuma coluna está cifrada** (ADR-018) | ~~🔴 Alta~~ ✅ **Resolvido** | Fase 1 implementada: `mensagens.conteudo` cifrada no INSERT (orchestrator-py) e decifrada no SELECT (gateway .NET). Script one-off `migrate_mensagens_cifra.py` para dados legados. | — |
| T0-2 | **PII regex: conflito CPF/telefone** em celulares sem separador (11 dígitos) | ~~🟡 Média~~ ✅ **Resolvido** | Comportamento atual é intencional e correto: CPF roda antes de PHONE, então 11 dígitos sem separador sempre são redatados (como `[CPF_REDACTED]`). Falso positivo de label aceitável — cobertura é 100%. Comentário adicionado em ambos os serviços para documentar a invariante. | — |
| T0-3 | **No NER offline** para campos livres | 🟡 Média | Comentado em `observability.py`. Regex não pega nome próprio, endereço, etc. | Integrar modelo NER leve (spaCy `pt_core_news_sm` ou regex expansiva) em pipeline de log. |
| T0-4 | **LangSmith não auto-hospedado**; `HIDE_INPUTS/OUTPUTS` não é default | ~~🟡 Média~~ ✅ **Parcial** | `langsmith_hide_inputs/outputs=true` por default (orchestrator-py + agents-py): traces sobem só com metadata; dev opt-out explícito via env. Redação de PII por regex mantida como defesa em profundidade. **Pendente (🟢 Baixa):** avaliar LangSmith self-hosted para reabrir inputs/outputs com dado no Brasil. | Self-hosted: avaliar quando houver volume que justifique. |

## Tier 1 — Segurança de plataforma (pendências pós-entrega)

| # | Item | Severidade | Rationale | Caminho para resolver |
|---|---|---|---|---|
| T1-1 | **LoginRateLimiter é in-memory** (single-node) | 🔴 Alta | EC2 t3.small não escala horizontalmente hoje, mas se migrar para load balancer com 2+ instâncias, o rate limiter perde eficácia. | Migrar para Redis/DistributedCache (ex.: `Microsoft.Extensions.Caching.StackExchangeRedis`). |
| T1-2 | **Magic-link: endpoint `/magic-link` sem rate limiting** | ~~🟡 Média~~ ✅ **Resolvido** | `LoginRateLimiter` aplicado ao endpoint `POST /magic-link`. Conta tentativas por e-mail (mesmo em 404, para evitar enumeration). Expiração do link corrigida para 1h no response. | — |
| T1-3 | **No mTLS entre serviços internos** | 🟡 Média | `INTERNAL_API_TOKEN` protege, mas tráfego entre gateway↔orchestrator↔agents via HTTP plain na VPC. | AWS VPC endpoints + security groups restringem tráfego; mTLS seria overkill mas ideal. |
| T1-4 | **SSL mode = `require`** (não `verify-full`) | 🟡 Média | Conexões Postgres aceitam certificado sem validar CA. Risco de MITM na rede. | Mudar para `sslmode=verify-full` + cert CA da AWS RDS no container. |
| T1-5 | **No teste automatizado de restore** | 🟡 Média | Runbook existe, mas nunca foi executado. Desastre real = primeiro teste. | Job mensal no CI que restaura snapshot para instância efêmera e roda health checks. |
| T1-6 | **No CloudWatch alarm para backup health** | 🟢 Baixa | Se snapshots pararem de ser gerados, só saberemos quando precisarmos deles. | Alarme: `0 snapshots available nos últimos 7 dias`. |

## Tier 4 — Produto / UX (pendências pós-entrega)

| # | Item | Severidade | Rationale | Caminho para resolver |
|---|---|---|---|---|
| T4-1 | **agents-py não usa prompt_loader dinâmico** | 🟡 Média | Apenas orchestrator-py carrega prompts do banco. Agentes analíticos ainda usam hardcoded. | Replicar `prompt_loader.py` em agents-py; adaptar `BaseAgent.execute()` para `await get_prompt()`. |
| T4-2 | **No preview/validação de prompt antes de ativar** | 🟡 Média | Médico pode ativar um prompt com JSON schema quebrado → todos os nós do grafo falham. | Validar que o prompt tem os placeholders `{...}` esperados; testar chamada a LLM com prompt de sandbox. |
| T4-3 | **No rollback com um clique** | ~~🟢 Baixa~~ ✅ **Resolvido** | Botão "Reverter para v{N}" aparece no editor quando existe versão anterior à ativa. Chama `ativar(versaoAnterior.id)` inline. | — |
| T4-4 | **SW não tem página offline HTML** | ~~🟢 Baixa~~ ✅ **Resolvido** | `public/offline.html` criada (UI minimalista pt-BR + botão recarregar). SW precacheia e serve como fallback de navegação antes de `/p`. | — |
| T4-5 | **Background sync não implementado** | 🟢 Baixa | Checkins respondidos offline não são enviados quando a conexão volta. | Usar `navigator.serviceWorker.ready.then(r => r.sync.register('checkins'))`. |
| T4-6 | **Ícones do PWA são placeholders** | ~~🟢 Baixa~~ ✅ **Resolvido** | Substituídos pela marca real (`brain-logo.png`) em todos os tamanhos (favicon 16/32/48, apple 180, PWA 192/512, push). Falta só uma versão maskable com safe-zone dedicada (polish de design). | — |

## Teleconsulta (ADR-026) / Escriba (ADR-040)

| # | Item | Severidade | Rationale | Caminho para resolver |
|---|---|---|---|---|
| TC-1 | **Validação manual de call real atrás de NAT** nunca registrada | 🟡 Média | Teste sintético não exercita CGNAT/TURN relay — exatamente o cenário onde teleconsulta falha em produção. Exige duas pessoas em redes diferentes (ex.: 4G × wifi). | Call médico↔paciente com `COMPOSE_PROFILES=turn` em prod; conferir em `chrome://webrtc-internals` se o candidato selecionado é `relay` quando P2P falha. Registrar resultado aqui. |
| TC-2 | **Sem observabilidade de WebRTC** | 🟡 Média | Falha de TURN/ICE é invisível: eventos `falhou` vão para `consulta_video_eventos`, mas ninguém alerta. | Métrica/alerta sobre taxa de `falhou` vs `conectou` em `consulta_video_eventos` (watchdog existente pode consultar). |
| TC-3 | **Upload do áudio do escriba em base64 via gateway (limite 25 MB)** | 🟢 Baixa | Consulta longa pode estourar o limite; base64 infla 33%. ADR-040 já prevê evolução. | S3 presigned URL direto do browser + notificação ao gateway para disparar a transcrição. |
| TC-4 | **Sem testes do fluxo teleconsulta** | ~~🟡 Média~~ ✅ **Parcial** | Unit tests adicionados: escriba (diarização, pipeline efêmero S3, guardrails do prompt — agents-py) e gateway (TurnCredentialService HMAC/TTL, TeleconsultaSignalingHub pareamento/presença/reconexão). **Pendente (🟢):** endpoint HTTP de vídeo no fixture de Testcontainers + E2E do `SalaVideo.tsx`. | Estender `TenantIsolationTests` para `/video/entrar`; Playwright com `--use-fake-device-for-media-stream`. |

## Check-up Mental (apps/checkup)

Contexto: as 3 escalas (PHQ-9, GAD-7, ASRS-18) estão validadas e live no EC2 (ADR-045);
funil completo (landing → teste → crise/resultado → devolutiva → PDF) verificado por smoke
E2E pelo domínio (12/12). Roda só no EC2 (`:3001`); o destino Vercel foi descartado porque
us-east não alcança o RDS sa-east-1 (SG não libera + sem IP fixo). Itens pendentes:

| # | Item | Severidade | Rationale | Caminho para resolver |
|---|---|---|---|---|
| CK-1 | **Observabilidade do checkup (CloudWatch in-region)** | ~~🔴 Alta~~ ✅ **Resolvido** | Logs do container do checkup → **CloudWatch Logs `sa-east-1`** (awslogs driver) — **dado fica no Brasil** (LGPD; sem vendor externo, ao contrário de Sentry/Datadog que ingerem fora do BR). Metric filter `checkup-errors` (Error/Exception/⨯) → alarme `checkup-erros-5xx` (≥1 erro/5min) → SNS `cerebro-amigo-checkup-alertas`. Cadeia provada com log sintético (métrica=1 → ALARM). IAM `CerebroAmigoCloudWatchLogs` na role do EC2; log group 30d. **Pendente (🟢):** confirmar a subscrição de e-mail do SNS (link enviado a arinelliquebec@gmail.com). Pega o 500 silencioso (ex.: o do PDF). | — |
| CK-2 | **Rota de eventos engolia erro de DB silenciosamente** | ~~🟡 Média~~ ✅ **Resolvido** | `api/events` agora loga o erro (`console.error("Error: ...")`) antes de engolir — continua não-bloqueante (analytics não quebra o fluxo), mas a falha vai pro stderr → CloudWatch → metric filter/alarme (CK-1). Sem PII: só mensagem do erro + tipo de evento, nunca session_id/payload. Uma regressão como o bug de SSL (que ficou invisível por horas) agora **dispara alerta**. | — |
| CK-3 | **Conexão Postgres `ssl:"require"`, não `verify-full`** | 🟡 Média | `getDb` cifra mas não valida a CA do RDS (mesma classe do T1-4). RDS tem `rds.force_ssl=1`; o fix habilitou SSL, mas sem verificação de cert. | `ssl: { rejectUnauthorized: true, ca: <RDS CA> }` no container (alinhar com T1-4). |
| CK-4 | **`test_results` (consentido) + `report_emails` (e-mail PDF)** | ~~🟡 Média~~ ✅ **Parcial (quase)** | **Parte A FEITA+verificada** (commit 00b2e37): consent checkbox → `/api/result` grava `test_results` só com `consented:true`; bug bigserial→integer corrigido. **Parte B FEITA+verificada E2E no sandbox** (commit 209fbab): `/api/email-report` gera PDF + envia via **AWS SES sa-east-1** (in-region, usa role do EC2) + grava `report_emails` (hash bcrypt 60c, e-mail bruto nunca guardado). Domínio SES verificado (DKIM SUCCESS); IAM `identity/*` + condição `FromAddress=noreply@cerebroamigo.com.br`. Teste: 200 + PDF recebido + 1 row hash. **Pendente (🟢):** (1) **production-access** do SES (pedido feito, ~24h) — até lá só manda p/ e-mail verificado; (2) **campo de e-mail na tela de resultado** (UI) — adicionar quando sair do sandbox (evita oferecer feature que só funciona p/ verificados). | Após sandbox-exit: adicionar o campo de e-mail no /resultado + smoke do envio a um e-mail novo. |
| CK-5 | **Rate-limit do checkup era in-memory** | ~~🟡 Média~~ ✅ **Resolvido** | `ratelimit.ts` virou async + **Postgres-backed** (`checkup.rate_limits`, fixed-window atômico via UPSERT, migration 0040) → sobrevive a restart e funciona com N instâncias. Sem DB (dev/CI) ou erro de DB → **fallback in-memory** (fail-soft, loga, não derruba o produto). Verificado em prod: 3 requests → bucket `pdf:ip:<ip>` com hits=3. 55/55 testes (caminho in-memory). Limpeza de buckets velhos = job futuro (índice em window_start pronto). | — |
| CK-6 | **Key Anthropic do checkup compartilhada com a clínica** | ~~🔴 Alta~~ ✅ **Resolvido** | Checkup agora usa key própria, em workspace Anthropic separado com spend limit próprio ($25 teto / $18 alerta). Key nova gravada no SSM (`/cerebro-amigo/checkup/anthropic-api-key`, SecureString), injetada no `.env` do EC2 e carregada no container (hash `c4121729647d`, distinto da clínica). Verificado 2026-06-11: `env_keys=DIFERENTES`, devolutiva 200 com a key nova. Abuso no checkup agora no pior caso cai pro fallback estático, sem afetar o LLM clínico (regra #4 do `checkup/CLAUDE.md` restaurada). | — |
| CK-7 | **Sem smoke/E2E automatizado do checkup no CI** | ~~🟢 Baixa~~ ✅ **Resolvido** | Job `smoke-checkup` no `deploy.yml` (builda + sobe o server + roda `apps/checkup/scripts/smoke.sh`): health, 3 landings, /crise SSR (CVV no HTML), 3 quizzes, events, devolutiva fallback, **PDF das 3 escalas com `%PDF`**. `build` tem `needs:[test,smoke-checkup]` → **deploy BLOQUEADO se falhar**. Pega regressão de runtime que o build não vê (o 500 do react-pdf pararia aqui, não em prod). CI-safe (sem DB/Anthropic → fallback). Verde no CI. Script roda local: `bash apps/checkup/scripts/smoke.sh`. | — |
| CK-8 | **ASRS-18 sem verdict por falta de cutoff BR** | 🟢 Baixa | Por design (ADR-045): Mattos 2006 não tem ponto de corte validado p/ Brasil → triagem qualitativa, sem positivo/negativo. Não é bug; é gatilho de revisão. | Se publicarem cutoff BR validado, reabrir por novo ADR (ex.: screener WHO 6 itens). |

## Geral / Cross-cutting

| # | Item | Severidade | Rationale | Caminho para resolver |
|---|---|---|---|---|
| G-1 | **TODO: convenção de payload do checkin** (`medication.py`) | ~~🔴 Alta~~ ✅ **Resolvido** | Schema confirmado consistente: `gerador_checkins_medicacao.py` produz `{tomada_id, prescricao_id, medicamento, dose_descricao}`; `CheckinsEndpoints.cs` consome `prescricao_id`. Sem divergência. | — |
| G-2 | **FIXME ADR-014: dedup ineficiente** (`agents-py`) | ~~🟡 Média~~ ✅ **Resolvido** | `_listar_candidatos` agora exclui via SQL pacientes com insight `risco_silencioso` na janela de dedup (7d). Evita processar per-patient quem já foi notificado. | — |
| G-3 | **TODO: email backup quando push falha** (`notifier-py`) | ~~🟡 Média~~ ✅ **Resolvido** | `EmailFallbackService` implementado no notifier-py. Chama Resend API quando nenhum device recebe push. Configuração opcional (`EMAIL_FALLBACK_ENABLED`, `RESEND_API_KEY`). Fallback também no `dispatch_for_patient`. | — |
| G-4 | **TODO: timezone em checkins de medicação** | 🟢 Baixa | Considera UTC; paciente em outro timezone pode receber checkin no horário errado. | Usar `timezone` do paciente (coluna em `pacientes` ou inferir de localização). |
| G-5 | **PasswordHasher usa PBKDF2** | ~~🟡 Média~~ ✅ **Resolvido** | Migrado para `BCrypt.Net-Next` (work factor 12) com fallback PBKDF2 e rehash automático no login (médico + paciente). | — |
| G-6 | **No integration tests entre serviços** | 🟡 Média | Cada serviço tem testes unitários, mas nenhum testa a cadeia completa (web → gateway → orchestrator → DB). | Criar suite de integração com Docker Compose (todos os serviços + Postgres). |
| G-7 | **`send_push` é síncrono (notifier-py)** | ~~🔴 Alta~~ ✅ **Resolvido** | `send_push()` já usa `asyncio.to_thread(_send)` — pywebpush (síncrono) roda em thread pool, sem bloquear o event loop do APScheduler. | — |

## Legenda de severidade

- 🔴 **Alta**: correção obrigatória antes de produção ou risco de incidente
- 🟡 **Média**: impacto controlado, deve ser feito na próxima sprint
- 🟢 **Baixa**: nice-to-have, endereçar quando houver tempo
