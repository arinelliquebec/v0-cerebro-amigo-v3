---
name: cerebro-architecture
description: >-
  Referência de arquitetura do Cérebro Amigo V3 (SaaS de psiquiatria multi-tenant
  na AWS). Use SEMPRE que for planejar, desenhar ou modificar qualquer coisa
  estrutural: adicionar/mover serviço, criar endpoint novo, decidir onde uma
  responsabilidade mora (gateway .NET vs Python vs BFF), mapear uma rota do
  frontend para o backend, escolher entre serviços, ou avaliar trade-offs de
  stack (ex.: .NET 10 vs Go, Bedrock vs API direta, AWS vs Azure). Consulte
  mesmo que o usuário não diga "arquitetura" — qualquer mudança que cruze a
  fronteira entre serviços passa por aqui.
---

# Arquitetura — Cérebro Amigo V3

SaaS de psiquiatria multi-tenant. Dois públicos: **médico** (dashboard) e **paciente** (PWA). AWS-only, `sa-east-1`.

> Fonte da verdade completa: `docs/CONTEXT.md`. Esta skill é o resumo operacional para decisões de fronteira.

## Topologia

```
Paciente PWA /p/*   Médico dashboard
        └──────┬──────────┘
               ▼
        web (Next.js :3000)  ── BFF: Route Handlers app/api/*, cookies httpOnly
               ▼
        api-gateway (.NET 10 :5050→:5000)  ── JWT, EF Core, Resend, proxy SSE
               │  Authorization: Bearer ${INTERNAL_API_TOKEN}
   ┌───────────┼───────────┬───────────┐
   ▼           ▼           ▼           ▼
orchestrator agents-py  notifier-py  PostgreSQL (RDS sa-east-1)
 :8081        :8082      :8083        pgvector + pgcrypto
 LangGraph   APScheduler Web Push
   └─────┬─────┘
         ▼
   AWS Bedrock In-Region sa-east-1 (IAM role)
   Haiku · Sonnet · Opus 4.7
```

## Regra de fronteira (decide "onde isso mora")

| Tipo de trabalho | Serviço dono |
| --- | --- |
| Chamar Claude / LLM | **Apenas Python** (orchestrator-py, agents-py) via Bedrock |
| CRUD transacional, JWT, e-mail, proxy SSE | **api-gateway** (.NET 10 → migrando p/ Scala/JVM, ADR-067) |
| Cookies, sessão, agregação para tela, render | **web / BFF** (`app/api/*`) |
| Push de check-in | **notifier-py** |
| Jobs analíticos agendados | **agents-py** |

Nunca: LLM no gateway ou no front; CRUD direto do front no Postgres; lógica clínica no BFF.

## Decisões de stack (fechadas)

- **Gateway: migrando .NET 10 → Scala 3/JVM via strangler (ADR-067, SUPERSEDE ADR-007).** Motivo: fluência do time é Scala (não F#) + JVM posiciona p/ futuro bounded context de pagamento/fraude (Fluxo B). Os dois COEXISTEM (`apps/api-gateway` .NET + `apps/api-gateway-scala`: cats-effect/http4s/Tapir/Doobie); o BFF aponta pro .NET até o flip por endpoint; **clínico/dinheiro migram POR ÚLTIMO** (com `clinical-safety` + suíte de tenant verde). Invariantes preservados: `cerebro_gateway` NOBYPASSRLS + GUC `app.current_medico` (Scala usa `set_config` tx-local) + JWT HS256 mesmo segredo. **Go segue descartado** — não confundir a migração p/ JVM com reintroduzir Go.
  - *Histórico (ADR-007, superseded) — por que .NET venceu Go:* reaproveitava o gateway do V2, EF Core no CRUD-pesado, integração AWS; Go só venceria por RAM ociosa (não-gargalo).
- **LLM = Bedrock In-Region sa-east-1** (ADR-008). Haiku/Sonnet/Opus 4.7 confirmados na região. Dado de inferência fica no Brasil → ideal p/ LGPD, sem transferência internacional. Sem `ANTHROPIC_API_KEY`; IAM role.
- **Azure removido.** Sem Key Vault, sem Document Intelligence, sem Azure OpenAI. Não reintroduzir.

## Mapa rota V3 → domínio → endpoints

| Rota (web) | Domínio | Endpoints de gateway |
| --- | --- | --- |
| `/dashboard` | visão geral | agregação de vários |
| `/dashboard/pacientes` | CRUD pacientes | `/api/v1/pacientes/*` |
| `/dashboard/prontuarios` | ficha + histórico + prescrições | `/api/v1/pacientes/{id}`, `/api/v1/prescricoes/*` |
| `/dashboard/evolucao` | timeline, humor, adesão, insights | `/api/v1/pacientes/{id}/timeline\|humor\|adesao`, `/api/v1/insights/*` |
| `/dashboard/checkins` | check-ins de humor | `/api/v1/pacientes/{id}/checkins` |
| `/dashboard/mensagens` | conversa médico↔paciente | `POST /api/portal/conversation/message` (SSE) |
| `/dashboard/agenda` | **novo no V3** — consultas | `consultas` (endpoint a criar) |
| `/login` | auth médico | `POST /api/v1/auth/login` via BFF `POST /api/auth/login` |
| `/p/*` | **portal paciente (A FAZER)** | humor, diário, medicações, conversa SSE, push |

## Os 5 agentes (agents-py)

Jobs analíticos, não conversacionais. Rodam em `SHADOW_MODE` antes de produção (logam o que fariam sem agir). Detalhe em `python-ai-services`.

## O que decidir consultando outras skills

- Mexer em resposta ao paciente / crise / dado clínico → **clinical-safety** (antes de codar).
- Implementar endpoint/EF Core/SSE no gateway → **dotnet-gateway**.
- Client Bedrock / LangGraph / agente → **python-ai-services**.
- BFF, cookie, Server Component, PWA → **nextjs-bff**.

## Estado

Pronto: landing, login (mock), dashboard (mock). A FAZER: BFF real, portar gateway + 3 Python + infra, Bedrock, IAM role, portal `/p/*`, agenda. Ao concluir mudança estrutural, gravar ADR em `docs/adrs/`.
