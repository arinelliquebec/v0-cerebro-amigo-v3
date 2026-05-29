# Documentação técnica do sistema Cérebro Amigo

**Versão consolidada** · Última revisão: maio de 2026

Documento de referência humana. Para sessões com assistentes de IA, use também [`CONTEXT.md`](../CONTEXT.md) (mais denso e atualizado por commit).

---

## 1. Visão geral

**Cérebro Amigo** é um sistema operacional para a prática psiquiátrica, focado em **continuidade de cuidado entre consultas**.

| Aspecto | Descrição |
| --- | --- |
| **Modelo comercial** | Multi-tenant: cada psiquiatra é um cliente; dados isolados por `medico_responsavel_id` |
| **Paciente** | Portal **PWA** (`/p/*`): humor, diário, medicações, check-ins via push, conversa (backend pronto) |
| **Médico** | **Dashboard** (`/dashboard/*`): pacientes, prescrições, timeline, insights, notificações |
| **WhatsApp** | **Não ativo** no orchestrator atual; canal conversacional é o PWA |

Não é um chatbot genérico: a plataforma estrutura check-ins de medicação, registro de humor, protocolos de segurança e agentes analíticos, com **audit trail** e separação clara entre **coleta automatizada** e **decisão clínica humana**.

---

## 2. Princípios clínicos e de compliance

1. **A IA não dá orientação clínica, diagnóstico nem ajuste de dose.** Automatiza lembretes, organização e rascunhos analíticos; a decisão é sempre do médico.
2. **Protocolo de crise é fixo:** detecção de sinal grave → texto pré-aprovado → notificação ao médico → pausa da automação. Referência obrigatória: `apps/orchestrator-py/app/conversation/crisis_copy.py` (ADR-005).
3. **LGPD categoria especial** (saúde mental): minimização, controle de acesso, redação de PII em traces LangSmith quando `PII_REDACTION_ENABLED=true`.
4. **Médico no loop:** auditoria conversacional pode bloquear ou escalar (`audit_response` → `escalate_to_human`); fila em `notificacoes_medico`.
5. **Trilhas de auditoria:** `protocolos_crise_acionados`, `notificacoes_medico`, `agente_execucoes` — não apagar silenciosamente.

---

## 3. Arquitetura lógica (estado atual)

```
┌─────────────┐                    ┌─────────────┐
│  Paciente   │                    │   Médico    │
│  PWA /p/*   │                    │ Dashboard   │
└──────┬──────┘                    └──────┬──────┘
       │                                │
       └────────────┬───────────────────┘
                    ▼
           ┌─────────────────┐
           │  web (Next.js)  │  :3000
           │  BFF + cookies  │  httpOnly auth_token / paciente_token
           └────────┬────────┘
                    ▼
           ┌─────────────────┐
           │  api-gateway    │  :5050 → :5000 (container)
           │  .NET 10        │  JWT, CRUD, e-mail, proxy SSE
           └────────┬────────┘
                    │
     ┌──────────────┼──────────────┬─────────────┐
     ▼              ▼              ▼             ▼
orchestrator-py  agents-py   notifier-py   PostgreSQL
  :8081            :8082         :8083        (RDS / externo)
LangGraph SSE    APScheduler   Web Push
Anthropic        5 agentes     check-ins
```

### Regras de integração

| Tipo | Onde roda |
| --- | --- |
| **LLM (Claude)** | Apenas em **Python** (`orchestrator-py`, `agents-py`) |
| **REST transacional** | **api-gateway** (.NET) |
| **BFF / cookies** | **web** (Next.js Route Handlers em `app/api/*`) |
| **OCR / Document Intelligence** | Serviço Azure externo; chamada recomendada via **BFF** ou futuro client no **api-gateway** (não é LLM) |

**Auth serviço-a-serviço:** `Authorization: Bearer ${INTERNAL_API_TOKEN}` entre .NET ↔ Python.

**Substituição concluída:** `apps/orchestrator/` e `apps/agents/` (Go) foram **removidos**; equivalentes em `orchestrator-py` e `agents-py`.

---

## 4. Estrutura do repositório

