#!/usr/bin/env bash
# =============================================================================
# Video watchdog — TC-2: alerta quando teleconsulta FALHA (TURN/ICE).
# =============================================================================
# Eventos 'falhou' caem em consulta_video_eventos e eram invisíveis — falha de
# relay/ICE em produção só aparecia quando o médico reclamava. Este watchdog
# roda por cron no EC2 (a cada 15min), conta falhou × conectou na última hora
# e alerta por e-mail (Resend) SÓ quando há falha nova (estado anti-spam).
#
# A consulta roda dentro do container do orchestrator (asyncpg + DSN dos
# workers no env) — mesma técnica do rds-restore-drill-validate.sh. A tabela é
# append-only e sem PII (só metadados de sessão).
#
# Instalar (via SSM, uma vez):
#   crontab -l 2>/dev/null | grep -q video-watchdog || \
#   (crontab -l 2>/dev/null; echo "*/15 * * * * bash /opt/cerebro-amigo-v3/infra/aws/video-watchdog.sh") | crontab -
# =============================================================================
set -uo pipefail

ENV_FILE=/opt/cerebro-amigo-v3/.env
STATE=/var/tmp/cerebro-video-watchdog-last

val() { grep -E "^$1=" "$ENV_FILE" 2>/dev/null | head -1 | cut -d= -f2- | tr -d '"'; }
RESEND_KEY=$(val RESEND_API_KEY)
FROM=$(val EMAIL_FROM)
TO=$(val ALERT_EMAIL); [ -z "$TO" ] && TO="arinelliquebec@gmail.com"

# falhas | conexões | epoch da última falha — janela de 60 min.
read -r FALHAS CONECTOU ULTIMA <<<"$(cd /opt/cerebro-amigo-v3 && docker compose exec -T orchestrator-py python - <<'PY' 2>/dev/null
import asyncio
import os

import asyncpg


async def main() -> None:
    conn = await asyncpg.connect(os.environ["POSTGRES_DSN_URL"], timeout=20)
    try:
        row = await conn.fetchrow(
            """
            SELECT
              count(*) FILTER (WHERE evento = 'falhou')   AS falhas,
              count(*) FILTER (WHERE evento = 'conectou') AS conectou,
              COALESCE(extract(epoch FROM max(criado_em)
                       FILTER (WHERE evento = 'falhou'))::bigint, 0) AS ultima
            FROM consulta_video_eventos
            WHERE criado_em > now() - interval '60 minutes'
            """
        )
        print(row["falhas"], row["conectou"], row["ultima"])
    finally:
        await conn.close()


asyncio.run(main())
PY
)"

# Query indisponível (container/DB fora) → o health-watchdog cobre esse caso.
[ -z "${FALHAS:-}" ] && exit 0
[ "$FALHAS" -eq 0 ] && exit 0

# Já alertado para esta falha? (estado = epoch da última falha alertada)
prev=$(cat "$STATE" 2>/dev/null || echo 0)
[ "$ULTIMA" -le "$prev" ] && exit 0
echo "$ULTIMA" > "$STATE"

subj="🔴 Cérebro Amigo: teleconsulta com falha de conexão — $FALHAS falha(s) na última hora"
body="consulta_video_eventos na última hora: falhou=$FALHAS, conectou=$CONECTOU (host i-057860cd97edafefb, $(date -u +'%Y-%m-%d %H:%M UTC')). Investigar: candidato relay em chrome://webrtc-internals, coturn no compose (COMPOSE_PROFILES=turn), credencial TURN (TURN_SECRET/TTL). Detalhe por consulta: SELECT * FROM consulta_video_eventos WHERE criado_em > now() - interval '1 hour' ORDER BY criado_em."

[ -z "$RESEND_KEY" ] && { echo "sem RESEND_API_KEY — não enviou"; exit 0; }
curl -s -X POST https://api.resend.com/emails \
  -H "Authorization: Bearer $RESEND_KEY" -H "Content-Type: application/json" \
  -d "{\"from\":\"$FROM\",\"to\":[\"$TO\"],\"subject\":\"$subj\",\"text\":\"$body\"}" >/dev/null \
  && echo "alerta enviado: $subj"
