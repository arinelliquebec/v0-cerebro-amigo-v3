# ADR-050 — Cockpit de Aquisição + Check-up longitudinal anônimo

> **Cérebro Amigo** · site oficial: https://www.cerebroamigo.com.br · Check-up Mental: https://checkup.cerebroamigo.com.br

- **Status:** Parte 1 (Cockpit de Aquisição) **Accepted — implementado**; Parte 2 (Check-up longitudinal anônimo) **Proposed — design**.
- **Data:** 2026-06-13
- **Relacionados:** ADR-046 (signup externo + atribuição do Check-up), ADR-045 (Check-up em ASG/ALB próprio),
  ADR-042 (RLS de tenant), ADR-036 (least-privilege roles — schema `checkup` isolado), ADR-044 (LLM Anthropic),
  `apps/checkup/CLAUDE.md`, `docs/CRISIS-PROTOCOL.md`, skill `clinical-safety`.

## Contexto

O Check-up Mental é o **motor de aquisição** do Cérebro Amigo: SEO de altíssimo volume do lado paciente
(8 escalas validadas, 9 landings) e, do lado médico, o PDF com QR que recruta psiquiatras. A **métrica norte**
é **médicos cadastrados por 1.000 testes concluídos** (`apps/checkup/CLAUDE.md`).

Dois fatos definem o momento:

1. **O loop de aquisição foi construído (ADR-046) mas ainda não rende.** QR → `/medico` → `/medicos/cadastro`
   → atribuição (`medicos.signup_source/checkup_rid` ⇄ `checkup.funnel_events.rid`). Porém: (a) a métrica norte
   **não tinha onde ser vista** (só por SQL manual); (b) o funil é de **um toque só** e depende de uma cadeia
   física improvável (paciente baixa PDF → leva ao médico → médico escaneia → cadastra).
2. **Há um descasamento de público.** O Check-up atrai **pacientes** em massa, mas a métrica e a monetização são
   de **médicos**. Hoje o ativo mais abundante que o Check-up gera — a intenção de alguém em sofrimento buscando
   ajuda — é **descartado num PDF** ao final. As 5 ideias de produto do roadmap (`docs/Cerebro_Amigo_5_Ideias_Oscar.md`)
   são todas do lado **clínico** (Scribe, Predição de Crise, DTx, FHIR, Outcomes) — nenhuma toca a aquisição.

Este ADR ataca os dois fatos: **Parte 1** torna a métrica norte visível e acionável (pré-condição de qualquer
otimização); **Parte 2** transforma o Check-up de evento único em relacionamento longitudinal anônimo, movendo as
duas alavancas ao mesmo tempo (valor clínico + aquisição) e plantando a semente da ideia de maior impacto do
roadmap (Outcomes/RWE), que hoje depende de massa de dados.

---

## Parte 1 — Cockpit de Aquisição (Accepted, implementado)

### Decisão

Painel admin (`/admin/aquisicao`, policy `admin_geral`) que mostra o funil de ponta a ponta do motor de aquisição
e a métrica norte, **por escala/landing**:

```
testes iniciados → concluídos → PDFs gerados → QR escaneados → cadastros iniciados → médicos cadastrados → médicos ativos
└─────────────── Check-up (anônimo, schema `checkup`) ───────────────┘   └──── clínico (schema `public`) ────┘
```

### Arquitetura — o BFF junta duas fontes ISOLADAS

O gateway clínico (`cerebro_gateway`) **não tem grant no schema `checkup`** (ADR-036/migration 0036 só concede
`public`; ADR-042 isola o tenant). Logo o cockpit **não faz** — e não deve fazer — JOIN `medicos ⇄ funnel_events`
no banco. A junção é **lógica, no BFF** (regra de fronteira do projeto: "agregação para tela → web/BFF"), exatamente
como o ADR-046 já fez a web ler a API pública do Check-up:

- **Gateway** `GET /api/v1/admin/aquisicao` (schema `public`): médicos por `signup_source`, médicos do Check-up por
  status de assinatura, `rid`s distintos atribuídos, série temporal de cadastros, drill-down dos últimos médicos.
- **Check-up** `GET /api/funnel-metrics` (schema `checkup`): contagens **agregadas** de `funnel_events` por
  `event_type` e por escala + série de `test_completed`/mês. **Nunca** `session_id`, `rid` individual, e-mail ou
  conteúdo de triagem. Protegido por `CHECKUP_METRICS_TOKEN` (Bearer); **fail-closed** — sem token configurado,
  responde **503** (não expõe métricas de negócio em superfície pública). `Cache-Control: no-store`.
- **BFF** `GET /api/admin/aquisicao` (web): chama as duas em paralelo (gateway via cookie `auth_token`; Check-up via
  token) e calcula a métrica norte = `médicos do Check-up ÷ testes concluídos × 1.000`. Degrada com elegância: se o
  Check-up estiver indisponível, mostra só o lado clínico com aviso.

### Por que respeita as regras inegociáveis

- **Isolamento clínico ⇄ checkup** preservado: cada serviço lê só o seu schema; nenhuma FK cross-schema; o web
  nunca escreve `checkup`.
- **LGPD**: só agregados (contagens). `rid` (8 chars) não é PII; o nome do médico é dado profissional. Sem dado
  de paciente, sem conteúdo clínico.
- **Atribuição** (`rid`) reaproveitada do ADR-046; nada novo no modelo de tenancy.

### Dependência

Requer as migrations **0041/0042 aplicadas** (Fase 5 do ADR-046). O endpoint do gateway referencia
`medicos.signup_source/checkup_rid` — sem a 0041 a query falha (o mesmo já vale para o INSERT de onboarding).

### Env

