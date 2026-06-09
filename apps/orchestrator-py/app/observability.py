"""Observabilidade: LangSmith + redação de PII.

LGPD trata saúde mental como categoria especial (art. 11). Antes que qualquer
trace seja enviado ao LangSmith hospedado por terceiros, removemos PII óbvias
brasileiras (CPF, telefone, email). Para produção real recomenda-se ainda:

    1) self-hosted LangSmith, OU
    2) LANGSMITH_HIDE_INPUTS/OUTPUTS=true (traces ficam só com metadata)

Esta camada é *defesa em profundidade*, não substituto do controle acima.
"""

from __future__ import annotations

import os
import re
from collections.abc import Callable
from typing import Any

import structlog
from langsmith import Client

from app.config import get_settings

logger = structlog.get_logger(__name__)

# ─── Regex de PII brasileiras ──────────────────────────────────────────────
# Conservadoras: preferimos falsos positivos a vazar PII.
# T0-2: CPF sem separador (11 dígitos) redatado como [CPF_REDACTED] mesmo
# podendo ser telefone. Falso positivo intencional — CPF roda antes de PHONE,
# garantindo que 11-digit sem formatação seja sempre redatado.
_CPF_RE = re.compile(r"\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b")
_CNPJ_RE = re.compile(r"\b\d{2}\.?\d{3}\.?\d{3}/?\d{4}-?\d{2}\b")
_EMAIL_RE = re.compile(r"\b[\w.+-]+@[\w-]+\.[\w.-]+\b")
_PHONE_RE = re.compile(
    r"(?:\+?55\s?)?(?:\(?\d{2}\)?\s?)?9?\d{4}[-\s]?\d{4}",
)
# Datas de nascimento: dd/mm/aaaa
_DATE_RE = re.compile(r"\b\d{2}/\d{2}/\d{4}\b")


def redact_pii(text: str) -> str:
    """Substitui PII brasileiras por placeholders.

    Não usa NER (custo / latência). Para campos livres usar uma camada extra de
    NER offline antes de persistir em log se quiser maior recall.
    """
    if not text:
        return text
    text = _CPF_RE.sub("[CPF_REDACTED]", text)
    text = _CNPJ_RE.sub("[CNPJ_REDACTED]", text)
    text = _EMAIL_RE.sub("[EMAIL_REDACTED]", text)
    text = _PHONE_RE.sub("[PHONE_REDACTED]", text)
    text = _DATE_RE.sub("[DATE_REDACTED]", text)
    return text


def _redact_recursive(obj: Any) -> Any:
    """Aplica redact_pii em qualquer string dentro de um dict/list aninhado."""
    if isinstance(obj, str):
        return redact_pii(obj)
    if isinstance(obj, dict):
        return {k: _redact_recursive(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [_redact_recursive(item) for item in obj]
    return obj


def redact_pii_processor(_logger: Any, _method_name: str, event_dict: dict[str, Any]) -> dict[str, Any]:
    """structlog processor que aplica redact_pii em toda string do evento.

    Deve ser inserido no pipeline ANTES do renderer (JSONRenderer ou outro).
    Protege os logs de aplicação contra vazamento de PII mesmo que um dev
    futuro logue conteúdo clínico cru sem redigir manualmente.
    """
    return _redact_recursive(event_dict)


def make_redacting_hooks() -> tuple[Callable[..., Any], Callable[..., Any]]:
    """Hooks compatíveis com LangSmith Client(hide_inputs=..., hide_outputs=...)."""

    def hide_inputs(inputs: dict[str, Any]) -> dict[str, Any]:
        return _redact_recursive(inputs)  # type: ignore[no-any-return]

    def hide_outputs(outputs: dict[str, Any]) -> dict[str, Any]:
        return _redact_recursive(outputs)  # type: ignore[no-any-return]

    return hide_inputs, hide_outputs


def configure_sentry() -> None:
    """Inicializa o Sentry para captura de ERROS do backend — LGPD-safe.

    Regra #4 da clinical-safety (PII redatada em traces): `send_default_pii=False`
    + `max_request_body_size='never'` (nunca corpo/headers) + `before_send` que
    redige PII de TODO o evento (reusa `_redact_recursive`). Sem `SENTRY_DSN` no
    ambiente → no-op (Sentry desligado). Só erros: `traces_sample_rate=0`.
    """
    dsn = os.environ.get("SENTRY_DSN")
    if not dsn:
        logger.info("sentry.disabled")
        return
    try:
        import sentry_sdk
    except ImportError:
        logger.warning("sentry.sdk_ausente")
        return

    def _before_send(event: dict[str, Any], _hint: dict[str, Any]) -> dict[str, Any]:
        return _redact_recursive(event)  # type: ignore[return-value]

    sentry_sdk.init(
        dsn=dsn,
        environment=os.environ.get("APP_ENV", "production"),
        send_default_pii=False,
        max_request_body_size="never",
        traces_sample_rate=0.0,
        before_send=_before_send,
    )
    logger.info("sentry.configured")


def configure_observability() -> Client | None:
    """Configura LangSmith globalmente.

    LangChain/LangGraph leem `LANGSMITH_*` do ambiente para auto-tracing.
    Aqui retornamos também um Client explícito caso queiramos logar runs
    manuais (ex.: do nó protocolo_crise, que não chama LLM mas queremos rastrear).
    """
    settings = get_settings()

    if not settings.langsmith_tracing or not settings.langsmith_api_key:
        logger.info("langsmith.disabled")
        os.environ["LANGSMITH_TRACING"] = "false"
        return None

    # Propaga para auto-instrumentação do langchain/langgraph
    os.environ["LANGSMITH_TRACING"] = "true"
    os.environ["LANGSMITH_API_KEY"] = settings.langsmith_api_key.get_secret_value()
    os.environ["LANGSMITH_PROJECT"] = settings.langsmith_project

    if settings.langsmith_hide_inputs:
        os.environ["LANGSMITH_HIDE_INPUTS"] = "true"
    if settings.langsmith_hide_outputs:
        os.environ["LANGSMITH_HIDE_OUTPUTS"] = "true"

    client_kwargs: dict[str, Any] = {
        "api_key": settings.langsmith_api_key.get_secret_value(),
    }
    if settings.pii_redaction_enabled:
        hide_in, hide_out = make_redacting_hooks()
        client_kwargs["hide_inputs"] = hide_in
        client_kwargs["hide_outputs"] = hide_out

    client = Client(**client_kwargs)
    logger.info(
        "langsmith.configured",
        project=settings.langsmith_project,
        pii_redaction=settings.pii_redaction_enabled,
        hide_inputs=settings.langsmith_hide_inputs,
        hide_outputs=settings.langsmith_hide_outputs,
    )
    return client
