# Runbook: Backup e Restore do RDS

## Contexto

Dados de saúde mental (LGPD categoria especial). Perda de dado é inaceitável.
Este runbook cobre backups automatizados do RDS PostgreSQL e o procedimento
manual de restore em caso de desastre.

## Backups automatizados (RDS)

A instância RDS `cerebro-amigo-v3` na `sa-east-1` deve ter:

| Configuração | Valor recomendado | Rationale |
|---|---|---|
| Backup retention period | 30 days | LGPD: manter pelo período de tratamento |
| Backup window | 03:00–04:00 UTC | Fora do horário de pico (manhã BR) |
| Automated backups | Enabled | Padrão AWS, snapshot diário + WAL contínuo |
| Cross-region snapshot copy | `us-east-1` | DR: desastre regional sa-east-1 |
| Snapshot encryption | AWS managed key (SSE-S3) | Dados cifrados em repouso |

### Verificação de health dos backups

```bash
# Lista snapshots recentes
aws rds describe-db-snapshots \
  --db-instance-identifier cerebro-amigo-v3 \
  --region sa-east-1 \
  --query 'DBSnapshots[?SnapshotCreateTime>='"'"'$(date -u -d "7 days ago" +%Y-%m-%d)'"'"'].[DBSnapshotIdentifier,SnapshotCreateTime,Status]' \
  --output table
```

Alarme CloudWatch: disparar se nenhum snapshot `available` nos últimos 7 dias.

## Restore Point-in-Time (PITR)

O RDS mantém WAL (Write-Ahead Log), permitindo restore para qualquer ponto
no período de retenção (até o último minuto).

### Procedimento de restore (desastre)

1. **Parar todos os serviços** para evitar escrita durante o restore:
   ```bash
   ssh ec2-user@cerebro-amigo-v3
   docker compose down
   ```

2. **Criar nova instância a partir do snapshot mais recente**:
   ```bash
   aws rds restore-db-instance-to-point-in-time \
     --source-db-instance-identifier cerebro-amigo-v3 \
     --target-db-instance-identifier cerebro-amigo-v3-restored \
     --restore-time "2026-06-02T10:00:00Z" \
     --region sa-east-1
   ```

3. **Atualizar o security group** para permitir conexão da EC2.

4. **Atualizar `POSTGRES_DSN` e `POSTGRES_DSN_URL`** na EC2 (nova endpoint).

5. **Subir serviços**:
   ```bash
   docker compose up -d
   ```

6. **Validação pós-restore**:
   ```bash
   curl -sf http://localhost:5050/ready | grep ready
   curl -sf http://localhost:8081/ready | grep ready
   # Verificar se últimos registros de checkins/mensagens estão presentes
   ```

## Rollback de migrations

As migrations são **forward-only** (DDL versionado em `infra/migrations/`).
Não há rollback automático.

### Se uma migration quebrar em produção:

1. **Não faça `down`**. O estado do banco é append-only (regra clínica).

2. **Crie uma migration corretiva** (ex.: `0008_fix_0007.sql`) que corrige
   o schema sem destruir dados:
   ```sql
   -- Exemplo: adicionar coluna faltante em vez de recriar tabela
   ALTER TABLE tabela ADD COLUMN nova_coluna tipo DEFAULT valor;
   ```

3. **Teste a migration corretiva** em staging antes de aplicar em produção.

4. **Se a migration causar downtime**: restaure do snapshot mais recente
   (antes da migration) e aplique a migration corretiva.

## Rotação de segredos

### `INTERNAL_API_TOKEN`

1. Gerar novo token: `openssl rand -hex 32`
2. Atualizar no AWS SSM Parameter Store / Secrets Manager
3. Atualizar `.env` na EC2
4. Reiniciar serviços: `docker compose restart`
5. O token antigo pode ser removido após confirmação de que todos os
   serviços estão usando o novo (health checks passando).

### `JWT_SECRET`

1. Gerar nova secret
2. Atualizar no SSM / `.env`
3. **Efeito**: todos os tokens JWT existentes são invalidados (usuários
   precisam fazer login novamente). Planejar janela de manutenção.

### `ENCRYPTION_KEY` (ADR-018)

**NUNCA perca esta chave**. Sem ela, dados cifrados no banco são
irrecuperáveis. Backup separado:
- AWS Secrets Manager com replicação cross-region
- Cópia offline em cofre físico (opção de negócio)
