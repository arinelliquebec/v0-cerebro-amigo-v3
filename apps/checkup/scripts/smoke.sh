#!/usr/bin/env bash
# Smoke E2E do checkup contra um servidor já no ar (BASE_URL, default localhost:3001).
# CI-safe: sem DB nem ANTHROPIC_API_KEY — devolutiva cai no fallback estático,
# /api/events retorna ok sem gravar, e o PDF (puro server-side) é o check que pegou
# o 500 do @react-pdf/renderer. Usado como gate pré-deploy (.github/workflows/deploy.yml).
set -uo pipefail
BASE="${1:-http://localhost:3001}"
UUID="00000000-0000-4000-8000-000000000000"
fail=0
ok()  { echo "  ✓ $1"; }
bad() { echo "  ✗ $1"; fail=1; }
code(){ curl -s -o /dev/null -w "%{http_code}" --max-time 25 "$1"; }
has() { curl -s --max-time 25 "$1" | grep -q "$2"; }

echo "Smoke checkup @ $BASE"

[ "$(code "$BASE/api/health")" = 200 ] && ok "health" || bad "health"
[ "$(code "$BASE/")" = 200 ] && ok "home" || bad "home"

for p in depressao ansiedade tdah-adulto; do
  [ "$(code "$BASE/$p")" = 200 ] && ok "landing /$p" || bad "landing /$p"
done

# /crise renderiza CVV no HTML cru (SSR — não pode depender de JS)
{ [ "$(code "$BASE/crise")" = 200 ] && has "$BASE/crise" "tel:188"; } \
  && ok "/crise SSR (CVV no HTML)" || bad "/crise SSR"

for s in phq9 gad7 asrs18; do
  { [ "$(code "$BASE/teste/$s")" = 200 ] && has "$BASE/teste/$s" "Começar triagem"; } \
    && ok "/teste/$s quiz" || bad "/teste/$s quiz"
done

# eventos (sem DB → {ok:true}, não bloqueia)
ev=$(curl -s --max-time 25 -X POST "$BASE/api/events" -H "Content-Type: application/json" \
  -d "{\"event\":\"test_started\",\"sessionId\":\"$UUID\",\"scaleId\":\"phq9\"}")
echo "$ev" | grep -q '"ok":true' && ok "events ok" || bad "events ($ev)"

# devolutiva (sem Anthropic → fallback estático)
dev=$(curl -s -w "\n%{http_code}" --max-time 35 -X POST "$BASE/api/devolutiva" \
  -H "Content-Type: application/json" \
  -d '{"scaleId":"phq9","totalScore":12,"band":"moderate","bandLabel":"sintomas moderados"}')
{ [ "$(echo "$dev" | tail -1)" = 200 ] && echo "$dev" | grep -q acolhimento; } \
  && ok "devolutiva (fallback)" || bad "devolutiva"

# PDF — o check que pegou o 500 do react-pdf bundlado pelo Turbopack
for s in phq9 gad7 asrs18; do
  tmp=$(mktemp)
  c=$(curl -s -o "$tmp" -w "%{http_code}" --max-time 35 \
    "$BASE/api/pdf?scale=$s&score=12&band=informative&label=x&crisis=false&rid=ab")
  { [ "$c" = 200 ] && [ "$(head -c4 "$tmp")" = "%PDF" ]; } \
    && ok "PDF /$s (%PDF)" || bad "PDF /$s (http=$c)"
  rm -f "$tmp"
done

if [ "$fail" = 0 ]; then echo "SMOKE OK"; else echo "SMOKE FAILED"; fi
exit "$fail"
