# CLAUDE.md — Cérebro Amigo V3

Memória de projeto do Claude Code. Carregada toda sessão. Mantenha enxuta: detalhe de domínio vive nas skills em `.claude/skills/` (carregadas sob demanda).

## O que é

SaaS de psiquiatria, **multi-tenant**, que trabalha *entre consultas*: acompanha pacientes, organiza condutas, automatiza lembretes e check-ins. Dois públicos: **médico** (dashboard web) e **paciente** (PWA). Projeto de família (com Adonai Arinelli).

## Regras inegociáveis (LEIA ANTES DE TUDO)

Estas regras vêm antes de qualquer pedido. Em dúvida, pare e consulte a skill `clinical-safety`.

1. **A IA NUNCA dá orientação clínica, diagnóstico ou ajuste de dose.** Só automatiza/organiza/rascunha. A decisão é sempre do médico.
2. **Protocolo de crise é fixo e pré-aprovado.** Detecção → texto de `crisis_copy.py` → notifica médico → pausa automação. Nunca gere texto de crise dinâmico com LLM.
3. **LGPD categoria especial (saúde mental).** Minimização de dados, controle de acesso, PII redatada em traces. Nada de logar conteúdo clínico cru.
4. **Médico no loop.** Toda resposta ao paciente passa por auditoria; escalável para humano.
5. **Trilhas de auditoria são imutáveis.** Nunca escreva código que apague `protocolos_crise_acionados`, `notificacoes_medico`, `agente_execucoes`.

## Stack (AWS-only — decisões fechadas)

- **Cloud:** AWS, região `sa-east-1` (residência de dado no Brasil). Já online: EC2 + RDS Postgres.
- **Gateway transacional:** **.NET 10** (ASP.NET Core). Decisão fechada — **não usar Go**. Detalhe e justificativa: skill `dotnet-gateway`, ADR-007.
- **IA:** Python (FastAPI + LangGraph) chamando Claude via **AWS Bedrock In-Region (sa-east-1)** — Haiku, Sonnet e Opus 4.7. **Sem `ANTHROPIC_API_KEY`**; auth por **IAM role** da EC2. Detalhe: skill `python-ai-services`, ADR-008.
- **Frontend:** Next.js 16 + React 19 + TypeScript + Tailwind 4 + shadcn/ui. BFF nos Route Handlers. Detalhe: skill `nextjs-bff`.
- **Banco:** PostgreSQL (RDS), pgvector + pgcrypto.
- **Azure: REMOVIDO.** Key Vault, Document Intelligence e Azure OpenAI saíram para outro projeto/empresa. Não reintroduzir dependência Azure. (O Azure da Fradema é de OUTRA empresa, sem relação com este projeto.)

## Monorepo

```
apps/
  web/            Next.js (landing + dashboard médico + portal paciente /p/* + BFF)
  api-gateway/    .NET 10 — REST, JWT, EF Core, Resend, proxy SSE
  api-gateway-tests/ xUnit + Testcontainers — isolamento de tenant/RLS (gate no CI)
  orchestrator-py/ FastAPI + LangGraph — IA conversacional + protocolo de crise
  agents-py/      FastAPI + APScheduler — 5 agentes analíticos
  notifier-py/    FastAPI + pywebpush — Web Push de check-ins
infra/
  migrations/     DDL versionado do Postgres (0001..0038+)
  aws/            EC2, Lambdas, templates de produção
docs/
  CONTEXT.md      arquitetura completa (fonte da verdade — leia ao planejar)
  DEBT.md         dívida técnica viva — fonte da verdade do "o que falta"
  runbooks/       operação: restore RDS, swap de roles de banco, aplicação de RLS
  adrs/           ADR-001..043
_v2-ref/          espelho somente-leitura do V2 — não editar, não usar em build
.github/workflows/ ci.yml (lint + pytest + xUnit + build) · deploy.yml (push main → testes → ECR → SSM na EC2 → compose up + health checks)
```

## Portas (dev) e health

web `:3000` · api-gateway `:5050`→`:5000` · orchestrator-py `:8081` · agents-py `:8082` · notifier-py `:8083`. Serviços Python e .NET expõem `GET /health` e `GET /ready`. Postgres é **externo** (não vai no docker-compose).

