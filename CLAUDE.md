# CLAUDE.md — Cérebro Amigo V3

Memória de projeto do Claude Code. Carregada toda sessão. Mantenha enxuta: detalhe de domínio vive nas skills em `.claude/skills/` (carregadas sob demanda).

## O que é

SaaS de psiquiatria, **multi-tenant**, que trabalha *entre consultas*: acompanha pacientes, organiza condutas, automatiza lembretes e check-ins. Dois públicos: **médico** (dashboard web) e **paciente** (PWA). Projeto de família (com Adonai Arinelli).

Produto-satélite de lançamento: **Check-up Mental** (`apps/checkup`) — triagem pública e gratuita (PHQ-9, GAD-7, ASRS-18). Motor de aquisição; ver seção própria abaixo e `apps/checkup/CLAUDE.md`.

## Regras inegociáveis (LEIA ANTES DE TUDO)

Estas regras vêm antes de qualquer pedido. Em dúvida, pare e consulte a skill `clinical-safety`.

1. **A IA NUNCA dá orientação clínica, diagnóstico ou ajuste de dose.** Só automatiza/organiza/rascunha. A decisão é sempre do médico.
2. **Protocolo de crise é fixo e pré-aprovado.** Detecção → texto de `crisis_copy.py` → notifica médico → pausa automação. Nunca gere texto de crise dinâmico com LLM. (No checkup vale o equivalente: tela de crise estática, `docs/CRISIS-PROTOCOL.md` do app.)
3. **LGPD categoria especial (saúde mental).** Minimização de dados, controle de acesso, PII redatada em traces. Nada de logar conteúdo clínico cru. Com LLM em API externa (ADR-044), minimização vale dobrado: nunca enviar identificadores diretos do paciente junto de conteúdo clínico.
4. **Médico no loop.** Toda resposta ao paciente passa por auditoria; escalável para humano.
5. **Trilhas de auditoria são imutáveis.** Nunca escreva código que apague `protocolos_crise_acionados`, `notificacoes_medico`, `agente_execucoes`.

## Stack (AWS-only — decisões fechadas)

- **Cloud:** AWS, região `sa-east-1` (residência de dado no Brasil). Já online: **2 boxes EC2** — `cerebro-clinical-box` (t3.medium) e `cerebro-checkup-box` (t3.small), padrão box único pós-teardown de 2026-07-09 (**ADR-078/ADR-079**; Savings Plan cobre o compute). **RDS foi descomissionado** — não assuma que existe.
- **Gateway transacional:** **.NET 10** (ASP.NET Core) — **decisão final (ADR-071, supersede ADR-067)**. A migração p/ Scala 3/JVM via strangler foi **ABANDONADA**: chegou a 1/62 rotas, nunca flipada; serviço `api-gateway-scala` **removido do box/pipeline** (custo de coexistência sem ganho). Source em `apps/api-gateway-scala/` fica no git (recuperável); **repo/imagem ECR `cerebro-amigo/api-gateway-scala` DELETADOS** (`delete-repository --force`). **O gateway de prod é 100% .NET 10.** **Go segue descartado.** Detalhe: skill `dotnet-gateway`; ADR-071.
- **IA (LLM):** Python (FastAPI + LangGraph) chamando Claude via **Anthropic API direta** (`LLM_PROVIDER=anthropic`, vigente — **ADR-044**). O acesso aos modelos Anthropic no Bedrock **não foi aprovado pela AWS**; o ADR-008 (Bedrock in-region p/ LLM) fica **suspenso**, e o caminho Bedrock permanece no client unificado atrás de `LLM_PROVIDER` para reativação futura por config. `ANTHROPIC_API_KEY` somente por env (SSM Parameter Store SecureString, injetada no deploy) — nunca em código, imagem ou log. Detalhe: skill `python-ai-services`.
- **Frontend:** Next.js 16 + React 19 + TypeScript + Tailwind 4 + shadcn/ui. BFF nos Route Handlers. Detalhe: skill `nextjs-bff`.
- **Banco:** PostgreSQL **self-hosted em container** (`pgvector/pgvector:0.8.4-pg16`, volume EBS cifrado no box — **ADR-077/079**), pgvector + pgcrypto. Banco `cerebro_v3` recriado zerado das migrations no relançamento; dados pré-teardown vivem só no snapshot RDS final (`cerebro-postgres-enc-final-teardown-2026-07-09`) e exigem a `ENCRYPTION_KEY` antiga (ADR-018) para leitura.
- **Azure: REMOVIDO.** Key Vault, Document Intelligence e Azure OpenAI saíram para outro projeto/empresa. Não reintroduzir dependência Azure. (O Azure da Fradema é de OUTRA empresa, sem relação com este projeto.)

