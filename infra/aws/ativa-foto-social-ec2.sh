#!/usr/bin/env bash
# =============================================================================
# ativa-foto-social-ec2.sh
# Fase 3 do "pôr a rede social em produção" (ADR-031): garante
# S3_BUCKET_SOCIAL no .env da EC2 e RECRIA o api-gateway para carregar a env.
#
# Usa SSM (mesmo canal do deploy.yml) — não precisa de SSH. Faz polling do
# resultado e imprime stdout/stderr do comando remoto.
#
# IMPORTANTE: `docker compose restart` NÃO relê env_file; por isso usamos
# `up -d --force-recreate api-gateway`.
#
# Pré: AWS CLI autenticado (ssm:SendCommand + ssm:GetCommandInvocation).
# Uso:  bash infra/aws/ativa-foto-social-ec2.sh
# =============================================================================
set -euo pipefail

INSTANCE="i-057860cd97edafefb"
REGION="sa-east-1"

PARAMS="$(mktemp)"
trap 'rm -f "$PARAMS"' EXIT

# Heredoc com aspas no delimitador → nada é expandido localmente; $(seq), $i
# chegam literais e são interpretados na EC2.
cat > "$PARAMS" <<'JSON'
{
  "commands": [
    "set -e",
    "export HOME=/root",
    "cd /opt/cerebro-amigo-v3",
    "grep -q ^S3_BUCKET_SOCIAL= .env || echo S3_BUCKET_SOCIAL=cerebro-amigo-social >> .env",
    "echo .env: && grep ^S3_BUCKET_SOCIAL= .env",
    "docker compose up -d --force-recreate api-gateway",
    "for i in $(seq 1 30); do curl -sf http://localhost:5050/health | grep -q ok && curl -sf http://localhost:5050/ready | grep -q ready && break; [ $i -lt 30 ] && sleep 3 || { echo gateway-NAO-saudavel; exit 1; }; done; echo gateway-ok"
  ]
}
JSON

echo "==> SSM send-command → $INSTANCE ($REGION)"
CID="$(aws ssm send-command \
  --instance-ids "$INSTANCE" \
  --region "$REGION" \
  --document-name "AWS-RunShellScript" \
  --comment "rede social: S3_BUCKET_SOCIAL + force-recreate api-gateway" \
  --parameters "file://$PARAMS" \
  --query "Command.CommandId" --output text)"
echo "    CommandId: $CID"

echo "==> Aguardando conclusão (até ~2min)..."
STATUS="Pending"
for _ in $(seq 1 40); do
  STATUS="$(aws ssm get-command-invocation \
    --command-id "$CID" --instance-id "$INSTANCE" --region "$REGION" \
    --query "Status" --output text 2>/dev/null || echo Pending)"
  case "$STATUS" in
    Success|Failed|Cancelled|TimedOut) break ;;
    *) sleep 3 ;;
  esac
done

echo ""
echo "==> Status final: $STATUS"
echo "----- stdout -----"
aws ssm get-command-invocation --command-id "$CID" --instance-id "$INSTANCE" \
  --region "$REGION" --query "StandardOutputContent" --output text
ERR="$(aws ssm get-command-invocation --command-id "$CID" --instance-id "$INSTANCE" \
  --region "$REGION" --query "StandardErrorContent" --output text)"
if [[ -n "$ERR" && "$ERR" != "None" ]]; then
  echo "----- stderr -----"; echo "$ERR"
fi

[[ "$STATUS" == "Success" ]] || { echo "FALHOU — ver stderr acima."; exit 1; }
echo ""
echo "OK — api-gateway recriado com S3_BUCKET_SOCIAL. Foto da rede social ligada."
