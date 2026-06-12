# Runbook — deploy do signup externo de médico (ADR-046, Fase 5)

Coloca em produção o auto-cadastro de médico externo + atribuição do Check-up.
Branch `feat/signup-externo-medico` (Fases 1-4 implementadas). Toca **auth clínico** +
duas migrations. **A ordem importa.**

Topologia (reconciliada):
- **gateway** (.NET) + **checkup** (events) → EC2/ASG via pipeline (`deploy-clinical` / `deploy-checkup`).
- **web** (`/medico`, `/medicos/cadastro`, BFF) → **Vercel** (projeto www git-conectado, rootDir `apps/web`).

---

## ⚠️ Fase 0 — Migrations ANTES do código (bloqueia tudo)

O INSERT de onboarding (admin **e** self-signup) já referencia `medicos.signup_source` /
`checkup_rid`; o checkup grava `funnel_events.rid`. Se o gateway/checkup subir **antes** das
migrations, o INSERT quebra. Aplicar **primeiro**, via box (alcança o RDS), como o Gate 0:

```bash
# No Session Manager do box i-057860cd97edafefb (psql via docker, admin cerebroadmin):
ADMIN='postgresql://cerebroadmin:<SENHA>@cerebro-postgres.ch8u4aig6zs6.sa-east-1.rds.amazonaws.com:5432/cerebro_v3?sslmode=require'
# pegar os arquivos do repo no box (git pull) OU colar via SSM Parameter como no Gate 0.
cd /opt/cerebro-amigo-v3 && git fetch origin && git show origin/feat/signup-externo-medico:infra/migrations/0041_medicos_signup_attribution.sql | sudo docker run --rm -i postgres:16-alpine psql "$ADMIN" -v ON_ERROR_STOP=1 -f -
git show origin/feat/signup-externo-medico:infra/migrations/0042_checkup_funnel_events_rid.sql | sudo docker run --rm -i postgres:16-alpine psql "$ADMIN" -v ON_ERROR_STOP=1 -f -
```

Confere (deve listar as colunas novas):
```sql
\d medicos          -- signup_source, checkup_rid presentes
\d checkup.funnel_events  -- session_id nullable, rid presente
```

> Migrations são aditivas/idempotentes (`ADD COLUMN IF NOT EXISTS`, `DROP NOT NULL`). Seguras de re-rodar.

## Fase 1 — Env (confirmar, já devem existir)

- **Gateway:** `INFOSIMPLES_TOKEN`, `CRM_VALIDATION_ENABLED`, `RESEND_API_KEY`/`EMAIL_FROM`,
  `PORTAL_PACIENTE_URL` (link de ativação) — já usados pelo onboarding admin.
- **Vercel (web):** `API_GATEWAY_URL=https://api.cerebroamigo.com.br` (já existe p/ os outros BFF).
  `CHECKUP_EVENTS_URL` — opcional (default `https://checkup.cerebroamigo.com.br/api/events`).

## Fase 2 — Merge → deploy

Merge do PR em `main` (normal, **sem** `[skip ci]` — queremos deployar). O pipeline (path filter):
- `apps/api-gateway/**` mudou → **deploy-clinical** (recria stack clínico no EC2; blip de crise breve).
- `apps/checkup/**` mudou → **deploy-checkup** (instance refresh do ASG).
- `apps/web/**` mudou → **Vercel** builda o www (separado do pipeline EC2). *(O container web do EC2 também
  recria no deploy-clinical, mas o público `/medicos/cadastro` é servido pela Vercel.)*

CI deploy-checkup precisa das perms IAM já concedidas (`CerebroCheckupAsgDeploy`).

## Fase 3 — Smoke E2E (domínio real)

1. **QR/atribuição:** abrir `https://www.cerebroamigo.com.br/medico?src=checkup&rid=smoke1234` →
   banner aparece; conferir `qr_scanned` no CloudWatch do checkup (sem erro de DB) ou no
   `checkup.funnel_events WHERE rid='smoke1234'`.
2. **Form:** `/medicos/cadastro?src=checkup&rid=smoke1234` → `doctor_signup_started` gravado.
3. **Signup:** preencher com um **CRM Regular real de teste** (nome batendo com CFM) + e-mail teu →
   202 "confira seu e-mail". Conferir: `medicos.signup_source='checkup'`, `checkup_rid='smoke1234'`,
   `crm_situacao='Regular'`; `assinaturas.status='trial'`.
4. **Anti-fraude:** repetir com nome divergente → 422 `nome_divergente`. CRM cancelado → 422 `crm_invalido`.
   6 tentativas rápidas do mesmo IP → 429.
5. **Ativação:** abrir o link do e-mail (`/ativar-conta?token=`) → define senha → `/login` entra → JWT ok.
6. **Métrica:** `SELECT signup_source, count(*) FROM medicos GROUP BY 1;` e junção
   `funnel_events.rid ⇄ medicos.checkup_rid`.

## Rollback

- Código: reverter o merge (gateway/checkup pelo pipeline; web pela Vercel).
- Migrations: aditivas — não precisam reverter (colunas nullable, sem uso quebra nada). Se exigido:
  `ALTER TABLE medicos DROP COLUMN signup_source, DROP COLUMN checkup_rid;` (cuidado: perde atribuição).

## Pendências conhecidas (pós-MVP)
- Teste xUnit dedicado do endpoint `/auth/medico/signup` (mock CfmClient/Resend) — hoje coberto por build + 44 testes de isolamento.
- Enumeração de e-mail (409 `email_em_uso`) — risco baixo (CRM é público); avaliar resposta genérica.
- Spoof de X-Forwarded-For no rate-limit — mitigado por cache 30d do CfmClient + spend limit Infosimples.