| Pasta | Responsabilidade | Tecnologia |
| --- | --- | --- |
| `apps/web/` | Landing, dashboard médico, portal paciente PWA, BFF | Next.js 16, React 19.2, TypeScript, Tailwind 4 |
| `apps/api-gateway/` | REST, JWT, EF Core, Resend, proxy SSE para conversa | ASP.NET Core / .NET 10 |
| `apps/orchestrator-py/` | IA conversacional (LangGraph), protocolo de crise | Python 3.12, FastAPI, LangGraph |
| `apps/agents-py/` | Jobs analíticos agendados ou manuais | Python 3.12, FastAPI, APScheduler, scipy |
| `apps/notifier-py/` | Disparo de Web Push para check-ins pendentes | Python 3.12, FastAPI, pywebpush |
| `infra/migrations/` | DDL versionado Postgres | SQL |
| `infra/aws/` | EC2, Lambdas, templates de produção | Shell, Python |
| `infra/bicep/` | IaC Azure (legado; não é deploy primário) | Bicep |
| `docs/adrs/` | Decisões arquiteturais 001–006 | Markdown |
| `.github/workflows/` | CI/CD (build + deploy SSH EC2) | GitHub Actions |

---

## 5. Serviços e portas (desenvolvimento local)

| Serviço | Porta host | Health |
| --- | --- | --- |
| web | 3000 | — |
| api-gateway | 5050 | `GET /health`, `GET /ready` |
| orchestrator-py | 8081 | `GET /health`, `GET /ready` |
| agents-py | 8082 | `GET /health`, `GET /ready` |
| notifier-py | 8083 | `GET /health`, `GET /ready` |
| PostgreSQL | externo | Via `POSTGRES_DSN` / `ConnectionStrings__Postgres` |

O `docker-compose.yml` **não** inclui container Postgres: o banco é externo (local ou RDS).

Comando típico: `docker compose up -d --build` na raiz, com `.env` preenchido a partir de `.env.example`.

---

## 6. Funcionalidades por superfície

### 6.1 Dashboard do médico (`/dashboard/*`)

- Lista e cadastro de pacientes (magic link por e-mail ou senha provisória)
- Ficha do paciente: abas resumo, acompanhamento, tratamento, eventos, notas (parcial)
- Timeline, gráfico de humor, adesão à medicação
- **Prescrições:** criação, histórico, desativação; catálogo de medicamentos psiquiátricos (`lib/catalogo-medicamentos.ts`)
- **Insights** dos agentes analíticos (prioridade por severidade)
- **Notificações** clínicas (marcar lida / não lida)
- Resumo pré-consulta on-demand
- Conversas e métricas operacionais (legado)
- Edição de prompts na tabela `agentes` (`/dashboard/agentes`)

Cookies: `auth_token` (httpOnly). Login: `POST /api/auth/login` → gateway `POST /api/v1/auth/login`.

### 6.2 Portal do paciente (`/p/*`)

- Home, humor, diário (compartilhamento opcional com médico)
- Medicações e confirmação de tomadas
- Perfil e troca de senha (`/p/trocar-senha`)
- Check-ins estruturados (`/p/checkin/[id]`) vindos de push
- **Web Push** (VAPID): subscribe via BFF
- **Conversa:** backend SSE via `POST /api/paciente/conversation` → gateway → orchestrator-py (**UI de chat no PWA ainda pendente**)

Cookies: `paciente_token`. Fluxos: magic link (`/p/entrar?token=`) ou senha inicial.

### 6.3 IA conversacional (orchestrator-py)

Grafo LangGraph (resumo):

```
load_context → detect_crisis (Haiku)
  → [crise] crisis_protocol (texto fixo) → END
  → classify_medication → update_intake
  → extract_symptoms (Sonnet) → generate_response (SSE)
  → audit_response → finalize | reescrever | escalate
```

| Etapa | Modelo típico |
| --- | --- |
| Detecção de crise | Haiku |
| Classificar resposta sobre medicação | Haiku |
| Extração de sintomas | Sonnet |
| Resposta ao paciente | Sonnet |
| Auditoria pré-envio | Haiku |

