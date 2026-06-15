# ADR-043: Alta disponibilidade e fim do SPOF — plano

**Status:** Em andamento. Observabilidade (Sentry, watchdog) e **alarme de backup
(item E)** feitos; **Multi-AZ (item A) ATIVO desde 2026-06-14**. Falta: redundância
de EC2 (item B) e RDS Proxy (item D).
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
  clínico não pode sumir numa falha de AZ. **✅ FEITO 2026-06-14:** `cerebro-postgres`
  Multi-AZ ativo (standby montado em ~3 min; failover automático; endpoint inalterado,
  sem mudança no app). _Nota: a instância foi migrada no mesmo dia para `cerebro-postgres-enc`
  (cifrada em repouso, também Multi-AZ) — ver ADR-054; a antiga será descomissionada ~16/06._

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
  testado é backup que pode não existir. **(Feito — T1-5; restore-drill mensal no CI.)**

### D. Conexões sob escala-out — RDS Proxy
- **Problema:** `db.t4g.medium` tem `max_connections` de só ~340–450 (limitado por RAM).
  Conforme o checkup escala out (ASG, cada instância com pool) somado aos pools do box
  clínico (Npgsql do gateway, default 100; orchestrator psycopg3 10 + asyncpg 20; agents
  10), o teto real sob carga vira **conexões**, não CPU.
- **O quê:** **RDS Proxy** na frente do RDS — multiplexa "muitas instâncias → poucas
  conexões" e preserva conexões durante o failover do Multi-AZ (sinergia com o item A).
- **Custo:** por vCPU da instância RDS/hora (ordem de ~US$10–20/mês nessa escala).
- **Interim barato (sem Proxy):** orçar `MaxPoolSize` (Npgsql) + pools asyncpg p/ a soma
  ficar folgada abaixo do `max_connections`; ligar Performance Insights p/ ver
  `DatabaseConnections` real.
- **Recomendação:** orçar os pools **agora** (de graça); **RDS Proxy antes do checkup
  viralizar**, junto do Multi-AZ.

### E. Alarme de backup parado (T1-6)
- **O quê:** Lambda diária (EventBridge) mede a idade do snapshot automático mais recente
  do `cerebro-postgres-enc` → métrica `Cerebro/RDS BackupAgeHours` → alarme CloudWatch (idade
  > limite, ou Lambda sem publicar → `TreatMissingData: breaching`) → SNS/e-mail.
- **Custo:** desprezível (1 invocação/dia). **IaC:** `infra/aws/rds-backup-alarm.yaml`.
- **Recomendação:** **fazer já** — backup que para sem alerta é o pior caso do item C.
- **✅ FEITO 2026-06-14:** stack `cerebro-rds-backup-alarm` no ar (alarme `cerebro-rds-backup-stale`,
  `State: OK`). **Re-apontado para `cerebro-postgres-enc`** após a migração de cifragem (ADR-054):
  `cloudformation deploy ... --parameter-overrides DbInstanceId=cerebro-postgres-enc` + invoke da
  Lambda p/ semear a métrica na nova dimensão. O **default do template** também passou a
  `cerebro-postgres-enc`, p/ um deploy futuro sem override não voltar a mirar a instância antiga
  (que será deletada ~16/06).

## Consequências

- Com Multi-AZ + restore-drill, o banco (o dado que importa) fica resiliente a falha
  de AZ e a corrupção (restore provado).
- O SPOF de compute (EC2) permanece até B1/B2 — mitigado por restart automático +
  watchdog (recuperação rápida, alerta), mas não eliminado.
- Próximo: CloudWatch alarm de status-check do EC2 (auto-recovery da instância) é um
  meio-termo barato antes de B1.
- Conexões (D) e alerta de backup (E) endereçados no plano: o teto de `max_connections`
  deixa de ser o limite quando o checkup escala (Proxy/orçamento de pools), e backup
  parado passa a alertar em vez de ser descoberto na hora do restore.