## Monorepo

```
apps/
  web/            Next.js (landing + dashboard médico + portal paciente /p/* + BFF)
  api-gateway/    .NET 10 — REST, JWT, EF Core, Resend, proxy SSE
  api-gateway-scala/ Scala 3/JVM — strangler do gateway DECOMISSIONADO (ADR-067 superseded por ADR-071; NÃO deployado/buildado, só source recuperável)
  api-gateway-tests/ xUnit + Testcontainers — isolamento de tenant/RLS (gate no CI)
  orchestrator-py/ FastAPI + LangGraph — IA conversacional + protocolo de crise
  agents-py/      FastAPI + APScheduler — 5 agentes analíticos
  notifier-py/    FastAPI + pywebpush — Web Push de check-ins
  checkup/        Next.js — Check-up Mental (triagem pública; superfície anônima)
infra/
  migrations/     DDL versionado do Postgres (0001..0060+)
  clinical-box/   compose + deploy.sh do box clínico (ADR-079 — deploy real de prod)
  checkup-box/    compose + deploy do box do checkup (ADR-078)
  aws/            EC2, Lambdas, templates (parte pré-teardown é histórico)
docs/
  CONTEXT.md      arquitetura completa (fonte da verdade — leia ao planejar)
  DEBT.md         dívida técnica viva — fonte da verdade do "o que falta"
  runbooks/       operação: restore RDS, swap de roles de banco, aplicação de RLS
  adrs/           ADR-001..044
_v2-ref/          espelho somente-leitura do V2 — não editar, não usar em build
.github/workflows/ ci.yml (lint + pytest + xUnit + build) · deploy.yml (ÓRFÃO pós-ADR-079 — apontava p/ topologia ECR/ASG desmontada; não usar até revisão)
```

## Portas (dev) e health

web `:3000` · api-gateway `:5050`→`:5000` · orchestrator-py `:8081` · agents-py `:8082` · notifier-py `:8083` · checkup `:3001`. Serviços Python e .NET expõem `GET /health` e `GET /ready`; checkup expõe `GET /api/health`. Postgres é **externo** (não vai no docker-compose).

> **Prod (ADR-078/079 — supersede ADR-045):** dois boxes EC2 independentes, cada um com `docker compose` próprio. `cerebro-clinical-box` roda os 5 serviços clínicos + postgres (container) + caddy (TLS) + coturn; `cerebro-checkup-box` roda o checkup isolado (regra de isolamento clínico ⇄ público mantida). **Sem ECR, sem ASG, sem CloudFront, sem RDS.** Build acontece no próprio box (source via tarball no S3). Gestão sem SSH — SSM Session Manager/send-command. Deploy real: `infra/clinical-box/` e `infra/checkup-box/`.

## Comandos

