# ADR-043: Alta disponibilidade e fim do SPOF — plano

**Status:** Proposed (plano). Wins baratos de observabilidade já feitos (ADR sem
custo); itens pagos (Multi-AZ, redundância EC2) aguardam decisão do dono.
**Data:** 2026-06-09
**Decisores:** Rafael Arinelli (responsável / decisão de custo)
**Categoria:** Infra / disponibilidade

## Contexto

Item #3 do roadmap "infalível". Hoje a plataforma tem pontos únicos de falha e
observabilidade fraca:

- **1 EC2** (`i-057860cd97edafefb`) roda **os 5 serviços** (web, gateway, 3 Python).
  Se a instância cair, tudo cai.
- **RDS single-AZ** (`cerebro-postgres`, db.t4g.medium). Sem standby → falha de AZ
  ou de instância = banco indisponível até recriar/restaurar.
- Backup automático do RDS existe, mas **nunca foi testado** (restore não exercido).

## Já feito (sem custo) — commit 6f31172

- `restart: unless-stopped` nos 5 serviços core (container que crasha volta sozinho).
- **Sentry no backend** (.NET + 3 Python), LGPD-safe (sem PII em trace).
- **Watchdog de saúde** (cron + Resend): e-mail quando um /health cai. Fim do
  "só sabe que caiu quando reclamam".

## Decisão (itens pagos) — opções e custo

### A. RDS Multi-AZ (failover automático do banco)
- **O quê:** standby síncrono em outra AZ; failover automático (~60–120s) em falha.
- **Custo:** ~2× o preço da instância RDS (standby cobrado). db.t4g.medium ≈ +US$70/mês.
- **Downtime p/ habilitar:** ~minutos (modify aplica standby).
- **Recomendação:** **fazer** — é o maior ganho de resiliência por real gasto. Dado
  clínico não pode sumir numa falha de AZ.

### B. Redundância de EC2 (matar o SPOF de compute)
- **Opção B1 — ALB + 2ª instância (ASG 2x):** balanceador + 2 EC2 idênticas atrás.
  Stateless já (sessão em cookie/JWT, estado no RDS). Custo: ALB ~US$18/mês + 2ª
  instância (dobra o EC2). Complexidade média (target group, health check, deploy
  nos 2 nós).
- **Opção B2 — ECS Fargate:** migrar os containers p/ Fargate (sem servidor). Reescreve
  o deploy (hoje SSH+compose). Custo variável; mais elástico. Esforço alto.
- **Recomendação:** **adiar** até Multi-AZ + observabilidade rodarem. B1 quando o
  uptime de compute virar gargalo; B2 só se a operação crescer.

### C. Drill de restore do backup (validar o que já existe)
- **O quê:** restaurar o último backup/PITR num instance temporário, validar contagem
  de tabelas, derrubar. Runbook: `docs/runbooks/rds-restore-drill.md`.
- **Custo:** ~US$ centavos (instância de minutos) + ~20min. **Fazer já** — backup não
  testado é backup que pode não existir.

## Consequências

- Com Multi-AZ + restore-drill, o banco (o dado que importa) fica resiliente a falha
  de AZ e a corrupção (restore provado).
- O SPOF de compute (EC2) permanece até B1/B2 — mitigado por restart automático +
  watchdog (recuperação rápida, alerta), mas não eliminado.
- Próximo: CloudWatch alarm de status-check do EC2 (auto-recovery da instância) é um
  meio-termo barato antes de B1.
