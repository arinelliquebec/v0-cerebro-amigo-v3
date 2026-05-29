# CONTEXT.md — Cérebro Amigo V3

Referência densa para sessões de IA. Atualizar a cada mudança estrutural relevante.
Versão humana mais legível: `docs/DOCUMENTACAO-SISTEMA.md`.

---

## O que é

SaaS de psiquiatria multi-tenant. Dois públicos: **médico** (dashboard `/dashboard/*`)
e **paciente** (PWA `/p/*`). Opera *entre consultas*: check-ins, adesão a medicação,
protocolo de crise, insights analíticos. Dado de saúde mental = LGPD categoria especial.

---

## Topologia

```
Paciente PWA /p/*      Médico /dashboard/*
        └──────────┬──────────┘
                   ▼
          web (Next.js :3000)
          BFF: app/api/* — cookies httpOnly
          auth_token (médico) · paciente_token (paciente)
                   ▼
          api-gateway (.NET 10 :5050→:5000)
          JWT · EF Core · Resend · proxy SSE
                   │  Bearer ${INTERNAL_API_TOKEN}
     ┌─────────────┼─────────────┬──────────────┐
     ▼             ▼             ▼              ▼
orchestrator-py  agents-py  notifier-py   PostgreSQL (RDS sa-east-1)
  :8081           :8082       :8083         pgvector + pgcrypto
  LangGraph       APScheduler  Web Push
  SSE conversa    5 agentes    check-ins
     └──────┬──────┘
            ▼
     AWS Bedrock In-Region sa-east-1
     Haiku · Sonnet · Opus 4.7 (IAM role)
```

**Azure: REMOVIDO.** Key Vault, OpenAI, Document Intelligence, Blob, Bicep — fora do V3.
**`ANTHROPIC_API_KEY`: NÃO EXISTE.** Auth por IAM role. Resíduo V2 = bug.

---

## Regra de fronteira

| Responsabilidade | Serviço |
|---|---|
| Chamar LLM (Claude) | **Apenas Python** (orchestrator-py, agents-py) via Bedrock |
| REST transacional, JWT, e-mail, proxy SSE | **api-gateway (.NET 10)** |
| Cookies, sessão, agregação, render | **web / BFF** (`app/api/*`) |
| Push de check-in | **notifier-py** |
| Jobs analíticos agendados | **agents-py** |

Nunca: LLM no gateway ou no front; CRUD Postgres direto do front; lógica clínica no BFF.

---

## Regras clínicas inegociáveis

1. IA não dá orientação clínica, diagnóstico nem ajuste de dose.
2. Protocolo de crise: texto **literal** de `crisis_copy.py` → registra `protocolos_crise_acionados` → notifica médico → pausa automação. Nunca gerar texto de crise com LLM.
3. Audit trail append-only: `protocolos_crise_acionados`, `notificacoes_medico`, `agente_execucoes`. Nenhum DELETE/UPDATE em massa.
4. PII nunca em traces: `PII_REDACTION_ENABLED=true` no LangSmith.
5. Toda resposta ao paciente passa por `audit_response`; escalável para humano via `escalate_to_human`.

---

## Portas e health

| Serviço | Porta host | Porta container | Health |
|---|---|---|---|
| web | 3000 | 3000 | — |
| api-gateway | 5050 | 5000 | `GET /health`, `GET /ready` |
| orchestrator-py | 8081 | 8081 | `GET /health`, `GET /ready` |
| agents-py | 8082 | 8082 | `GET /health`, `GET /ready` |
| notifier-py | 8083 | 8083 | `GET /health`, `GET /ready` |
| PostgreSQL | externo (RDS) | — | Via `POSTGRES_DSN` |

---

## Grafo conversacional (orchestrator-py)

```
load_context → detect_crisis (Haiku)
  → [crise] crisis_protocol (texto fixo crisis_copy.py) → END
  → classify_medication (Haiku) → update_intake
  → extract_symptoms (Sonnet) → generate_response (Sonnet, SSE)
  → audit_response (Haiku) → finalize | reescrever | escalate_to_human
```