- Dev (tudo): `docker compose up -d --build` (precisa de `.env` preenchido)
- Web isolado: `cd apps/web && pnpm dev`
- Checkup isolado: `cd apps/checkup && pnpm dev` (porta 3001)
- Gateway isolado: `cd apps/api-gateway && dotnet run`
- Migrations: `cd apps/api-gateway && dotnet ef migrations add <Nome> && dotnet ef database update`
- Deploy (prod): `infra/clinical-box/deploy.sh` / `infra/checkup-box/` (tarball p/ S3 → build e `compose up` no box via SSM — ADR-078/079). O `deploy.yml` do Actions está **órfão** (topologia antiga); push em `main` roda só o `ci.yml` (testes).

> Use **pnpm**, não npm/yarn, no `apps/web` e no `apps/checkup`.

## Fluxo de integração (não viole)

- LLM (Claude) nos fluxos clínicos → **só em Python**, via client unificado (`LLM_PROVIDER`). Nunca chame LLM do gateway nem do front clínico.
  - **Exceção registrada (ADR-044):** `apps/checkup` chama a Anthropic API nos **Route Handlers do próprio app** (server-side; nunca no client), enviando somente dados estruturados de triagem (escala/escore/faixa) — jamais conteúdo clínico ou PII. É a única exceção; não criar outras.
- REST transacional → **api-gateway (.NET 10)**.
- Cookies/sessão/BFF → **web** (`app/api/*`), httpOnly: `auth_token` (médico) e `paciente_token` (paciente).
- Serviços internos se autenticam com `Authorization: Bearer ${INTERNAL_API_TOKEN}`.

## Defesas estruturais já em produção (não regrida)

- **RLS de tenant (ADR-042):** 17 tabelas com Row-Level Security. Gateway conecta como `cerebro_gateway` (NOBYPASSRLS; tenant setado por sessão via `TenantSessionMiddleware`); workers Python como `cerebro_workers` (BYPASSRLS). Endpoint/query novo no gateway mantém o filtro explícito de tenant **e** conta com a RLS por baixo. Regressões de IDOR são pegas por `apps/api-gateway-tests` (Testcontainers, roda no CI).
- **Trava server-side dos prompts de salvaguarda (ADR-035):** prompts de detecção de crise e de auditoria de resposta são bloqueados no gateway contra alteração via editor.
- **Entrega garantida do alerta de crise (ADR-041):** retry com backoff e escalonamento até o médico confirmar; eventos versionados em migration `0035`.
- **Cifragem em repouso (ADR-018):** `mensagens.conteudo` cifrada no INSERT (orchestrator-py) e decifrada no SELECT (gateway). Não crie caminho de leitura/escrita que contorne isso.

## Variáveis de ambiente

