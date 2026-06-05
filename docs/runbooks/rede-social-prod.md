# Runbook — Pôr a Rede Social em produção (foto + presença)

**Objetivo:** ligar em produção as features que dependem de infra (foto no feed via S3,
presença online via migration). O código já está 100% em `main` (ADR-030/031); falta só o
provisionamento de infra.

**O que falta provisionar:**
1. Bucket S3 privado `cerebro-amigo-social` (sa-east-1) + CORS (presigned PUT do browser).
2. IAM policy `s3:PutObject/GetObject` anexada à role da EC2.
3. Migrations `0024`–`0027` aplicadas no RDS (idempotentes; presença = `0027`).
4. Env `S3_BUCKET_SOCIAL=cerebro-amigo-social` no `.env` da EC2 + restart do gateway.

> Sem o bucket/env, `POST /api/v1/rede/posts/foto-presign` responde **503** (`bucket_nao_configurado`)
> e `GET /api/v1/rede/midia/{key}` responde **404**. O resto da rede (texto, chat, comunidades) já funciona.

**Referências:** ADR-031, `infra/aws/setup-social-foto.sh`, `apps/api-gateway/Endpoints/RedeFotoEndpoints.cs`.
Instância EC2: `i-057860cd97edafefb` (deploy é via SSM — ver `.github/workflows/deploy.yml`).

---

## Pré-condições

- AWS CLI autenticado com permissão de **S3** (criar bucket, CORS) e **IAM** (criar policy, attach-role).
- `EC2_ROLE_NAME` = `EC2-SSM-CerebroAmigo` (confirmar nome real).
- Acesso à instância via **SSM** (`aws ssm send-command`) — usado para migration, env e restart.

---

## Passo 1 — Provisionar AWS (bucket + CORS + IAM)

Da máquina com AWS CLI (não precisa de acesso ao RDS aqui):

```bash
export EC2_ROLE_NAME="EC2-SSM-CerebroAmigo"
# AWS_PROFILE/SSO conforme seu setup
bash infra/aws/setup-social-foto.sh
```

O script é **idempotente** (`head-bucket`, `get-policy`, checagem de attach). Ele cria o bucket,
bloqueia acesso público, aplica o CORS de `s3-cors-social.json`, cria/atualiza a policy
`CerebroAmigoSocialFotoS3` e a anexa à role. Sem `POSTGRES_DSN_URL`, ele **pula a migration**
(rode no Passo 2).

Verificação:

```bash
aws s3api head-bucket --bucket cerebro-amigo-social && echo "bucket ok"
aws s3api get-bucket-cors --bucket cerebro-amigo-social
aws iam list-attached-role-policies --role-name EC2-SSM-CerebroAmigo \
  --query "AttachedPolicies[?PolicyName=='CerebroAmigoSocialFotoS3']"
```

---

## Passo 2 — Migrations no RDS (via SSM, rodando na EC2)

O RDS só é acessível de dentro da VPC (EC2). As migrations são idempotentes
(`CREATE TABLE IF NOT EXISTS`; o seed de comunidades usa `ON CONFLICT (slug) DO NOTHING`),
então reaplicar `0024`–`0026` é seguro.

```bash
aws ssm send-command \
  --instance-ids i-057860cd97edafefb \
  --region sa-east-1 \
  --document-name "AWS-RunShellScript" \
  --comment "migrations rede social 0024-0027" \
  --parameters 'commands=[
    "set -e",
    "cd /opt/cerebro-amigo-v3",
    "DSN=$(grep -E ^POSTGRES_DSN_URL= .env | cut -d= -f2-)",
    "docker run --rm --network host -v \"$PWD/infra/migrations:/m\" -e DSN=\"$DSN\" postgres:16-alpine sh -c '"'"'for f in 0024_social 0025_chat 0026_moderacao 0027_social_presenca; do echo \">> $f\"; psql \"$DSN\" -f /m/$f.sql -v ON_ERROR_STOP=1 || exit 1; done'"'"'"
  ]' \
  --query "Command.CommandId" --output text
```

> Usa um container `postgres:16-alpine` efêmero pelo `psql` (o host pode não ter o cliente).
> Ajuste o caminho do repo (`/opt/cerebro-amigo-v3`) se for diferente.

Conferir o resultado:

```bash
aws ssm get-command-invocation --command-id <CMD_ID> --instance-id i-057860cd97edafefb \
  --region sa-east-1 --query "StandardOutputContent" --output text
```

Validar tabelas (espera 14 tabelas `social_*`, incluindo `social_presenca`):

```bash
# dentro do mesmo padrão SSM:
docker run --rm --network host -e DSN="$DSN" postgres:16-alpine \
  psql "$DSN" -c "\dt social_*"
```

---

## Passo 3 — Env + recreate do gateway (via SSM)

`S3_BUCKET_SOCIAL` já está no `.env.example`; falta garantir no `.env` **real** da EC2
e **recriar** o container — um `restart` simples NÃO relê o `env_file`, tem que ser
`up -d --force-recreate`. Encapsulado em script com polling do resultado:

```bash
bash infra/aws/ativa-foto-social-ec2.sh
```

Faz, na instância `i-057860cd97edafefb` via SSM: `grep -q || echo >> .env` (idempotente)
+ `docker compose up -d --force-recreate api-gateway` + espera o healthcheck (`:5050`).

---

## Passo 4 — Smoke test end-to-end

Com um médico **verificado** logado (cookie `auth_token`), pela web em produção:

1. **Foto:** abrir `/rede`, criar post com imagem → deve pedir presign (200, não 503),
   subir direto pro S3 (PUT 200), e o post entra na **fila de aprovação**.
2. **Moderação:** em `/rede/moderacao` (admin) → aprovar → post aparece no feed com a foto
   servida por `/api/rede/midia/...` (302 → S3).
3. **Presença:** com a aba aberta, o heartbeat marca online; o widget "Online agora"
   lista o médico.

Checagem rápida via API (precisa de token de médico verificado):

```bash
curl -sS -X POST https://<api>/api/v1/rede/posts/foto-presign \
  -H "Authorization: Bearer <JWT>" -H "Content-Type: application/json" \
  -d '{"contentType":"image/jpeg"}'
# Espera: 200 {"uploadUrl":"https://cerebro-amigo-social.s3...","key":"posts/.../...jpg",...}
```

---

## Rollback

A mudança é aditiva e de baixo risco:
- **Env:** remover `S3_BUCKET_SOCIAL` do `.env` e `docker compose restart api-gateway` → foto
  volta a 503, resto da rede intacto.
- **IAM:** `aws iam detach-role-policy --role-name EC2-SSM-CerebroAmigo --policy-arn <ARN>`.
- **Bucket:** pode esvaziar/remover (`aws s3 rb s3://cerebro-amigo-social --force`) — só apaga fotos.
- **Migrations:** não há down-migration; as tabelas `social_*` são inertes se não usadas.

---

## Checklist

- [ ] Passo 1 — bucket + CORS + IAM (script ou manual)
- [ ] Passo 2 — migrations 0024-0027 no RDS (14 tabelas `social_*`)
- [ ] Passo 3 — `S3_BUCKET_SOCIAL` no `.env` da EC2 + restart
- [ ] Passo 4 — smoke: foto-presign 200, upload, aprovação, exibição, presença
- [ ] Atualizar status do ADR-031 para *Accepted/Deployed*