Modo sombra em dev: `SHADOW_MODE=true` (processa sem efeitos externos). ADR: `docs/adrs/002-ia-conversacional-python-langgraph.md`.

### 6.4 Agentes analíticos (agents-py)

| Agente | Função | Cadência típica |
| --- | --- | --- |
| `resumo_pre_consulta` | Sumário antes da consulta | tick 5 min, janela 30–120 min |
| `adesao` | Taxa de medicação + engajamento | tick 5 min, com thresholds |
| `risco_silencioso` | Ausência atípica + sinais negativos | tick 5 min |
| `padroes` | Tendências em sintomas (scipy) | 1×/dia/paciente |
| `diario` | Síntese de entradas compartilhadas | pré-consulta, ≥2 entradas |

Resultados em `insights` e `agente_execucoes`. Modo: `AGENTS_MODE=scheduled|manual`. ADR: `docs/adrs/003-agentes-analiticos-python-vanilla.md`.

### 6.5 Notifier (notifier-py)

- Varre `checkins` com `enviado_em IS NULL` e `agendado_para <= NOW()`
- Envia Web Push (VAPID) para `push_subscriptions` ativas
- **Não cria** check-ins de medicação automaticamente — apenas dispara os já existentes

### 6.6 Infraestrutura AWS (produção)

| Componente | Função |
| --- | --- |
| **RDS** PostgreSQL (sa-east-1) | Banco principal |
| **EC2** + Docker Compose | web, api-gateway, serviços Python |
| **Lambda** `cleanup-magic-links` | Limpeza diária de magic links e subscriptions revogadas |
| **Lambda** `resend-webhook` | Bounce/complaint/delivery → trilha |

Deploy: `.github/workflows/deploy.yml` (push `master` → SSH → `git pull` → compose). Guia: `docs/setup-guide.md`.

---

## 7. BFF Next.js (`apps/web/app/api/`)

O browser **não** chama o gateway diretamente na maioria dos fluxos; usa Route Handlers que repassam cookies e token.

| Rota BFF | Função |
| --- | --- |
| `POST /api/auth/login`, `logout` | Sessão médico |
| `GET/POST /api/dashboard/pacientes`, `resumo-pre-consulta` | Pacientes |
| `GET/POST /api/dashboard/prescricoes/*` | Prescrições |
| `POST /api/notificacoes/[id]/marcar-lida\|nao-lida` | Notificações |
| `GET /api/medicamentos` | Catálogo |
| `POST /api/paciente/login`, `magic-validar`, `senha`, `logout` | Auth paciente |
| `POST /api/paciente/conversation` | Proxy SSE conversa |
| `GET/POST /api/paciente/diario`, `[id]` | Diário |
| `POST /api/paciente/humor` | Humor |
| `GET/POST /api/paciente/checkins/[id]`, `responder` | Check-ins |
| `POST /api/paciente/push/subscribe` | Web Push |

Helpers: `lib/api-gateway.ts` (`proxyFetch`, `getGatewayUrl`), `lib/api.ts` (`fetchApi` em Server Components).

Variável: `API_GATEWAY_URL` — dev `http://localhost:5050`; em Docker `http://api-gateway:5000`.

---

## 8. API Gateway (.NET)

Base URL dev: `http://localhost:5050`  
OpenAPI (desenvolvimento): `/openapi/v1.json`

### Grupos REST principais

| Prefixo | Função |
| --- | --- |
| `POST /api/v1/auth/login` | JWT médico |
| `POST /api/v1/auth/paciente/*` | Magic link, login, senha |
| `/api/v1/pacientes/*` | CRUD, timeline, humor, adesão, resumo |
| `/api/v1/prescricoes/*` | Prescrições |
| `/api/v1/notificacoes/*` | Notificações ao médico |
| `/api/v1/insights/*` | Insights IA |
| `/api/v1/portal/paciente/*` | Home, diário, humor, medicações, perfil, check-ins, push |
| `POST /api/portal/conversation/message` | Proxy SSE → orchestrator-py |
| `/api/v1/payments/*`, `/api/v1/notas-fiscais/*` | Legado Mercado Pago / NFE.io |
| `POST /api/v1/seed/primeiro-medico` | Bootstrap único (409 se já existe) |

