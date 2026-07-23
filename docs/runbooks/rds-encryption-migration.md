# Runbook — Migração de cifragem em repouso do RDS clínico

Recria o RDS clínico com **storage encryption** (KMS) — RDS **não liga in-place**. Procedimento
reutilizável (também serve de molde p/ trocar classe/parameter group via snapshot+restore).
Decisão e log da execução de 2026-06-14: **ADR-054**.

> **Origem:** `cerebro-postgres` (db.t4g.medium, `sa-east-1`, `Encrypted: false`).
> **Destino:** `cerebro-postgres-enc` (KMS CMK, Multi-AZ, mesma classe/SG/subnet/param group).
> **Cutover = só troca de host** (DSN clínico + SSM do checkup) — sem mudança de schema/código/DSN.

## ⚠️ O delta do scheduler (gotcha principal)

"Sem usuários" **não** significa "sem escrita". O `agents-py` (APScheduler) e o `orchestrator-py`
escrevem nas trilhas append-only **`agente_execucoes`** e **`notificacoes_medico`** o tempo todo.
O snapshot é point-in-time; tudo escrito entre o snapshot e o cutover fica **só no OLD**.

Duas formas de garantir **zero perda** (regra #5 — trilhas imutáveis):
- **Preferido:** **parar o `agents-py`** (e idealmente o `notifier-py`) **antes do snapshot**, congelando
  as tabelas que crescem. Retomar após o cutover.
- **Fallback (foi o caso em 2026-06-14):** backfill OLD→enc das tabelas append-only com
  `INSERT … SELECT … ON CONFLICT (id) DO NOTHING` (PK `uuid` ⇒ sem colisão) + sweep dos stragglers
  pós-cutover. Verificar `missing_in_enc = 0`.

## Pré-requisitos
- AWS CLI com RDS + KMS + SSM + AutoScaling; `export AWS_PAGER=""`.
- Config a espelhar: classe `db.t4g.medium`, subnet group `default`, SG `sg-01b07c7f4a5e0b2c5`,
  parameter group `default.postgres16` (preserva o `force_ssl`/verify-full do T1-4).
- Token do host (conta/região): `ch8u4aig6zs6` → OLD `cerebro-postgres.ch8…`, enc `cerebro-postgres-enc.ch8…`.

## Fase 0 — CMK + espelhar config
```bash
export AWS_PAGER=""
KMS_ARN=$(aws kms create-key --region sa-east-1 \
  --description "Cerebro RDS at-rest" --query 'KeyMetadata.Arn' --output text)
aws kms create-alias --region sa-east-1 --alias-name alias/cerebro-rds --target-key-id "$KMS_ARN"
aws rds describe-db-instances --region sa-east-1 --db-instance-identifier cerebro-postgres \
  --query 'DBInstances[0].{Class:DBInstanceClass,Subnet:DBSubnetGroup.DBSubnetGroupName,SG:VpcSecurityGroups[0].VpcSecurityGroupId,PG:DBParameterGroups[0].DBParameterGroupName}' --output table
```

## Fase 1 — congelar escrita → snapshot → cópia cifrada
```bash
# congela as trilhas que crescem (no box): para o firehose do APScheduler
#   docker compose stop agents-py notifier-py     # (anote a hora — é o "freeze")

SNAP=cerebro-pre-cifra-$(date +%Y%m%d-%H%M)
aws rds create-db-snapshot --region sa-east-1 --db-instance-identifier cerebro-postgres --db-snapshot-identifier "$SNAP"
aws rds wait db-snapshot-available --region sa-east-1 --db-snapshot-identifier "$SNAP"
aws rds copy-db-snapshot --region sa-east-1 --source-db-snapshot-identifier "$SNAP" \
  --target-db-snapshot-identifier "${SNAP}-enc" --kms-key-id "$KMS_ARN"
aws rds wait db-snapshot-available --region sa-east-1 --db-snapshot-identifier "${SNAP}-enc"
aws rds describe-db-snapshots --region sa-east-1 --db-snapshot-identifier "${SNAP}-enc" \
  --query 'DBSnapshots[0].{Status:Status,Encrypted:Encrypted}' --output table   # quer: available / true
```

## Fase 2 — restaurar cifrada (Multi-AZ)
```bash
aws rds restore-db-instance-from-db-snapshot --region sa-east-1 \
  --db-instance-identifier cerebro-postgres-enc --db-snapshot-identifier "${SNAP}-enc" \
  --db-instance-class db.t4g.medium --db-subnet-group-name default \
  --vpc-security-group-ids sg-01b07c7f4a5e0b2c5 --db-parameter-group-name default.postgres16 \
  --multi-az --no-publicly-accessible
aws rds wait db-instance-available --region sa-east-1 --db-instance-identifier cerebro-postgres-enc
```
> `DBInstanceAlreadyExists`? Inspecione o que já existe; se `Encrypted: false`, `delete-db-instance
> --skip-final-snapshot --delete-automated-backups` e refaça.

## Fase 3 — validar a nova instância
```bash
aws rds describe-db-instances --region sa-east-1 --db-instance-identifier cerebro-postgres-enc \
  --query 'DBInstances[0].{Endpoint:Endpoint.Address,Encrypted:StorageEncrypted,MultiAZ:MultiAZ,Status:DBInstanceStatus}' --output table
# pelo box: psql como cerebroadmin → \dt  \du (cerebro_gateway/workers/checkup_app)  \dx (vector/pgcrypto)
```

## Fase 4 — cutover (só host; 2 pontos)
**Clínico** (box, `/opt/cerebro-amigo-v3/.env`):
```bash
cp /opt/cerebro-amigo-v3/.env /opt/cerebro-amigo-v3/.env.bak-precifra
sed -i 's/cerebro-postgres\.ch8u4aig6zs6/cerebro-postgres-enc.ch8u4aig6zs6/g' /opt/cerebro-amigo-v3/.env
grep -E 'POSTGRES_(DSN|HOST|DSN_URL)|CHECKUP_DATABASE_URL' /opt/cerebro-amigo-v3/.env   # host ...-enc...
docker compose -f /opt/cerebro-amigo-v3/docker-compose.yml up -d   # recria os 5 no enc
```
**Checkup** (SSM + refresh):
```bash
OLD=$(aws ssm get-parameter --region sa-east-1 --name /cerebro-amigo/checkup/database-url --with-decryption --query Parameter.Value --output text)
NEW=$(printf '%s' "$OLD" | sed 's/cerebro-postgres\.ch8u4aig6zs6/cerebro-postgres-enc.ch8u4aig6zs6/g')
aws ssm put-parameter --region sa-east-1 --name /cerebro-amigo/checkup/database-url --value "$NEW" --type SecureString --overwrite
aws autoscaling start-instance-refresh --region sa-east-1 --auto-scaling-group-name cerebro-checkup-asg
```

## Fase 4.5 — reconciliar o delta (se não parou os jobs a tempo)
Backfill OLD→enc das append-only que cresceram no gap, idempotente por PK uuid:
```sql
-- exemplo p/ agente_execucoes e notificacoes_medico (rodar OLD→enc via dblink/temp table):
INSERT INTO agente_execucoes      SELECT * FROM <fonte_old> ON CONFLICT (id) DO NOTHING;
INSERT INTO notificacoes_medico   SELECT * FROM <fonte_old> ON CONFLICT (id) DO NOTHING;
-- verificar: SELECT count(*) FROM old EXCEPT SELECT ... ⇒ missing = 0
```
Sweep pós-cutover p/ stragglers do `orchestrator-py`. **Shred** qualquer CSV de export do `/tmp` do
box (LGPD — pode conter `notificacoes_medico`). `protocolos_crise_acionados`/`mensagens`/`consultas`/
`condutas_eventos` normalmente = 0 no gap (sem usuários). Por fim, retomar `agents-py`/`notifier-py`.

## Fase 5 — validar app
- Clínico: `curl -sf localhost:5050/health` + login médico; gateway logando `Username=cerebro_gateway;SSL Mode=VerifyFull`.
- Checkup: `api/health` + um quiz = 200; instance refresh **Successful**.
- **Prova de migração:** CloudWatch `DatabaseConnections` sobe no `cerebro-postgres-enc`, cai no OLD.

## Rollback (armado 48h)
OLD **ligado** durante a janela. Reverter: `cp .env.bak-precifra .env && docker compose up -d`
(clínico) + reverter o SSM `database-url` + instance refresh (checkup).

## Cleanup (após ~48h estável)
```bash
# re-apontar o alarme de backup (T1-6) p/ a instância nova — SENÃO alarma falso ao deletar o OLD
aws cloudformation deploy --region sa-east-1 --stack-name cerebro-rds-backup-alarm \
  --template-file infra/aws/rds-backup-alarm.yaml --capabilities CAPABILITY_IAM \
  --parameter-overrides DbInstanceId=cerebro-postgres-enc AlertEmail=<email> --no-fail-on-empty-changeset
aws lambda invoke --function-name cerebro-rds-backup-check --region sa-east-1 /dev/stdout

# descartar o antigo + snapshot em texto claro
aws rds delete-db-instance --region sa-east-1 --db-instance-identifier cerebro-postgres --skip-final-snapshot --delete-automated-backups
aws rds delete-db-snapshot --region sa-east-1 --db-snapshot-identifier cerebro-pre-cifra-20260614-1427
```
> Os snapshots *automated* antigos do OLD continuam não cifrados — expiram pela retenção (7d) ou delete manual.
