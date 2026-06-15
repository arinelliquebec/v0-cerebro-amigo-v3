# ADR-055: Sem trial — acesso por assinatura com prazo de pagamento (paywall) + cadência mensal/trimestral

**Status:** Proposed
**Data:** 2026-06-15
**Decisores:** Dono (Rafael) + equipe de engenharia; revisão `clinical-safety` antes de implementar.
**Categoria:** Produto / Negócio / Segurança clínica
**Relação:** estende e revê a premissa de **trial** do **ADR-034** (cobrança recorrente)
e do **ADR-046** (onboarding cria assinatura `trial` de 30 dias). Não cria modelo
de tenancy novo (ADR-042). Acompanha a reestruturação de planos da `/precos`
(Solo Pro / Solo Consultoria / Clínica Consultoria).

## Contexto

Dois fatos apurados no código:

1. **Não existe paywall hoje.** `assinaturas.status` (trial/ativa/suspensa/cancelada)
   e `trial_ate` só são **gravados** (onboarding), **exibidos** ("Minha assinatura")
   e usados em **ferramentas do admin** (relatório de trials vencendo, MRR, cockpit).
   **Em lugar nenhum o acesso é bloqueado** por status ou prazo — o acesso é só por JWT.
   Logo, um médico de self-signup (ADR-046, CRM verificado) ganha **acesso clínico
   completo, de graça, por tempo indeterminado**.
2. O onboarding cria `status='trial'` + `trial_ate = NOW() + 30 dias`, nunca enforced.

Decisão do dono (2026-06-15): **não haverá período trial**. O médico é cliente
desde o cadastro; o acesso pleno vem com o **pagamento confirmado**. Para acomodar a
logística de pagamento (Pix/boleto demora a compensar; o médico precisa de alguns
dias para acertar), abre-se um **prazo curto de pagamento** — não um trial de
avaliação.

## Decisão

**Paywall por assinatura, sem trial, com prazo de pagamento.**

- **Onboarding (sem trial):** cria a assinatura em `status='pendente'` com
  **`prazo_pagamento_ate = NOW() + X dias`** (coluna nova; **não** reusar `trial_ate`,
  cuja semântica é de trial). `X` = **5 dias** (config `ASSINATURA_PRAZO_PAGAMENTO_DIAS`, default 5). Vale para
  admin e self-signup. O campo `trial_ate` fica deprecado para linhas novas.
- **Durante o prazo (`pendente`, dentro de `prazo_pagamento_ate`):** o médico tem
  acesso ao dashboard para configurar e começar, e vê um aviso persistente
  "conclua o pagamento da sua assinatura" com o link de pagamento.
- **Pagamento confirmado (webhook Asaas → `ativa`):** acesso **total às features do
  plano**, sem prazo. (Webhook já existe — `CobrancasEndpoints`, ADR-034.)
- **Prazo vence sem pagamento (`pendente` e `NOW() > prazo_pagamento_ate`, ou
  `suspensa` por inadimplência):** o **dashboard do médico é bloqueado** por uma tela
  "ative sua assinatura para continuar" + link de pagamento. **Mas ver a invariante
  clínica abaixo.**
- **Cadência de cobrança por plano** (Asaas `cycle` deixa de ser fixo MONTHLY):
  - **Solo Pro → MENSAL.**
  - **Solo Consultoria / Clínica Consultoria → TRIMESTRAL** (casa com o mínimo de 3
    meses). Valor do ciclo = 3× a mensalidade com **10% de desconto**:
    Solo Consultoria **R$ 4.023/trimestre**; Clínica a partir de **R$ 7.830/trimestre**.