Middleware global: JSON de erro com `trace_id`; detalhes de exceção só com `EXPOSE_ERROR_DETAILS=true`.

### Endpoints internos Python (não expostos ao browser)

| Serviço | Exemplos |
| --- | --- |
| orchestrator-py | `POST /internal/portal/conversation/message` |
| agents-py | `POST /internal/agents/{name}/run`, resumo on-demand |
| notifier-py | `POST /internal/checkins/dispatch` |

---

## 9. Banco de dados (resumo de domínio)

Migrations: `infra/migrations/`

| Grupo | Tabelas (exemplos) |
| --- | --- |
| Tenancy | `clientes`, `usuarios`, `medicos`, `pacientes` |
| Conversação | `conversas`, `mensagens`, `conhecimento` (pgvector), `inbound_messages` |
| Clínico | `prescricoes`, `tomadas_medicacao`, `sintomas`, `eventos`, `consultas`, `questionarios` |
| Crise / audit | `protocolos_crise_acionados`, `notificacoes_medico` |
| Portal | `pacientes_credenciais`, `magic_links`, `diario_entradas` |
| Check-ins / push | `checkins`, `push_subscriptions`, `notificacoes_enviadas` |
| IA analítica | `insights`, `agente_execucoes` |
| Legado | `pagamentos`, `notas_fiscais`, `agentes` |

PostgreSQL usa **pgvector** (RAG futuro em `conhecimento`) e **pgcrypto**.

---

## 10. Integrações Azure

| Recurso | Uso no projeto | Status no código |
| --- | --- | --- |
| **Azure Key Vault** | Secrets em produção no api-gateway (`DefaultAzureCredential`) | Implementado (condicional) |
| **Application Insights** | Telemetria .NET | Opcional via connection string |
| **Azure OpenAI** | Whisper (áudio), embeddings `text-embedding-3-large` | Variáveis em `.env.example`; **sem consumo ativo** |
| **Azure Document Intelligence** | OCR de receitas e documentos (endpoint provisionado: `https://api-financeiro.cognitiveservices.azure.com/`) | **Provisionado no portal**; integração no app conforme evolução do produto |
| **Blob Storage** | Imagens (`*.blob.core.windows.net` em `next.config.ts`) | Preparado; upload não implementado |
| **Bicep** (`infra/bicep/`) | Container Apps, ACR, Postgres Flex | IaC legado; deploy primário é **AWS** |

### Document Intelligence (OCR) — desenho recomendado

1. Médico envia JPEG/PNG/PDF na tela de prescrição (ou futura aba “Documentos”).
2. BFF `POST /api/documentos/analisar` (autenticado) envia o arquivo à API REST Document Intelligence (`api-version` 2024-11-30, modelos `prebuilt-read`, `prebuilt-layout`, `prebuilt-document`).
3. Resposta: texto completo, linhas por página, pares chave-valor e tabelas — pré-preenchimento assistido de medicamento/posologia (médico revisa sempre).
4. Variáveis sugeridas no `.env`:
   - `AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT=https://api-financeiro.cognitiveservices.azure.com/`
   - `AZURE_DOCUMENT_INTELLIGENCE_KEY=` (Key 1 no portal do recurso)

Alternativa de médio prazo: client .NET em `apps/api-gateway/Services/` + persistência em migration `documentos_processados` (ver discussão em ADRs futuros).

---

## 11. Variáveis de ambiente críticas