Checkpointing: `AsyncPostgresSaver` LangGraph em tabelas `checkpoints*`.
Streaming: SSE — gateway faz proxy de `/internal/portal/conversation/message` → cliente.

---

## Agentes analíticos (agents-py)

| Agente | Função | Modelo |
|---|---|---|
| `resumo_pre_consulta` | Sumário pré-consulta | Sonnet |
| `adesao` | Taxa de medicação + engajamento | Haiku |
| `risco_silencioso` | Ausência atípica + sinais negativos | Sonnet |
| `padroes` | Tendências em sintomas (scipy) | Opus (opcional) |
| `diario` | Síntese de entradas compartilhadas | Sonnet |

`AGENTS_MODE=scheduled|manual`. `SHADOW_MODE=true` para rodar sem efeitos em dev.
Resultado em `insights` e `agente_execucoes` (append-only).

---

## Roteamento de modelo Bedrock por etapa

| Etapa | Variável |
|---|---|
| Detecção de crise, classificação, auditoria | `BEDROCK_MODEL_HAIKU` |
| Extração de sintomas, resposta ao paciente | `BEDROCK_MODEL_SONNET` |
| Análise de padrões densa | `BEDROCK_MODEL_OPUS` |

---

## Mapa de rotas web → domínio → gateway

| Rota web | Domínio | Endpoint gateway |
|---|---|---|
| `/dashboard/pacientes` | CRUD pacientes | `/api/v1/pacientes/*` |
| `/dashboard/prontuarios` | Ficha + histórico + prescrições | `/api/v1/pacientes/{id}`, `/api/v1/prescricoes/*` |
| `/dashboard/evolucao` | Timeline, humor, adesão, insights | `/api/v1/pacientes/{id}/timeline\|humor\|adesao`, `/api/v1/insights/*` |
| `/dashboard/checkins` | Check-ins de humor | `/api/v1/pacientes/{id}/checkins` |
| `/dashboard/mensagens` | Conversa médico↔paciente | `POST /api/portal/conversation/message` (SSE) |
| `/dashboard/agenda` | **Novo V3** — consultas | `/api/v1/consultas/*` (a criar) |
| `/login` | Auth médico | BFF `POST /api/auth/login` → `POST /api/v1/auth/login` |
| `/p/*` | **Portal paciente** (A FAZER) | humor, diário, medicações, conversa SSE, push |

---

## BFF (`apps/web/app/api/`)

| Rota BFF | Destino |
|---|---|
| `POST /api/auth/login`, `logout` | Gateway → JWT → cookie `auth_token` |
| `GET /api/dashboard/pacientes`, `resumo-pre-consulta` | Gateway |
| `GET/POST /api/dashboard/prescricoes/*` | Gateway |
| `POST /api/notificacoes/[id]/marcar-lida\|nao-lida` | Gateway |
| `GET /api/medicamentos` | Catálogo local `lib/catalogo-medicamentos.ts` |
| `POST /api/paciente/login`, `magic-validar`, `senha`, `logout` | Gateway → cookie `paciente_token` |
| `POST /api/paciente/conversation` | Proxy SSE → gateway → orchestrator-py |
| `GET/POST /api/paciente/diario`, `humor`, `checkins/*` | Gateway |
| `POST /api/paciente/push/subscribe` | Gateway |

Helpers: `lib/api-gateway.ts` (`proxyFetch`, `getGatewayUrl`), `lib/api.ts` (`fetchApi`).

---

## Banco de dados (domínio)

| Grupo | Tabelas |
|---|---|
| Tenancy | `clientes`, `usuarios`, `medicos`, `pacientes` |
| Conversação | `conversas`, `mensagens`, `conhecimento` (pgvector), `inbound_messages` |
| Clínico | `prescricoes`, `tomadas_medicacao`, `sintomas`, `eventos`, `consultas`, `questionarios` |
| Crise / audit | `protocolos_crise_acionados`, `notificacoes_medico` |
| Portal | `pacientes_credenciais`, `magic_links`, `diario_entradas` |
| Check-ins / push | `checkins`, `push_subscriptions`, `notificacoes_enviadas` |
| IA analítica | `insights`, `agente_execucoes` |