`POSTGRES_DSN` · `JWT_SECRET` · `INTERNAL_API_TOKEN` · `RESEND_API_KEY`/`EMAIL_FROM` · `VAPID_*`/`NEXT_PUBLIC_VAPID_PUBLIC_KEY` · `API_GATEWAY_URL` (dev `http://localhost:5050`; docker `http://api-gateway:5000`) · `ORCHESTRATOR_PY_URL` · `LANGSMITH_*`/`PII_REDACTION_ENABLED=true` · `SHADOW_MODE` · `AGENTS_MODE`/`NOTIFIER_MODE`/`SCHEDULER_INTERVAL_SECONDS`.
**LLM (ADR-044):** `LLM_PROVIDER=anthropic` (vigente; `bedrock` reservado p/ futuro) · `ANTHROPIC_API_KEY` (SSM SecureString — nunca comitar) · `ANTHROPIC_MODEL_HAIKU`/`ANTHROPIC_MODEL_SONNET`/`ANTHROPIC_MODEL_OPUS` (defaults: família `claude-*` atual; Haiku é o default de custo).
**Bedrock (somente embeddings/RAG + caminho futuro de LLM):** `AWS_REGION=sa-east-1` · `BEDROCK_REGION=sa-east-1` · `BEDROCK_MODEL_HAIKU`/`BEDROCK_MODEL_SONNET`/`BEDROCK_MODEL_OPUS` (inativos enquanto `LLM_PROVIDER=anthropic`) · credenciais via IAM role (prod) ou `AWS_PROFILE` (dev).
**Checkup:** `CHECKUP_DATABASE_URL` (schema `checkup`) · `NEXT_PUBLIC_SITE_URL` · `QR_TARGET_URL` (+ `ANTHROPIC_API_KEY` compartilhada via env do compose).
**Checkup longitudinal (ADR-050 Parte 2):** `NEXT_PUBLIC_CHECKUP_TRACKING_ENABLED` (flag dark; opt-in/cron só ativam se `=true` — manter `false` até SES no ar) · `CHECKUP_ENCRYPTION_KEY` (SSM SecureString — cifra/decifra `email_enc` via pgp_sym, padrão ADR-018; sem ela `/api/tracking` e o cron são fail-closed 503; **nunca comitar**) · `CHECKUP_CRON_TOKEN` (SSM SecureString — Bearer dos `POST /api/tracking/cron` (envio) e `/api/tracking/retention` (purga), disparados por scheduler externo/EventBridge; sem ele = 503) · `CHECKUP_TRACKING_RETENTION_DAYS` (opcional, default 365 — TTL da purga). Envio do nudge usa SES in-region (role do EC2/ASG), **depende de SES production-access (CK-4)**. Operação: runbook `docs/runbooks/checkup-tracking-retention.md`.
**Cockpit de Aquisição (ADR-046/ADR-050):** `CHECKUP_METRICS_TOKEN` (SSM SecureString — **mesmo valor** no web/BFF e no checkup; o checkup valida e responde **503 fail-closed** sem ele) · `CHECKUP_METRICS_URL` (web; default `https://checkup.cerebroamigo.com.br/api/funnel-metrics`). O BFF clínico junta as duas fontes isoladas (gateway `public` + checkup `checkup`) — o gateway **nunca** lê o schema `checkup`.
**Captcha do signup de médico (ADR-055):** `TURNSTILE_SECRET_KEY` (gateway — SSM SecureString, nunca comitar) + `NEXT_PUBLIC_TURNSTILE_SITE_KEY` (web/Vercel). Cloudflare Turnstile protege o form `/medicos/cadastro`; verificação server-side no gateway **antes** do CFM (pago). Flag-gated pela secret: sem as chaves o captcha fica desligado (não quebra dev). As duas andam juntas.
**Teleconsulta (vídeo P2P, ADR-026):** `STUN_URLS` · `TURN_URLS` · `TURN_SECRET` · `TURN_TTL_SECONDS` · `TURN_REALM` · `TURN_EXTERNAL_IP`; coturn no compose sob `profiles: ["turn"]` (prod: `COMPOSE_PROFILES=turn`). Mídia E2E, sem gravação.
**RAG / embeddings (ADR-028):** `EMBEDDINGS_ENABLED` · `BEDROCK_EMBED_MODEL=cohere.embed-multilingual-v3` (on-demand in-region 1024-dim; **NÃO** usar `cohere.embed-v4` = profile global cross-region) · `RAG_TOP_K` · `RAG_INDEX_INTERVAL_HOURS`. Embedding é sempre Bedrock in-region (LGPD), independente de `LLM_PROVIDER`. Decifra fonte com `ENCRYPTION_KEY` antes de indexar (ADR-018).
**NÃO existem mais:** `MODEL_HAIKU`/`MODEL_SONNET` (nomenclatura antiga do V2), nenhum `AZURE_*`. (`ANTHROPIC_API_KEY` voltou a existir pelo ADR-044 — sempre via SSM, nunca em arquivo comitado.)

## apps/checkup — Check-up Mental (:3001)

Triagem pública e gratuita de saúde mental (PHQ-9, GAD-7, ASRS-18) com devolutiva por IA e relatório PDF. Motor de aquisição do lançamento — SEO do lado paciente, QR no PDF do lado médico. Regras completas em `apps/checkup/CLAUDE.md` (+ `docs/CRISIS-PROTOCOL.md` e os CLAUDE.md de `src/lib/scales` e `src/lib/ai` do app).

