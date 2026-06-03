"""Notificação externa do médico em crise (e-mail).

Lê `notificacoes_medico` tipo='crise' ainda não entregues por e-mail, respeita o
opt-in do médico (`medicos.notif_prefs.crise_email`) e envia um aviso MÍNIMO via
Resend — sem detalhe clínico (LGPD). Rastreia entrega em `notificacao_entregas`
(tabela separada; `notificacoes_medico` é imutável).
"""

from __future__ import annotations

import os

import structlog

from app.core.config import get_settings
from app.core.db import acquire

logger = structlog.get_logger(__name__)


async def _enviar_email(destinatario: str, *, assunto: str, corpo: str) -> bool:
    settings = get_settings()
    if not settings.resend_api_key:
        logger.info("medico_email.disabled_no_key")
        return False
    try:
        import httpx
    except ImportError:
        logger.error("medico_email.no_httpx")
        return False

    api_key = settings.resend_api_key.get_secret_value()
    try:
        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.post(
                "https://api.resend.com/emails",
                headers={"Authorization": f"Bearer {api_key}"},
                json={
                    "from": settings.email_from,
                    "to": [destinatario],
                    "subject": assunto,
                    "text": corpo,
                },
            )
        if resp.status_code == 200:
            return True
        logger.warning("medico_email.failed", status=resp.status_code, body=resp.text)
        return False
    except Exception as exc:  # noqa: BLE001
        logger.exception("medico_email.error", error=str(exc))
        return False


async def despachar_crise_medico() -> dict:
    """Envia e-mail de crise aos médicos opt-in. Conteúdo mínimo, sem detalhe
    clínico; rastreia em notificacao_entregas para não duplicar."""
    enviados = 0
    falhas = 0
    dashboard = os.getenv("DASHBOARD_URL", "http://localhost:3000/dashboard")

    async with acquire() as conn:
        pendentes = await conn.fetch(
            """
            SELECT n.id, u.email AS medico_email, cl.nome AS paciente_nome
            FROM notificacoes_medico n
            JOIN medicos m ON m.id = n.medico_id
            JOIN usuarios u ON u.id = m.usuario_id
            LEFT JOIN clientes cl ON cl.id = n.paciente_id
            WHERE n.tipo = 'crise'
              AND n.criada_em > NOW() - INTERVAL '7 days'
              AND COALESCE((m.notif_prefs->>'crise_email')::bool, FALSE) = TRUE
              AND NOT EXISTS (
                  SELECT 1 FROM notificacao_entregas e
                  WHERE e.notificacao_id = n.id AND e.canal = 'email'
                    AND e.status = 'enviado'
              )
            ORDER BY n.criada_em
            LIMIT 100
            """
        )

    for row in pendentes:
        if not row["medico_email"]:
            continue
        nome = row["paciente_nome"] or "Um paciente"
        # Mínimo e sem detalhe clínico: não citamos "crise" no corpo do e-mail.
        corpo = (
            f"{nome} precisa de atenção prioritária no Cérebro Amigo.\n\n"
            f"Abra o painel para avaliar: {dashboard}\n\n"
            "— Cérebro Amigo (mensagem automática; não responda este e-mail)."
        )
        ok = await _enviar_email(
            row["medico_email"],
            assunto="Cérebro Amigo · atenção prioritária a um paciente",
            corpo=corpo,
        )
        if ok:
            enviados += 1
            async with acquire() as conn:
                await conn.execute(
                    "INSERT INTO notificacao_entregas (notificacao_id, canal, status) "
                    "VALUES ($1, 'email', 'enviado')",
                    row["id"],
                )
        else:
            falhas += 1

    logger.info("medico_email.crise.done", enviados=enviados, falhas=falhas)
    return {"enviados": enviados, "falhas": falhas}
