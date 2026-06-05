#!/usr/bin/env bash
# =============================================================================
# setup-social-foto.sh
# Provisiona a infra de FOTO da rede social (ADR-031):
#   - bucket S3 PRIVADO (cerebro-amigo-social)
#   - CORS liberando PUT/GET das origens web (upload presigned DIRETO do browser)
#   - IAM policy (s3:PutObject/GetObject) anexada à role da EC2
#   - migrations 0024-0027 da rede social (idempotentes)
#
# Difere do Diário de Voz (setup-diario-audio.sh): SEM Transcribe, SEM lifecycle
# (a foto persiste), COM CORS (o navegador sobe direto pro S3 via PUT presigned).
#
# Pré-requisitos:
#   - AWS CLI com permissão de S3 + IAM (criar bucket, policy, attach-role)
#   - EC2_ROLE_NAME = nome da IAM role da instância EC2
#   - POSTGRES_DSN_URL (formato URL p/ psql) — OPCIONAL aqui: se ausente ou se o
#     RDS não for acessível desta máquina (security group), o script PULA a
#     migration e imprime o comando p/ rodar na EC2 (ver docs/runbooks/rede-social-prod.md).
#
# Uso:
#   export EC2_ROLE_NAME="EC2-SSM-CerebroAmigo"     # role real da EC2 (i-057860cd97edafefb)
#   export AWS_PROFILE="your-profile"               # ou IAM role/SSO
#   export POSTGRES_DSN_URL="postgresql://user:pass@host:5432/cerebro_v3?sslmode=require"  # opcional
#   bash infra/aws/setup-social-foto.sh
# =============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

BUCKET="cerebro-amigo-social"
REGION="sa-east-1"
POLICY_NAME="CerebroAmigoSocialFotoS3"
POLICY_FILE="$SCRIPT_DIR/iam-policy-social-foto.json"
CORS_FILE="$SCRIPT_DIR/s3-cors-social.json"
MIGRATIONS=(0024_social 0025_chat 0026_moderacao 0027_social_presenca)

# ─── Validações ──────────────────────────────────────────────────────────────

if [[ -z "${EC2_ROLE_NAME:-}" ]]; then
  echo "ERRO: EC2_ROLE_NAME não definido. Exporte antes de rodar." >&2
  exit 1
fi

ACCOUNT_ID="$(aws sts get-caller-identity --query Account --output text)"
echo "Conta AWS: $ACCOUNT_ID | Região: $REGION | Bucket: $BUCKET"

# ─── 1. S3 bucket ────────────────────────────────────────────────────────────

echo ""
echo "==> [1/4] S3 bucket: $BUCKET"

if aws s3api head-bucket --bucket "$BUCKET" 2>/dev/null; then
  echo "    Bucket já existe — pulando criação."
else
  aws s3 mb "s3://$BUCKET" --region "$REGION"
  echo "    Bucket criado."
fi

# Block public access (bucket privado — exibição é só via GET presigned curto).
aws s3api put-public-access-block \
  --bucket "$BUCKET" \
  --public-access-block-configuration \
    "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true"
echo "    Public access bloqueado."

# ─── 2. CORS (presigned PUT do navegador) ────────────────────────────────────

echo ""
echo "==> [2/4] CORS do bucket (PUT/GET das origens web)"
aws s3api put-bucket-cors \
  --bucket "$BUCKET" \
  --cors-configuration "file://$CORS_FILE"
echo "    CORS aplicado."

# ─── 3. IAM policy + attach na EC2 role ──────────────────────────────────────

echo ""
echo "==> [3/4] IAM policy: $POLICY_NAME"

POLICY_ARN="arn:aws:iam::${ACCOUNT_ID}:policy/${POLICY_NAME}"

if aws iam get-policy --policy-arn "$POLICY_ARN" >/dev/null 2>&1; then
  echo "    Policy já existe — criando nova versão."
  aws iam create-policy-version \
    --policy-arn "$POLICY_ARN" \
    --policy-document "file://$POLICY_FILE" \
    --set-as-default
  # Mantém no máx 5 versões — remove as não-default antigas.
  aws iam list-policy-versions --policy-arn "$POLICY_ARN" \
    --query 'Versions[?!IsDefaultVersion].VersionId' --output text \
    | tr '\t' '\n' \
    | while read -r ver; do
        [[ -n "$ver" ]] && aws iam delete-policy-version --policy-arn "$POLICY_ARN" --version-id "$ver" \
          && echo "    Versão antiga $ver removida."
      done
else
  aws iam create-policy \
    --policy-name "$POLICY_NAME" \
    --policy-document "file://$POLICY_FILE" \
    --description "Rede social (ADR-031): EC2 assina presigned PUT/GET no bucket de fotos dos posts."
  echo "    Policy criada."
fi

if aws iam list-attached-role-policies --role-name "$EC2_ROLE_NAME" \
    --query "AttachedPolicies[?PolicyArn=='$POLICY_ARN']" --output text | grep -q "$POLICY_ARN"; then
  echo "    Policy já anexada — pulando."
else
  aws iam attach-role-policy \
    --role-name "$EC2_ROLE_NAME" \
    --policy-arn "$POLICY_ARN"
  echo "    Policy anexada à role $EC2_ROLE_NAME."
fi

# ─── 4. Migrations da rede social (idempotentes) ─────────────────────────────

echo ""
echo "==> [4/4] Migrations rede social (0024-0027)"

DSN="${POSTGRES_DSN_URL:-${POSTGRES_DSN:-}}"
if [[ -z "$DSN" ]]; then
  echo "    POSTGRES_DSN_URL não definido — PULANDO migration."
  echo "    Rode na EC2 (onde o RDS é acessível). Ver docs/runbooks/rede-social-prod.md."
  for m in "${MIGRATIONS[@]}"; do
    echo "      psql \"\$POSTGRES_DSN_URL\" -f infra/migrations/${m}.sql -v ON_ERROR_STOP=1"
  done
else
  for m in "${MIGRATIONS[@]}"; do
    echo "    Aplicando ${m}.sql ..."
    psql "$DSN" -f "$REPO_ROOT/infra/migrations/${m}.sql" -v ON_ERROR_STOP=1
  done
  echo "    Migrations aplicadas."
fi

# ─── Resumo ──────────────────────────────────────────────────────────────────

echo ""
echo "============================================================"
echo " Rede social — FOTO: infra pronta!"
echo "============================================================"
echo " Bucket : s3://$BUCKET (sa-east-1, privado, CORS PUT/GET)"
echo " Policy : $POLICY_ARN"
echo " Role   : $EC2_ROLE_NAME"
echo ""
echo " Próximo passo (na EC2):"
echo "   1. Garanta S3_BUCKET_SOCIAL=$BUCKET no .env"
echo "   2. docker compose restart api-gateway"
echo "   3. Smoke: POST /api/v1/rede/posts/foto-presign deve devolver 200 (não 503)."
echo "============================================================"