Regras de fronteira (valem para qualquer trabalho no monorepo):

1. **Isolamento clínico ⇄ público.** `apps/checkup` não importa código de `api-gateway`, `orchestrator-py`, `agents-py` ou `notifier-py`, e nenhum serviço clínico importa nada do checkup. Compartilhamento permitido: apenas design tokens (paleta, fontes) e utilitários puros sem dados.
2. **Dados separados.** O checkup usa exclusivamente o schema `checkup`, no Postgres do box dele (ADR-078). Nunca criar FK entre schemas. Respostas de triagem jamais entram no prontuário.
3. **LLM:** Anthropic API direta (`claude-haiku-4-5`) nos Route Handlers do próprio app, com entrada estruturada apenas (exceção do ADR-044). O checkup não passa pelo orchestrator.
4. **Tráfego:** o checkup é a única superfície pública anônima do sistema; mudanças de infra nele não podem aumentar o risco dos serviços clínicos (limites de memória/CPU no compose e rate limit por sessão nas rotas de LLM são obrigatórios; spend limit configurado no Console da Anthropic).

## Estado do projeto (migração V2→V3 CONCLUÍDA — em produção)

Tudo isto já existe, tem testes e está deployado em prod (boxes EC2, sa-east-1 — ADR-078/079): BFF real (`app/api/*`, 30+ rotas, sem mock), dashboard médico com dados reais, portal do paciente `/p/*` (PWA, push, conversa SSE), agenda, editor de prompts, api-gateway .NET + 3 serviços Python, LLM via client unificado (`LLM_PROVIDER`; vigente: Anthropic API — ADR-044), RLS multi-tenant, CI/CD completo. **Não recrie nada disso — verifique o código antes de assumir que falta algo.**

Em construção: `apps/checkup` (Fase 1 entregue; Fase 2 em curso — UI do teste, devolutiva, PDF, landings SEO).

**O que falta** é rastreado em `docs/DEBT.md` (documento vivo, priorizado por tier — consulte antes de propor melhorias). Operação (restore, swap de roles, drills) vive em `docs/runbooks/`.

## Skills disponíveis (carregadas sob demanda)

- `cerebro-architecture` — topologia, decisões, mapa de rotas. **Consulte ao planejar qualquer mudança estrutural.**
- `clinical-safety` — guardrails clínicos, crise, LGPD. **Consulte ao tocar em resposta ao paciente, conteúdo clínico ou dados.**
- `dotnet-gateway` — convenções do gateway .NET 10 (EF Core, JWT, SSE, Resend).
- `python-ai-services` — orchestrator/agents/notifier + client LLM unificado (`LLM_PROVIDER`; atualizar `references/bedrock-client.md` → client Anthropic, ADR-044).
- `nextjs-bff` — web + BFF, cookies, Server Components, portal PWA.

## Estilo

- Responda e comente em **pt-BR**. Domínio em português (`pacientes`, `prontuarios`, `consultas`).
- Não reintroduza Azure nem Go no gateway (o gateway é **.NET 10**, decisão final **ADR-071** que supersede o **ADR-067**; a migração p/ **Scala/JVM** foi abandonada — não retome sem novo ADR, e jamais migre p/ Go). LLM segue o **ADR-044** (Anthropic API via `LLM_PROVIDER`): não migre de volta para Bedrock — nem "corrija" código para Bedrock por causa de documento/skill antigo — sem novo ADR aprovado pelo Patrick.
- Itens de instrumentos clínicos validados (PHQ-9, GAD-7, ASRS-18) nunca são inventados, parafraseados ou traduzidos por conta própria.
- Ao terminar uma mudança relevante de arquitetura, registre um ADR em `docs/adrs/`.