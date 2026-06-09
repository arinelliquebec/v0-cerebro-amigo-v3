# Runbook — drill de restore do backup RDS

Objetivo: provar que o backup do RDS presta (restore não testado = backup que
pode não existir). Restaura o PITR num instance temporário, valida, **derruba**.

RDS: `cerebro-postgres` (db.t4g.medium, single-AZ, sa-east-1). Custo do drill:
~centavos (instance de minutos) + ~15-20min. Faça fora de pico.

> Precisa de credencial AWS com `rds:*` na conta 004177894935. O sandbox local
> bloqueia o endpoint `rds.sa-east-1` (timeout) — rode do console, da sua máquina
> com perfil admin, ou via SSM no EC2 SE a role tiver permissão de RDS.

## 1. Conferir que há backup recente (read-only)

```bash
aws rds describe-db-instances --region sa-east-1 --no-cli-pager \
  --db-instance-identifier cerebro-postgres \
  --query 'DBInstances[0].{Backup:BackupRetentionPeriod,MultiAZ:MultiAZ,Latest:LatestRestorableTime}'
```
`BackupRetentionPeriod>0` e `LatestRestorableTime` recente (≤5min atrás) = PITR ok.

## 2. Restaurar p/ um instance temporário (PITR, classe pequena)

```bash
aws rds restore-db-instance-to-point-in-time --region sa-east-1 --no-cli-pager \
  --source-db-instance-identifier cerebro-postgres \
  --target-db-instance-identifier cerebro-postgres-restore-test \
  --use-latest-restorable-time \
  --db-instance-class db.t4g.micro \
  --no-multi-az --no-publicly-accessible
aws rds wait db-instance-available --region sa-east-1 \
  --db-instance-identifier cerebro-postgres-restore-test
```

## 3. Validar (conectar + contar)

Pegue o endpoint:
```bash
aws rds describe-db-instances --region sa-east-1 --no-cli-pager \
  --db-instance-identifier cerebro-postgres-restore-test \
  --query 'DBInstances[0].Endpoint.Address' --output text
```
Conecte (mesma senha do master no momento do backup) e cheque:
```sql
SELECT count(*) FROM pacientes;
SELECT count(*) FROM prescricoes;
SELECT max(criado_em) FROM protocolos_crise_acionados;  -- dado recente veio?
```
Bater com o esperado = restore íntegro.

## 4. DERRUBAR (não deixar instância paga órfã)

```bash
aws rds delete-db-instance --region sa-east-1 --no-cli-pager \
  --db-instance-identifier cerebro-postgres-restore-test \
  --skip-final-snapshot --delete-automated-backups
```

> ⚠️ Confirmar que apagou o `-restore-test` (NÃO o `cerebro-postgres` de prod).
> Instância órfã = custo silencioso recorrente.

## Cadência sugerida

Trimestral, ou após qualquer mudança grande de schema/infra. Registrar a data do
último drill bem-sucedido.