`CHECKUP_METRICS_TOKEN` (SSM SecureString — **mesmo valor** no web/BFF e no Check-up) · `CHECKUP_METRICS_URL`
(web; default `https://checkup.cerebroamigo.com.br/api/funnel-metrics`). Deploy: token no SSM do Check-up (ASG) e
na env do web (Vercel + container do EC2).

---

## Parte 2 — Check-up longitudinal anônimo (Proposed, design)

### Decisão

Transformar o Check-up de **teste avulso** em **acompanhamento longitudinal anônimo** (measurement-based care
público): ao fim do teste (fora de crise), a pessoa pode optar por **reagendar o re-rastreio** (e-mail opt-in, que
já existe via `report_emails` + SES) e, ao voltar, ver a **evolução** do seu escore ao longo do tempo.

### Por que move as duas alavancas

- **Valor ao Cérebro Amigo:** leva o *measurement-based care* (coração clínico do produto) à superfície de maior
  tráfego; começa a acumular **massa de dados longitudinais anônimos** — o que destrava a ideia #5 do roadmap
  (Outcomes/RWE), hoje bloqueada por "depende de massa", pelo canal mais barato e volumoso, sem tocar dado
  identificável.
- **Captação via Check-up:** cada re-rastreio = **novo PDF = novo toque de QR** → multiplica as chances de o médico
  ser alcançado (a aquisição compõe ao longo do tempo, em vez de um disparo único). O e-mail reforça o CTA "leve seu
  acompanhamento ao seu psiquiatra". Sobe `report_generated`, topo do funil de médicos do Cockpit (Parte 1).

### Modelo de dados (schema `checkup`, sem PII, sem FK cross-schema)

```sql
-- Série de acompanhamento: identifica uma sequência de re-rastreios SEM PII.
-- O "dono" da série é um token aleatório opaco (no link do e-mail), nunca o e-mail.
CREATE TABLE checkup.tracking_series (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  series_token TEXT NOT NULL UNIQUE,     -- opaco, no link; nunca derivado de PII
  scale_id    TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_seen_at TIMESTAMPTZ
);

-- Pontos da série (escore por data). Sem respostas item-a-item, sem texto livre.
CREATE TABLE checkup.tracking_points (
  id         BIGSERIAL PRIMARY KEY,
  series_id  UUID NOT NULL REFERENCES checkup.tracking_series(id) ON DELETE CASCADE,
  total_score INTEGER NOT NULL,
  band       TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Agendamento do nudge (e-mail). E-mail só como HASH (LGPD) — o envio guarda o
-- endereço cru apenas em memória no momento do disparo (mesmo padrão de report_emails).
CREATE TABLE checkup.tracking_reminders (
  id          BIGSERIAL PRIMARY KEY,
  series_id   UUID NOT NULL REFERENCES checkup.tracking_series(id) ON DELETE CASCADE,
  email_hash  TEXT NOT NULL,            -- bcrypt, como report_emails
  due_at      TIMESTAMPTZ NOT NULL,
  sent_at     TIMESTAMPTZ,
  unsubscribed BOOLEAN NOT NULL DEFAULT FALSE
);
```

### Fluxo

1. Fim do teste, **fora de crise**, escore moderado/grave → oferta opt-in (checkbox desmarcado): "Quer acompanhar
   isso? Te lembro de refazer em 14 dias." → cria `tracking_series` + `tracking_reminders` (e-mail = hash).
2. Job de envio (server-side, in-region SES) dispara o nudge no `due_at`: **template fixo, sem LLM, sem conteúdo
   clínico** — "faz 14 dias, que tal refazer seu Check-up? [link com `series_token`]". Link de **unsubscribe**
   obrigatório.
3. Pessoa volta pelo link → refaz → grava `tracking_points` → vê a **evolução** (gráfico do escore na própria série).
4. Mesma proteção de crise de hoje (PHQ-9 item 9 / MSI-BPD item 2 → `/crise`); o nudge **nunca** é agendado para
   quem roteou para crise.

### Conformidade (clinical-safety — revisar ANTES de implementar)

- **Anônimo por padrão (LGPD categoria especial):** série identificada por token opaco, nunca por PII; e-mail só em
  hash (espelha `report_emails`, sem FK para as respostas); opt-in explícito; **unsubscribe** em todo e-mail.
- **Crise é first-class:** estática, pré-aprovada (`docs/CRISIS-PROTOCOL.md`); o funil longitudinal jamais sobrepõe
  o desvio de crise nem manda nudge a quem está em crise.
- **Triagem nunca é diagnóstico:** o e-mail e a tela de evolução não interpretam resultado; texto fixo, sem geração
  livre. A IA não calcula escore (scoring é TypeScript determinístico).
- **Isolamento:** tudo no schema `checkup`; nenhum dado entra no prontuário; o clínico não importa nada do Check-up.

### Fases (sugeridas)

1. Migrations (`checkup`: `tracking_series`/`tracking_points`/`tracking_reminders`) — aditivas, testáveis isoladas.
2. Opt-in + criação da série no fim do teste (reusa `report_emails`/SES; depende do **SES production-access**, CK-4).
3. Job de envio do nudge (template fixo) + unsubscribe.
4. Tela de evolução por `series_token`.
5. Smoke E2E + revisão `clinical-safety` (gera texto visto pelo usuário).

---

## Notas

- Parte 1 (Cockpit) **não** depende do SES nem da Parte 2 — entrega valor assim que 0041/0042 forem aplicadas.
- Marca **Cérebro Amigo** e site oficial **https://www.cerebroamigo.com.br** aparecem no rodapé do Cockpit, no PDF
  do Check-up (QR) e em todo e-mail/relatório gerado.
