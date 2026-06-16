#!/usr/bin/env bash
# =============================================================================
# Smoke REST do MEMED (sandbox) — Parte A.
#
# Confirma que as chaves de homologação provisionam um prescritor e devolvem o
# `token` que o SDK do frontend usa. Reproduz o MemedClient.RegistrarOuObterAsync
# (POST /sinapse-prescricao/usuarios, JSON:API, auth em query-string).
#
# NÃO usa credencial de produção. Default = chaves sandbox públicas do MEMED.
# Para sobrescrever:  MEMED_API_KEY=... MEMED_SECRET_KEY=... ./memed-sandbox-rest-smoke.sh
#
# Saída: HTTP status + corpo + `data.id` (memed_usuario_id) + `token` (cole na Parte B).
# =============================================================================
set -euo pipefail

# Chaves sandbox de homologação (públicas, da área de parceiro MEMED — .env.example).
MEMED_API_KEY="${MEMED_API_KEY:-iJGiB4kjDGOLeDFPWMG3no9VnN7Abpqe3w1jEFm6olkhkZD6oSfSmYCm}"
MEMED_SECRET_KEY="${MEMED_SECRET_KEY:-Xe8M5GvBGCr4FStKfxXKisRo3SfYKI7KrTMkJpCAstzu2yXVN4av5nmL}"
MEMED_API_BASE="${MEMED_API_BASE:-https://integrations.api.memed.com.br/v1}"

# Prescritor de teste (sobrescreva por env se o sandbox recusar o board).
# Se POST falhar com erro de board/CPF, use o médico de teste da doc sandbox do MEMED.
EXTERNAL_ID="${EXTERNAL_ID:-smoke-medico-001}"
NOME="${NOME:-Medico}"
SOBRENOME="${SOBRENOME:-Teste}"
CPF="${CPF:-00000000000}"
CRM_NUMERO="${CRM_NUMERO:-123456}"
CRM_UF="${CRM_UF:-SP}"
EMAIL="${EMAIL:-medico.teste@example.com}"

BASE="${MEMED_API_BASE%/}"
QS="api-key=${MEMED_API_KEY}&secret-key=${MEMED_SECRET_KEY}"

read -r -d '' PAYLOAD <<JSON || true
{"data":{"type":"usuarios","attributes":{
  "external_id":"${EXTERNAL_ID}",
  "nome":"${NOME}","sobrenome":"${SOBRENOME}","cpf":"${CPF}",
  "board":{"board_code":"CRM","board_number":"${CRM_NUMERO}","board_state":"${CRM_UF}"},
  "email":"${EMAIL}"}}}
JSON

echo "==> POST ${BASE}/sinapse-prescricao/usuarios"
HTTP_BODY="$(mktemp)"
STATUS="$(curl -sS -o "${HTTP_BODY}" -w '%{http_code}' \
  -X POST "${BASE}/sinapse-prescricao/usuarios?${QS}" \
  -H 'Content-Type: application/vnd.api+json' \
  -H 'Accept: application/vnd.api+json' \
  --data "${PAYLOAD}")"

echo "==> HTTP ${STATUS}"
echo "--- corpo ---"
if command -v python3 >/dev/null 2>&1; then
  python3 -m json.tool < "${HTTP_BODY}" || cat "${HTTP_BODY}"
else
  cat "${HTTP_BODY}"
fi
echo

if command -v python3 >/dev/null 2>&1; then
  python3 - "$HTTP_BODY" <<'PY'
import json, sys
try:
    d = json.load(open(sys.argv[1]))
    data = d.get("data", {})
    attrs = data.get("attributes", {})
    uid = data.get("id")
    token = attrs.get("token")
    print("\n==> RESULTADO")
    print(f"    memed_usuario_id (data.id): {uid}")
    print(f"    token (data.attributes.token): {token}")
    if token:
        print("\n    OK — cole o token na Parte B (sandbox-event-smoke.html).")
    else:
        print("\n    SEM token — ver corpo acima (board/CPF de teste podem precisar do dado oficial da doc sandbox).")
except Exception as e:
    print(f"\n==> não consegui parsear JSON: {e}")
PY
fi

rm -f "${HTTP_BODY}"