Migrations: `infra/migrations/` (DDL versionado). EF Core migrations em `apps/api-gateway/`.
pgvector para RAG futuro em `conhecimento`. pgcrypto para colunas sensíveis.

---

## Variáveis de ambiente (V3)

```
# Banco
POSTGRES_DSN

# Auth
JWT_SECRET                    # médico e paciente
INTERNAL_API_TOKEN            # .NET ↔ Python, Bearer

# E-mail
RESEND_API_KEY · EMAIL_FROM

# Web Push
VAPID_PRIVATE_KEY · VAPID_PUBLIC_KEY · NEXT_PUBLIC_VAPID_PUBLIC_KEY

# URLs (dev local → docker usa nomes de container)
API_GATEWAY_URL               # http://localhost:5050 / http://api-gateway:5000
ORCHESTRATOR_PY_URL           # http://localhost:8081
AGENTS_PY_URL                 # http://localhost:8082
NOTIFIER_PY_URL               # http://localhost:8083

# Bedrock (sem ANTHROPIC_API_KEY — auth por IAM role)
AWS_REGION=sa-east-1
BEDROCK_REGION=sa-east-1
BEDROCK_MODEL_HAIKU
BEDROCK_MODEL_SONNET
BEDROCK_MODEL_OPUS
AWS_PROFILE                   # dev local; prod usa IAM role da EC2

# Observabilidade
LANGSMITH_API_KEY · LANGSMITH_PROJECT · LANGSMITH_TRACING_V2
PII_REDACTION_ENABLED=true

# Modos
SHADOW_MODE                   # orchestrator-py: processa sem efeitos externos
AGENTS_MODE                   # scheduled | manual
NOTIFIER_MODE
SCHEDULER_INTERVAL_SECONDS
```

---

## Estado da migração V2 → V3

**Pronto:** landing, `/login` (mock), `/dashboard/*` (dados mock), monorepo skeleton, docker-compose.

**A FAZER (por prioridade):**
1. BFF real (`app/api/*`) + remover dados mock
2. `apps/api-gateway/` — portar .NET 10 do V2 (remover resíduos Azure/ANTHROPIC_API_KEY)
3. `apps/orchestrator-py/` — portar Python, trocar client Anthropic → Bedrock
4. `apps/agents-py/` — portar Python + Bedrock
5. `apps/notifier-py/` — portar Python
6. `infra/migrations/` — DDL do V2
7. `.github/workflows/deploy.yml` — CI/CD SSH EC2
8. IAM role na EC2 com `bedrock:InvokeModel` em sa-east-1
9. Portal paciente `/p/*` (PWA, push, conversa SSE)
10. Agenda `/dashboard/agenda` (novo no V3)

---

## ADRs

| # | Decisão | Status |
|---|---|---|
| [001](adrs/001-backend-transacional-net.md) | Backend transacional em .NET | Accepted |
| [002](adrs/002-ia-conversacional-python-langgraph.md) | IA conversacional Python + LangGraph | Accepted |
| [003](adrs/003-agentes-analiticos-python-vanilla.md) | Agentes analíticos Python sem LangGraph | Accepted |
| [004](adrs/004-lgpd-traces-langsmith.md) | LGPD em traces LangSmith | Accepted |
| [005](adrs/005-versionamento-texto-crise.md) | Versionamento texto de crise | Accepted |
| [006](adrs/006-fail-safe-classificador-crise.md) | Fail-safe classificador de crise | Accepted |
| [007](adrs/007-gateway-net-nao-go.md) | Gateway .NET, não Go (V3) | Accepted |
| [008](adrs/008-llm-bedrock-nao-anthropic-api.md) | LLM via Bedrock In-Region, não ANTHROPIC_API_KEY | Accepted |