- **Como o médico paga (v1):** reusar a ativação Asaas do ADR-034 (admin "Ativar
  cobrança Asaas" → link enviado ao médico) **e/ou** expor um botão de pagamento na
  tela "ative sua assinatura" (self-checkout — link da subscription Asaas). Com prazo
  curto + self-signup, o **v1 já é self-checkout**: o médico paga sozinho na tela de
  bloqueio (link da subscription Asaas gerado na hora).

### Invariante de segurança clínica (NÃO viole)

> **O paywall bloqueia apenas a UI do dashboard do médico. Ele NUNCA desliga a
> detecção de crise (orchestrator) nem a entrega do alerta de crise ao médico
> (notifier-py / e-mail, ADR-041 e ADR-022).**

Racional: se o médico cadastrar pacientes durante o prazo e depois não pagar,
bloquear o dashboard **cegaria a crise** desses pacientes — fere "médico no loop"
(regra #4 da `clinical-safety`). Como o alerta de crise é **empurrado** por canal
próprio (e-mail/push), independente do login no dashboard, um médico com a UI
bloqueada **continua recebendo** o alerta. Assim:

- `pendente` recém-criado = **zero pacientes** (não dá pra cadastrar paciente sem
  acesso) → bloquear é 100% seguro, sem responsabilidade clínica.
- `suspensa`/prazo vencido **com pacientes ativos** → dashboard bloqueado, **mas o
  canal de crise segue** entregando. O offboarding "de verdade" (transição/baixa de
  pacientes com continuidade de cuidado) é projeto à parte, fora deste ADR.
- A tela de bloqueio nunca esconde um caminho de crise/segurança; só o trabalho
  administrativo/produto fica atrás do paywall.

## Modelo de estados (assinaturas.status)

```
pendente  → em prazo de pagamento (acesso liberado + aviso)
ativa     → pagamento confirmado (acesso total às features do plano)
suspensa  → prazo vencido sem pagar OU inadimplência pós-ativação (dashboard gated;
            crise NUNCA gated)
cancelada → encerrada
```

`trial` deixa de ser criado (mantido no enum só para linhas legadas até migração de
dados, se houver). Atualizar os enums e contadores que hoje falam "trial":
`AdminEndpoints`/`/admin/financeiro` (z.enum status/plano), cockpit de aquisição
(`emTrial` → `emPrazo`/`pendente`), receita (`trials.*`), MRR (já filtra `ativa`).

## Onde mora (fronteira)

- **Gate (enforcement):** decisão de **acesso do médico** = transacional, no
  **api-gateway (.NET)** e/ou no **BFF/dashboard layout** (web). O status efetivo
  (`pendente`-em-prazo vs vencido vs `ativa`) é derivado server-side; o front só
  renderiza a tela de bloqueio. Sem LLM.
- **Cobrança:** Asaas via gateway (ADR-034). `cycle` passa a variar por plano.
- **Crise:** **inalterada** — orchestrator + notifier (ADR-041/022). O paywall não
  toca esse caminho.

## Parâmetros (confirmados 2026-06-15)

1. **`X` (dias de prazo de pagamento): 5** — config `ASSINATURA_PRAZO_PAGAMENTO_DIAS` (default 5).
2. **Trimestral dos planos Consultoria: 3× a mensalidade com 10% de desconto** —
   Solo Consultoria R$ 4.023/tri; Clínica a partir de R$ 7.830/tri.
3. **Pagamento no v1: self-checkout** — o médico paga sozinho na tela de bloqueio.

## Progresso

- ✅ **Fase 1 (backend) — branch `claude/paywall-sem-trial`:** migration `0045`
  (`assinaturas.prazo_pagamento_ate`); `MedicoOnboardingService` cria assinatura
  `pendente` + prazo (`ASSINATURA_PRAZO_PAGAMENTO_DIAS`, default 5) em vez de trial
  30d; `/medico/signup` passa `plano='pendente'`. **Sem enforcement ainda** (acesso
  inalterado) — fundação. **Migrations NÃO aplicadas em prod.**
- ⏳ Fase 2 (cadência): Asaas `cycle` mensal/trimestral + valor do ciclo (−10%).
- ⏳ Fase 3 (self-checkout): catálogo de planos + criar subscription Asaas + tela
  "ative sua assinatura" com escolha de plano.
- ⏳ Fase 4 (gate): enforcement server-side + paywall, **com a invariante de crise**.
- ⏳ Fase 5: enums/cockpit do admin (`trial`→`pendente`).

## Consequências / fases sugeridas

1. **Migration:** `assinaturas.prazo_pagamento_ate` (nullable); manter `trial_ate`.
2. **Onboarding (`MedicoOnboardingService`):** `status='pendente'`,
   `prazo_pagamento_ate=NOW()+X`, sem trial. (Admin e self-signup.)
3. **Cadência:** Asaas subscription com `cycle` por plano (MONTHLY/QUARTERLY) e valor
   do ciclo correto.
4. **Gate:** helper server-side `assinaturaLiberada(status, prazo_pagamento_ate)` +
   tela "ative sua assinatura" no dashboard; **com** a invariante de crise.
5. **Admin/cockpit:** enums e rótulos (`trial`→`pendente`/`em prazo`).
6. **(Depois) self-checkout** na tela de bloqueio; **(depois)** offboarding clínico
   de `suspensa` com pacientes.

## Gatilhos de revisão

- Volume de self-signup que exija self-checkout automático (sair do admin-link).
- Necessidade de offboarding clínico real para inadimplentes com pacientes.
- Pedido de desconto ou outra cadência de cobrança por plano.
