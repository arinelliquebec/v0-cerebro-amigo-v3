# Cérebro Amigo V3

SaaS de psiquiatria **multi-tenant** que trabalha *entre consultas*: acompanha pacientes,
organiza condutas, automatiza lembretes e check-ins, detecta crise e gera insights para o
médico. Dois públicos — **médico** (dashboard web) e **paciente** (PWA) — sobre uma stack
**AWS-only** na região `sa-east-1` (residência de dado no Brasil).

Acompanha um produto-satélite de lançamento: o **Check-up Mental** (`apps/checkup`), uma
triagem pública e gratuita (PHQ-9, GAD-7, ASRS-18, AUDIT, MDQ, Fagerström, MSI-BPD, ASSIST)
que funciona como motor de aquisição.

> Projeto de família (Rafael e Adonai Arinelli). Domínio em português. Dado de saúde mental =
> **LGPD categoria especial** — minimização, controle de acesso e redação de PII são requisito,
> não opção.

---

## Sumário

- [Os dois produtos](#os-dois-produtos)
- [Arquitetura](#arquitetura)
- [Os 6 serviços](#os-6-serviços)
- [Regras clínicas inegociáveis](#regras-clínicas-inegociáveis)
- [Defesas estruturais em produção](#defesas-estruturais-em-produção)
- [Monorepo](#monorepo)
- [Portas e health](#portas-e-health)
- [Banco de dados](#banco-de-dados)
- [Variáveis de ambiente](#variáveis-de-ambiente)
- [Desenvolvimento local](#desenvolvimento-local)
- [Build, CI/CD e deploy](#build-cicd-e-deploy)
- [Check-up Mental](#check-up-mental-appscheckup)
- [Decisões de arquitetura (ADRs)](#decisões-de-arquitetura-adrs)
- [Documentação](#documentação)

---

## Os dois produtos

| | **Cérebro Amigo** (clínico) | **Check-up Mental** (`apps/checkup`) |
|---|---|---|
| Público | Médico (dashboard) + paciente (PWA) | Qualquer pessoa (anônimo) |
| Função | Acompanhamento entre consultas | Triagem pública + aquisição |
| Acesso | Autenticado (JWT, cookies httpOnly) | Sem cadastro, sessão efêmera |
| Dado | Prontuário clínico (schema principal) | Schema `checkup`, isolado |
| LLM | Claude via Python (orchestrator/agents) | Claude via Route Handlers do próprio app |
| Infra prod | Box clínico EC2 (docker-compose) | ALB + Auto Scaling Group próprio |

O isolamento entre os dois é **deliberado**: o checkup não importa código clínico e nenhum
serviço clínico importa o checkup. Compartilham só design tokens. Detalhe em [Check-up Mental](#check-up-mental-appscheckup).

---

## Arquitetura

```
            CLÍNICO (autenticado)                              PÚBLICO (anônimo)
  Paciente PWA /p/*   Médico /dashboard/*  Admin /admin/*       checkup.cerebroamigo.com.br
          └──────────────────┬───────────────────┘                       │
                             ▼                                            ▼
                 web · Next.js 16 (:3000)                    checkup · Next.js 16 (:3001)
                 BFF: app/api/*  ·  cookies httpOnly          SSR/SSG + Route Handlers
                 auth_token (médico) · paciente_token         (infra própria: ALB + ASG)
                             │                                            │
                             ▼  Bearer ${INTERNAL_API_TOKEN}              │ @anthropic-ai/sdk
              api-gateway · .NET 10 (:5050→:5000)                        │ (claude-haiku-4-5)
              REST · JWT · EF Core · Resend · proxy SSE                  ▼
                             │                                  Claude (Anthropic API)
       ┌─────────────────────┼──────────────────────┐                   │
       ▼                     ▼                       ▼                   ▼
 orchestrator-py        agents-py              notifier-py        schema `checkup`
   (:8081)               (:8082)                 (:8083)          ┌─────────────────┐
 LangGraph · SSE      6 agentes + 8 jobs       Web Push           │  PostgreSQL RDS │
 conversa clínica     APScheduler              check-ins/crise    │   sa-east-1     │
       └──────────┬──────────┴───────────────────┘               │ pgvector+pgcrypto│
                  ▼                                  ◄────────────┤  (cerebro_v3)   │
         Claude (Anthropic API)                                   └─────────────────┘
         Haiku · Sonnet · Opus 4.8
         Embeddings: Bedrock Cohere ML v3 (in-region, RAG)
```

**Regra de fronteira** (não viole):

| Responsabilidade | Serviço |
|---|---|
| Chamar LLM (Claude) no fluxo clínico | **Apenas Python** (orchestrator-py, agents-py) via client unificado `LLM_PROVIDER` |
| REST transacional, JWT, e-mail, proxy SSE, integrações | **api-gateway (.NET 10)** |
| Cookies, sessão, agregação, render, BFF | **web** (`app/api/*`) |
| Push de check-in / lembrete / crise | **notifier-py** |
| Jobs analíticos e operacionais agendados | **agents-py** |
| Triagem pública (LLM no próprio app) | **checkup** (exceção registrada, ADR-044) |

Nunca: LLM no gateway ou no front clínico; CRUD Postgres direto do front; lógica clínica no BFF;
FK entre o schema clínico e o `checkup`.

**LLM (ADR-044, vigente):** Claude via **Anthropic API direta** (`LLM_PROVIDER=anthropic`). O
caminho Bedrock permanece no client unificado atrás da flag para reativação futura por config — o
acesso aos modelos Anthropic no Bedrock **não foi aprovado pela AWS** (ADR-008 suspenso, supersedido
pelo ADR-015). Embeddings/RAG seguem sempre no **Bedrock in-region** (Cohere ML v3, LGPD),
independente do `LLM_PROVIDER`. `ANTHROPIC_API_KEY` somente por env (SSM SecureString) — nunca em
código, imagem ou log.

---

## Os 6 serviços

### `apps/web` — Frontend Next.js + BFF
Next.js 16 (App Router) + React 19 + TypeScript + Tailwind 4 + shadcn/ui (new-york). Serve três
superfícies num único deploy: **landing** pública, **dashboard** do médico (`/dashboard/*`) +
painel do dono (`/admin/*`, gated por role), e o **portal do paciente** (`/p/*`, PWA com push e
conversa SSE). É também o **BFF**: os Route Handlers em `app/api/*` (30+ grupos) são a única
camada que fala com o gateway — o browser nunca vê a URL do gateway. Cookies httpOnly separados:
`auth_token` (médico, 8h) e `paciente_token` (paciente). `proxy.ts` (substitui middleware no Next 16)
protege as rotas no edge. PWA escopado a `/p` (manifest, service worker com 3 estratégias de cache +
offline, Web Push via VAPID público). Teleconsulta WebRTC P2P (`SalaVideo`), integração Memed,
React Compiler e Cache Components ligados.

### `apps/api-gateway` — .NET 10 (ASP.NET Core, Minimal APIs)
Gateway REST transacional. Centraliza autenticação (JWT médico `aud=dashboard` + paciente
`aud=portal-paciente`), CRUD clínico (~35 grupos de endpoints sob `/api/v1/*`), proxy SSE para o
orchestrator-py, e-mail (Resend) e integrações (Memed, Asaas, CFM/Infosimples, TURN). **Não chama
LLM.** É o único serviço que conecta ao Postgres como role `cerebro_gateway` (**NOBYPASSRLS**) — o
ponto onde a RLS de tenant realmente filtra, com defesa em profundidade via `TenantSessionMiddleware`
(GUC de sessão) + filtro explícito por `medico_responsavel_id` em cada query. EF Core 10 + Npgsql,
snake_case, BCrypt wf12, SSL VerifyFull para RDS, Sentry LGPD-safe. Testado por `apps/api-gateway-tests`
(xUnit + Testcontainers) — gate de isolamento de tenant no CI.

### `apps/orchestrator-py` — FastAPI + LangGraph
IA conversacional clínica. Grafo LangGraph processa a mensagem do paciente:

```
load_context → detect_crisis (Haiku, fail-safe)
  → [crise] crisis_protocol (texto FIXO de crisis_copy.py, sem LLM) → END
  → classify_medication (Haiku) → update_intake
  → extract_symptoms (Sonnet) → generate_response (Sonnet, SSE)
  → audit_response (Haiku) → finalize | reescrever (até 2x) | escalate_to_human
```

Checkpointing em Postgres (`AsyncPostgresSaver`), streaming SSE, cifragem em repouso das mensagens
(ADR-018), client LLM provider-switchável. **Único serviço que chama o LLM no fluxo clínico.**

### `apps/agents-py` — FastAPI + APScheduler
Plano batch/proativo. **6 agentes analíticos** que geram `insights` doctor-facing:

| Agente | Função | Modelo |
|---|---|---|
| `resumo_pre_consulta` | Briefing pré-consulta (14 dias) | Sonnet |
| `adesao` | Taxa de medicação + engajamento | Sonnet sobre métricas determinísticas |
| `risco_silencioso` | Retraimento (ausência + sinais negativos) | Sonnet |
| `padroes` | Tendências em sintomas (scipy: linregress, t-test) | Sonnet |
| `diario` | Síntese de entradas de diário compartilhadas | Sonnet |
| `desfecho` | Resposta/remissão MBC (ADR-027) | **determinístico, sem LLM** |

Mais **8 jobs operacionais sem LLM** (geradores de check-in, questionários, exames, renovação de
receita, recall de inativos, alertas) e serviços de escriba/diário-de-voz (Transcribe + S3) e
RAG/embeddings. `AGENTS_MODE=scheduled|manual`, `SHADOW_MODE`, gate de custo diário de LLM (ADR-011).
Conecta ao Postgres como `cerebro_workers` (BYPASSRLS).

### `apps/notifier-py` — FastAPI + pywebpush
Web Push (VAPID) de check-ins ao paciente, lembretes de consulta, e **entrega garantida do alerta
de crise ao médico** (ADR-041, escada de escalonamento por timeout até ack). Textos de push são
**fixos/versionados/hashados** (`checkin_copy`, mesma filosofia do crisis_copy — nunca LLM).
Dispatcher idempotente (`SELECT FOR UPDATE SKIP LOCKED`), fallback por e-mail (Resend).

### `apps/checkup` — Check-up Mental
Triagem pública anônima. Ver [seção própria](#check-up-mental-appscheckup).

---

## Regras clínicas inegociáveis

Estas regras vêm antes de qualquer pedido. Em dúvida, consultar a skill `clinical-safety`.

1. **A IA NUNCA dá orientação clínica, diagnóstico ou ajuste de dose.** Só automatiza, organiza e
   rascunha. A decisão é sempre do médico.
2. **Protocolo de crise é fixo e pré-aprovado.** Detecção → texto literal de `crisis_copy.py` →
   registra `protocolos_crise_acionados` → notifica médico → pausa automação. Nunca gerar texto de
   crise com LLM. O classificador é **fail-safe**: na dúvida, é crise.
3. **LGPD categoria especial.** Minimização de dados, controle de acesso, PII redatada em traces.
   Nunca logar conteúdo clínico cru. Com LLM em API externa (ADR-044), nunca enviar identificadores
   do paciente junto de conteúdo clínico.
4. **Médico no loop.** Toda resposta ao paciente passa por `audit_response`; escalável para humano
   via `escalate_to_human`.
5. **Trilhas de auditoria são imutáveis.** Nunca apagar `protocolos_crise_acionados`,
   `notificacoes_medico`, `agente_execucoes` (garantido no banco, ADR-017).
6. **Instrumentos clínicos validados** (PHQ-9, GAD-7, ASRS-18, …) nunca são inventados,
   parafraseados ou traduzidos por conta própria.

---

## Defesas estruturais em produção

- **RLS de tenant em profundidade (ADR-042):** 23 tabelas com Row-Level Security (migrations
  0037/0038). Gateway = `cerebro_gateway` (NOBYPASSRLS, tenant por GUC de sessão); workers Python =
  `cerebro_workers` (BYPASSRLS). Regressões de IDOR pegas por `apps/api-gateway-tests` (Testcontainers,
  gate no CI — cobre os 7 IDOR históricos).
- **Trava server-side dos prompts de salvaguarda (ADR-035):** prompts de detecção de crise e de
  auditoria bloqueados contra alteração pelo editor; demais validados (`PromptValidation`).
- **Entrega garantida do alerta de crise (ADR-041):** watchdog com retry/backoff e escalonamento até
  o médico confirmar.
- **Cifragem em repouso (ADR-018):** `mensagens.conteudo` cifrada (AES-256-GCM) no INSERT e decifrada
  no SELECT, simétrica entre Python e .NET.
- **SSL VerifyFull para o RDS (T1-4)**, **rate limit de login distribuído em Postgres (T1-1)**, e
  **Sentry LGPD-safe** (sem PII/body) em todos os serviços.

---

## Monorepo

```
apps/
  web/                Next.js 16 (landing + dashboard médico + /admin + portal /p/* + BFF)
  api-gateway/        .NET 10 — REST, JWT, EF Core, Resend, proxy SSE
  api-gateway-tests/  xUnit + Testcontainers — isolamento de tenant/RLS (gate no CI)
  orchestrator-py/    FastAPI + LangGraph — IA conversacional + protocolo de crise
  agents-py/          FastAPI + APScheduler — 6 agentes + 8 jobs operacionais
  notifier-py/        FastAPI + pywebpush — Web Push de check-ins / crise
  checkup/            Next.js — Check-up Mental (triagem pública; superfície anônima)
infra/
  migrations/         DDL versionado do Postgres (0001..0043, gap conhecido em 0008)
  aws/                CloudFormation (ASG+ALB do checkup, CloudFront), ECR, watchdogs, scripts
  ci/                 integration-smoke.sh (smoke real gateway+orchestrator+Postgres)
  seed/               seed de demonstração (médico + 3 pacientes com histórico)
  scripts/            migrações one-off (ex.: cifragem de mensagens, ADR-018)
docs/
  CONTEXT.md          arquitetura densa (referência de IA)
  DOCUMENTACAO-SISTEMA.md  versão humana mais legível
  DEBT.md             dívida técnica viva (priorizada por tier)
  runbooks/           operação (restore RDS, swap de roles, RLS, drills)
  adrs/               ADR-001..049
.github/workflows/    ci.yml · deploy.yml (deploy condicional por path) · restore-drill.yml
_v2-ref/              espelho somente-leitura do V2 — não editar, não buildar
```

> Use **pnpm** (não npm/yarn) em `apps/web` e `apps/checkup`. Workspace: `pnpm-workspace.yaml`.

---

## Portas e health

| Serviço | Porta host | Porta container | Health |
|---|---|---|---|
| web | 3000 | 3000 | HTTP `/` |
| api-gateway | 5050 | 5000 | `GET /health`, `GET /ready` |
| orchestrator-py | 8081 | 8081 | `GET /health`, `GET /ready` |
| agents-py | 8082 | 8082 | `GET /health`, `GET /ready` |
| notifier-py | 8083 | 8083 | `GET /health`, `GET /ready` |
| checkup | 3001 | 3001 | `GET /api/health` |
| PostgreSQL | externo (RDS) | — | via DSN |

> **Prod (ADR-045):** o checkup **não roda no box clínico** — vive em ALB + Auto Scaling Group
> próprio (`cerebro-checkup-asg`, t3.small). O `:3001` vale só para dev local. O box clínico roda
> só os 5 serviços clínicos via docker-compose. O Postgres (RDS) é externo e privado.

---

## Banco de dados

PostgreSQL (RDS `sa-east-1`, banco `cerebro_v3`), com **pgvector** (RAG) e **pgcrypto**. DDL
versionado em `infra/migrations/` (`0001_init.sql` … `0043`). Domínio em português.

**Modelo de entidade (leia antes de escrever query):**

- `clientes` = a **pessoa-paciente** (identidade do usuário do portal), não "cliente comercial".
- `usuarios` = login do médico; `medicos` = perfil clínico (1:1 com `usuarios`).
- `pacientes` = vínculo clínico médico↔paciente (PK = `cliente_id`).
- Tabelas clínicas têm coluna `paciente_id UUID` cuja **FK aponta para `clientes.id`** (não para
  `pacientes`).
- **Tenant = `medico_responsavel_id`**, alcançado por JOIN em `pacientes`:

```sql
SELECT t.* FROM <tabela> t
JOIN pacientes p ON p.cliente_id = t.paciente_id
WHERE p.medico_responsavel_id = :medicoId;
```

> **Armadilha:** `WHERE paciente_id = :x` sem o JOIN em `pacientes` **não escopa por médico**. O
> filtro de tenant é sempre via `medico_responsavel_id` — e a RLS está por baixo.

O Check-up usa exclusivamente o schema `checkup` (sem FK cruzando para o schema clínico).

---

## Variáveis de ambiente

Template completo em `.env.example`. Nunca commitar `.env` real; segredos vivem no **SSM Parameter
Store** (SecureString) e são injetados no deploy. Grupos:

- **Banco:** `POSTGRES_DSN` (.NET/Npgsql), `POSTGRES_DSN_URL` (Python/asyncpg) · `ENCRYPTION_KEY` (ADR-018)
- **Auth:** `JWT_SECRET` · `INTERNAL_API_TOKEN` (Bearer .NET ↔ Python)
- **E-mail:** `RESEND_API_KEY` · `EMAIL_FROM`
- **Web Push:** `VAPID_PUBLIC_KEY` · `VAPID_PRIVATE_KEY` · `VAPID_SUBJECT` · `NEXT_PUBLIC_VAPID_PUBLIC_KEY`
- **URLs internas:** `API_GATEWAY_URL` · `ORCHESTRATOR_PY_URL` · `AGENTS_PY_URL` · `NOTIFIER_PY_URL` · `FRONTEND_URL`
- **LLM (ADR-044):** `LLM_PROVIDER=anthropic` (vigente; `bedrock` reservado) · `ANTHROPIC_API_KEY` ·
  `ANTHROPIC_MODEL_HAIKU`/`_SONNET`/`_OPUS` (defaults: `claude-haiku-4-5-20251001`, `claude-sonnet-4-6`, `claude-opus-4-8`)
- **Bedrock (embeddings + caminho futuro):** `AWS_REGION`/`BEDROCK_REGION=sa-east-1` · `BEDROCK_MODEL_*` (inativos) ·
  `EMBEDDINGS_ENABLED` · `BEDROCK_EMBED_MODEL=cohere.embed-multilingual-v3` · `RAG_TOP_K`
- **Observabilidade:** `LANGSMITH_*` · `PII_REDACTION_ENABLED=true` · `SENTRY_DSN`
- **Modos:** `SHADOW_MODE` · `AGENTS_MODE` · `NOTIFIER_MODE` · `SCHEDULER_INTERVAL_SECONDS` ·
  `MAX_DAILY_LLM_USD` · `HUMAN_IN_THE_LOOP` · `ENABLE_AUDIT_AGENT`
- **Integrações:** Memed (`MEMED_*`), Asaas (`ASAAS_*`), CFM/Infosimples (`INFOSIMPLES_*`), S3 (`S3_BUCKET_*`)
- **Teleconsulta (ADR-026):** `STUN_URLS` · `TURN_URLS` · `TURN_SECRET` · `TURN_TTL_SECONDS` · `TURN_REALM` · `TURN_EXTERNAL_IP`
- **Checkup:** `CHECKUP_DATABASE_URL` (schema `checkup`) · `NEXT_PUBLIC_SITE_URL` · `QR_TARGET_URL` · `ANTHROPIC_API_KEY`

> Azure foi **removido** do projeto (nada de Key Vault, OpenAI ou Document Intelligence). Não reintroduzir.

---

## Desenvolvimento local

Pré-requisitos: Docker + Docker Compose, **pnpm**, .NET 10 SDK e Python 3.12 (para rodar serviços
isolados). Postgres é externo — aponte `POSTGRES_DSN`/`CHECKUP_DATABASE_URL` para o RDS (via box,
Session Manager) ou um Postgres local.

```bash
# 1) Preencha o .env a partir do template
cp .env.example .env   # edite com seus valores

# 2) Tudo de uma vez (5 serviços clínicos; checkup tem compose próprio)
docker compose up -d --build

# Serviços isolados:
cd apps/web         && pnpm install && pnpm dev      # :3000
cd apps/checkup     && pnpm install && pnpm dev      # :3001
cd apps/api-gateway && dotnet run                    # :5050
cd apps/orchestrator-py && uvicorn app.main:app --port 8081
cd apps/agents-py       && uvicorn app.main:app --port 8082
cd apps/notifier-py     && uvicorn app.main:app --port 8083

# Seed de demonstração (1 médico + 3 pacientes com histórico)
bash infra/seed/run_demo.sh

# Migrations (EF Core, no gateway)
cd apps/api-gateway && dotnet ef migrations add <Nome> && dotnet ef database update
```

`docker-compose.override.yml` (gitignored) monta `~/.aws:ro` nos serviços para dar credenciais AWS
em dev sem copiar chaves. Em prod, credenciais vêm da IAM role da EC2.

**Testes:**

```bash
# Python (orchestrator/agents/notifier): ruff + pytest
cd apps/orchestrator-py && pytest
# .NET (gateway + isolamento de tenant via Testcontainers)
cd apps/api-gateway-tests && dotnet test
# Checkup (motor de escalas é o primeiro a ter testes)
cd apps/checkup && pnpm test       # vitest
```

---

## Build, CI/CD e deploy

CI/CD via **GitHub Actions** (`.github/`), imagens no **ECR `sa-east-1`**, build paralelo via
`docker-bake.hcl` (TAG = `github.sha`, cache GHA).

- **`ci.yml`** (PR e branches ≠ `main`): `python` (ruff + pytest dos 3 serviços) · `dotnet` (build
  Release) · `dotnet-tests` (isolamento de tenant/RLS, xUnit + Testcontainers — pega IDOR
  cross-tenant) · `integration` (gateway + orchestrator + Postgres reais, `integration-smoke.sh`,
  **sem LLM**) · `web` (next build).
- **`deploy.yml`** (push em `main`, **condicional por path** com `dorny/paths-filter`):
  - **Clínico:** gate de testes Python → build do grupo `clinical` (5 imagens) → ECR → **SSM** no box
    `i-057860cd97edafefb` (`git pull`, ecr login, `docker compose pull && up -d`, loops de health/ready).
  - **Checkup:** `smoke-checkup` (vitest + next build + smoke) → build do grupo `checkup` → bump do SSM
    `/cerebro-amigo/checkup/image-tag` + **instance refresh** do ASG `cerebro-checkup-asg`
    (zero-downtime) + invalidação CloudFront.
- **`restore-drill.yml`** (mensal): restaura o RDS num clone efêmero, valida via SSM e derruba sempre
  (prova T1-5 da política de backup).

Rollback = redeploy de um SHA anterior (clínico via `IMAGE_TAG`; checkup via tag no SSM + novo refresh).
Topologia de dois destinos independentes (ADR-045): **box clínico** roda só os 5 serviços; **checkup**
vive em ALB + ASG próprio com IAM mínima (sem Bedrock, sem perms clínicas).

---

## Check-up Mental (`apps/checkup`)

Triagem pública e gratuita de saúde mental — **não diagnóstico** — com instrumentos clínicos
validados, devolutiva por IA template-driven e relatório PDF com QR. Motor de aquisição do
lançamento: SEO de alto volume do lado paciente; o QR no PDF recruta psiquiatras do lado médico
(métrica norte: médicos cadastrados por 1.000 testes concluídos).

**Escalas no motor — 8, todas `validated: true`:** PHQ-9 (depressão), GAD-7 (ansiedade), ASRS-18
(TDAH adulto), AUDIT (álcool), MDQ (bipolaridade), Fagerström (nicotina), MSI-BPD (traços borderline)
e ASSIST (uso de substâncias, com UX próprio — ADR-049). Scoring é **TypeScript puro, determinístico,
testado** — a IA nunca calcula escore.

**Regras de fronteira (valem para todo o monorepo):**

1. **Isolamento clínico ⇄ público.** Não importa código de `api-gateway`/`orchestrator-py`/`agents-py`/
   `notifier-py`, e nenhum serviço clínico importa o checkup. Só design tokens são compartilhados.
2. **Dados separados.** Usa exclusivamente o schema `checkup` no RDS. Sem FK entre schemas. Respostas
   de triagem jamais entram no prontuário.
3. **LLM:** Anthropic API direta (`claude-haiku-4-5`) nos Route Handlers do próprio app, **entrada
   estruturada apenas** (escala/escore/faixa) — nunca conteúdo livre nem PII. Saída validada por Zod,
   com **fallback estático** sempre disponível. Não passa pelo orchestrator.
4. **Tráfego anônimo:** rate limit por sessão nas rotas de LLM (Postgres-backed) + spend limit no
   Console da Anthropic, obrigatórios.

**Outras garantias:**

- **Crise first-class:** resposta > 0 no item 9 do PHQ-9 (e item de autolesão do MSI-BPD) desvia
  para `/crise` (tela estática, ilha clara, sem dark pattern) **antes** de qualquer escore.
- **Anônimo por padrão (LGPD):** teste roda sem cadastro, sessão UUID efêmera; respostas só persistem
  com consentimento explícito e sem PII; e-mail (opcional, só para enviar o PDF) vive em tabela
  separada, como hash. Funil é server-side (6 eventos), sem GA/pixels.
- **PDF** server-side (`@react-pdf/renderer`), uma página clínica, com QR para
  `cerebroamigo.com.br/medico?src=checkup&rid=<id-curto>` (atribuição sem identificar a pessoa).
- **Tema Neural Noir** idêntico ao site principal, exceto ilhas claras deliberadas (`/crise` e
  callouts de apoio) para máxima legibilidade.

Regras completas: `apps/checkup/CLAUDE.md`, `apps/checkup/docs/CRISIS-PROTOCOL.md` e os `CLAUDE.md`
de `src/lib/scales` e `src/lib/ai`.

---

## Decisões de arquitetura (ADRs)

Registro completo em `docs/adrs/`. Principais:

| # | Decisão | Status |
|---|---|---|
| 001 | Backend transacional em .NET | Accepted |
| 002 | IA conversacional em Python + LangGraph | Accepted |
| 003 | Agentes analíticos em Python sem LangGraph | Accepted |
| 004 | LGPD em traces de LangSmith | Accepted |
| 005 | Versionamento do texto de crise | Accepted |
| 006 | Fail-safe do classificador de crise | Accepted |
| 007 | Gateway em .NET 10, **não Go** | Accepted |
| 008 | LLM via Bedrock In-Region | **Superseded** (por 015) |
| 009 | Separação plano interativo (crise) / batch + builds no CI | Accepted |
| 010 | Triagem de crise no Diário (áudio e texto) | Accepted |
| 011 | Enforcement do teto de custo diário de LLM | Accepted |
| 014 | Candidatos incrementais em `find_pending` | Proposed |
| 015 | Camada LLM provider-switchável (Anthropic API ⇄ Bedrock) | Accepted |
| 016 | Agenda + console de revisão de mensagens | Accepted |
| 017 | Imutabilidade do audit trail no banco | Accepted |
| 018 | Cifragem em repouso de dados clínicos | Accepted |
| 019 | Retomada de automação pós-crise (auditada) | Accepted |
| 020 | Motor de conduta de automação por paciente | Accepted |
| 021 | Escopo administrativo da IA de comunicação | Accepted |
| 022 | Notificação externa de crise ao médico (e-mail) | Accepted |
| 023 | Jobs de conduta + gate SHADOW | Accepted |
| 024 | Integração MEMED (prescrição digital) | Accepted |
| 025 | Agenda — disponibilidade, conflito, lembretes, self-booking | Accepted |
| 026 | Teleconsulta por vídeo — WebRTC P2P self-hosted | Accepted |
| 027 | Measurement-Based Care — captura, desfecho e agente | Accepted |
| 028 | RAG com pgvector — busca semântica doctor-facing | Accepted |
| 029 | Monitoramento de exames laboratoriais | Accepted |
| 030–031 | Rede social de médicos verificados (+ extensões) | Proposed |
| 032 | Renovação de receita (A4) + rede de interações (A5) | Accepted |
| 033 | Monetização do médico + dashboard ROI + recall | Accepted |
| 034 | Cobrança recorrente da plataforma ao médico (Asaas) | Accepted |
| 035 | Trava server-side dos prompts de salvaguarda | Accepted |
| 036–039 | Cockpit de receita, supervisão de crise, trilha de acesso, direitos do titular (LGPD) | Accepted |
| 040 | Escriba clínico (Ambient Scribe) na teleconsulta | Accepted |
| 041 | Entrega garantida e escalonamento do alerta de crise | Accepted |
| 042 | Isolamento de tenant em profundidade (least-privilege + RLS) | Accepted |
| 043 | Alta disponibilidade e fim do SPOF | Proposed |
| 044¹ | LLM via Anthropic API direta — decisão **vigente** (sem arquivo próprio; ver ADR-015 + `CLAUDE.md`) | Vigente |
| 045 | Desacoplar o Check-up para ALB + Auto Scaling Group | Accepted |
| 045¹ | Validação e fidelidade das escalas do Check-up | Accepted |
| 046 | Check-up roda no EC2 (não na Vercel) | Accepted |
| 046¹ | Signup externo de médico + atribuição do Check-up | Accepted |
| 047 | CloudFront na frente do checkup | Proposed |
| 048 | Expansão das escalas do Check-up (AUDIT, MDQ, Fagerström, MSI-BPD) | Accepted |
| 049 | ASSIST com UX próprio no Check-up | Accepted |

> ¹ **Numeração:** os ADRs seguem `ADR-NNN-slug.md`, sequenciais e **sem reuso**. Os números
> **012 e 013** nunca tiveram arquivo (foram planejados no ADR-009 e descartados); fora isso a
> sequência 001–052 está completa. Índice canônico em [`docs/adrs/README.md`](docs/adrs/README.md).

---

## Documentação

- `docs/CONTEXT.md` — arquitetura densa (fonte para sessões de IA).
- `docs/DOCUMENTACAO-SISTEMA.md` — versão humana mais legível.
- `docs/DEBT.md` — dívida técnica viva, priorizada por tier (consulte antes de propor melhorias).
- `docs/runbooks/` — operação: restore RDS, swap de roles de banco, aplicação de RLS, drills.
- `docs/adrs/` — todos os ADRs.
- `CLAUDE.md` (raiz) e `apps/checkup/CLAUDE.md` — memória de projeto + regras inegociáveis.
- Skills em `.claude/skills/` (`cerebro-architecture`, `clinical-safety`, `dotnet-gateway`,
  `nextjs-bff`, `python-ai-services`) — carregadas sob demanda.

---

> **Estado:** migração V2→V3 concluída e em produção (EC2 + RDS, `sa-east-1`). Em construção:
> `apps/checkup` (Fase 2). O que falta é rastreado em `docs/DEBT.md`.
