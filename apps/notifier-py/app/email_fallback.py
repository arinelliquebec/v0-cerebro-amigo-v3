"""Fallback de email quando push falha em TODOS os devices.

Envia email via Resend API (REST) quando o dispatcher detecta que nenhum
subscription ativa recebeu o push de check-in. O email contém o mesmo
texto do push, garantindo que o paciente não perde o lembrete.

Requer RESEND_API_KEY e EMAIL_FROM configurados. Se não configurado,
o fallback é desabilitado (loga o evento mas não envia email).
"""

from __future__ import annotations

import structlog

from app.core.config import get_settings

logger = structlog.get_logger(__name__)


async def enviar_email_fallback(
    destinatario: str,
    *,
    titulo: str,
    corpo: str,
    paciente_id: str,
    checkin_id: str,
) -> bool:
    """Envia email de fallback via Resend.

    Args:
        destinatario: Email do paciente (de clientes.email).
        titulo: Assunto do email.
        corpo: Corpo do email (texto plano).
        paciente_id: UUID do paciente (para tracing).
        checkin_id: UUID do checkin (para tracing).

    Returns:
        True se o email foi aceito pela API Resend.
    """
    settings = get_settings()

    if not settings.email_fallback_enabled or not settings.resend_api_key:
        logger.info(
            "email_fallback.disabled",
            paciente_id=paciente_id,
            checkin_id=checkin_id,
        )
        return False

    try:
        import httpx
    except ImportError:
        logger.error("email_fallback.no_httpx")
        return False

    api_key = settings.resend_api_key.get_secret_value()
    payload = {
        "from": settings.email_from,
        "to": [destinatario],
        "subject": titulo,
        "text": corpo,
    }

    try:
        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.post(
                "https://api.resend.com/emails",
                headers={"Authorization": f"Bearer {api_key}"},
                json=payload,
            )

        if resp.status_code == 200:
            data = resp.json()
            logger.info(
                "email_fallback.sent",
                paciente_id=paciente_id,
                checkin_id=checkin_id,
                email_id=data.get("id"),
            )
            return True

        logger.warning(
            "email_fallback.failed",
            paciente_id=paciente_id,
            checkin_id=checkin_id,
            status=resp.status_code,
            body=resp.text,
        )
        return False

    except Exception as exc:  # noqa: BLE001
        logger.exception(
            "email_fallback.error",
            paciente_id=paciente_id,
            checkin_id=checkin_id,
            error=str(exc),
        )
        return False