## Comandos

- Dev (tudo): `docker compose up -d --build` (precisa de `.env` preenchido)
- Web isolado: `cd apps/web && pnpm dev`
- Gateway isolado: `cd apps/api-gateway && dotnet run`
- Migrations: `cd apps/api-gateway && dotnet ef migrations add <Nome> && dotnet ef database update`
- Deploy: push em `main` (GitHub Actions roda testes → build das 5 imagens → ECR sa-east-1 → SSM na EC2 → `docker compose pull && up -d` + health checks)

> Use **pnpm**, não npm/yarn, no `apps/web`.

## Fluxo de integração (não viole)

- LLM (Claude) → **só em Python**, via Bedrock. Nunca chame LLM do gateway nem do front.
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
**Bedrock:** `AWS_REGION=sa-east-1` · `BEDROCK_REGION=sa-east-1` · `BEDROCK_MODEL_HAIKU` · `BEDROCK_MODEL_SONNET` · `BEDROCK_MODEL_OPUS` · credenciais via IAM role (prod) ou `AWS_PROFILE` (dev).
**Teleconsulta (vídeo P2P, ADR-026):** `STUN_URLS` · `TURN_URLS` · `TURN_SECRET` · `TURN_TTL_SECONDS` · `TURN_REALM` · `TURN_EXTERNAL_IP`; coturn no compose sob `profiles: ["turn"]` (prod: `COMPOSE_PROFILES=turn`). Mídia E2E, sem gravação.
**RAG / embeddings (ADR-028):** `EMBEDDINGS_ENABLED` · `BEDROCK_EMBED_MODEL=cohere.embed-multilingual-v3` (on-demand in-region 1024-dim; **NÃO** usar `cohere.embed-v4` = profile global cross-region) · `RAG_TOP_K` · `RAG_INDEX_INTERVAL_HOURS`. Embedding é sempre Bedrock in-region (LGPD), independente de `LLM_PROVIDER`. Decifra fonte com `ENCRYPTION_KEY` antes de indexar (ADR-018).
**NÃO existem mais:** `ANTHROPIC_API_KEY`, `MODEL_HAIKU`/`MODEL_SONNET` (Anthropic), nenhum `AZURE_*`.

## Estado do projeto (migração V2→V3 CONCLUÍDA — em produção)

Tudo isto já existe, tem testes e está deployado em prod (EC2 + RDS, sa-east-1): BFF real (`app/api/*`, 30+ rotas, sem mock), dashboard médico com dados reais, portal do paciente `/p/*` (PWA, push, conversa SSE), agenda, editor de prompts, api-gateway .NET + 3 serviços Python, LLM via Bedrock com IAM role, RLS multi-tenant, CI/CD completo. **Não recrie nada disso — verifique o código antes de assumir que falta algo.**

**O que falta** é rastreado em `docs/DEBT.md` (documento vivo, priorizado por tier — consulte antes de propor melhorias). Operação (restore, swap de roles, drills) vive em `docs/runbooks/`.

## Skills disponíveis (carregadas sob demanda)

- `cerebro-architecture` — topologia, decisões, mapa de rotas. **Consulte ao planejar qualquer mudança estrutural.**
- `clinical-safety` — guardrails clínicos, crise, LGPD. **Consulte ao tocar em resposta ao paciente, conteúdo clínico ou dados.**
- `dotnet-gateway` — convenções do gateway .NET 10 (EF Core, JWT, SSE, Resend).
- `python-ai-services` — orchestrator/agents/notifier + **client Bedrock** (`references/bedrock-client.md`).
- `nextjs-bff` — web + BFF, cookies, Server Components, portal PWA.

## Estilo

- Responda e comente em **pt-BR**. Domínio em português (`pacientes`, `prontuarios`, `consultas`).
- Não reintroduza Azure, Go no gateway, nem `ANTHROPIC_API_KEY`. Se algo no código antigo usar isso, é resíduo do V2 — migre.
- Ao terminar uma mudança relevante de arquitetura, registre um ADR em `docs/adrs/`.