| Variável | Uso |
| --- | --- |
| `POSTGRES_DSN` / `POSTGRES_HOST`, `POSTGRES_PASSWORD`, … | Banco |
| `ANTHROPIC_API_KEY`, `MODEL_HAIKU`, `MODEL_SONNET` | LLM |
| `JWT_SECRET` | JWT médico e paciente |
| `INTERNAL_API_TOKEN` | .NET ↔ Python |
| `RESEND_API_KEY`, `EMAIL_FROM` | E-mail transacional |
| `VAPID_*`, `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | Web Push |
| `API_GATEWAY_URL` | Next.js → gateway |
| `ORCHESTRATOR_PY_URL` | Gateway → orchestrator-py |
| `LANGSMITH_*`, `PII_REDACTION_ENABLED` | Observabilidade |
| `SHADOW_MODE` | orchestrator-py |
| `AGENTS_MODE`, `NOTIFIER_MODE`, `SCHEDULER_INTERVAL_SECONDS` | Schedulers |
| `AZURE_OPENAI_*` | Opcional (Whisper/embeddings) |
| `AZURE_DOCUMENT_INTELLIGENCE_*` | OCR (quando integrado) |

Template: `.env.example` na raiz.

---

## 12. Operação local e produção

### Local

1. Copiar `.env.example` → `.env` e preencher (mínimo: Postgres, Anthropic, JWT, Resend, VAPID, token interno).
2. Aplicar migrations SQL no Postgres acessível.
3. `docker compose up -d --build`.
4. Seed: `POST /api/v1/seed/primeiro-medico` (ver `docs/setup-guide.md` ou seed SQL `006_seed_medico_arinpar.sql` em dev).
5. Médico: http://localhost:3000/login · Paciente: http://localhost:3000/p/entrar

**VAPID:** gerar uma vez; regerar invalida todas as subscriptions.

### Go-live (checklist)

1. Revisão psiquiátrica do texto de crise (`crisis_copy.py`).
2. Dados legais (CNPJ, DPO) em `/privacidade` e comunicações.
3. HTTPS na frente do EC2 (Cloudflare/nginx).
4. Domínio Resend com SPF/DKIM.
5. Ensaio ponta a ponta do protocolo de crise.
6. Teste de push PWA (iOS exige app na tela inicial).

---

## 13. Lacunas conhecidas (MVP)

| Item | Estado |
| --- | --- |
| UI de chat no PWA | Backend SSE pronto; frontend pendente |
| Job de **criação** automática de check-ins de medicação | Notifier só dispara existentes |
| Cadastro de 2º médico | Fora do MVP (seed único) |
| WhatsApp Cloud API | Removido do fluxo atual |
| PHQ-9 / GAD-7 via check-in agendado | Schema existe; fluxo incompleto |
| Pagamentos / NF | Endpoints legados |
| OCR Document Intelligence no app | Recurso Azure provisionado; wiring no repositório conforme prioridade |
| `RUNNING.md` | Parcialmente desatualizado (cita Go e Postgres no compose) |

---

## 14. Boas práticas de segurança

1. Não logar conteúdo bruto de mensagens de pacientes em produção.
2. Não chamar Anthropic direto do .NET ou Next.js.
3. Não usar `localStorage` para tokens de sessão.
4. Preferir Postgres a estado em memória nos serviços.
5. Nova automação com impacto clínico exige revisão médica documentada.

---

## 15. Glossário

| Termo | Significado |
| --- | --- |
| BFF | Backend-for-Frontend — rotas `app/api/*` no Next.js |
| Gateway | api-gateway .NET — REST e proxy SSE |
| orchestrator-py | Serviço de conversação LangGraph |
| agents-py | Jobs analíticos (insights) |
| notifier-py | Disparo de push para check-ins |
| Insight | Artefato gerado por agente analítico |
| Check-in estruturado | Pergunta com respostas pré-codificadas (ex.: tomou medicação?) |
| PWA | Portal paciente instalável (`public/sw.js`) |

---

## 16. Referências no repositório

| Arquivo | Conteúdo |
| --- | --- |
| [`README.md`](../README.md) | Visão do produto e diagrama |
| [`CONTEXT.md`](../CONTEXT.md) | Referência técnica para IAs |
| [`docs/setup-guide.md`](./setup-guide.md) | Deploy AWS |
| [`docs/adrs/`](./adrs/) | ADRs 001–006 |
| [`apps/orchestrator-py/README.md`](../apps/orchestrator-py/README.md) | Grafo conversacional |
| [`apps/agents-py/README.md`](../apps/agents-py/README.md) | Agentes analíticos |
| [`apps/notifier-py/README.md`](../apps/notifier-py/README.md) | Push de check-ins |

**Responsável clínico final:** o médico titular da conta. O software é ferramenta de apoio, não substituto de julgamento clínico.
