"""LangSmith + redação de PII brasileiras."""

from __future__ import annotations

import os
import re
from collections.abc import Callable
from typing import Any

import structlog
from langsmith import Client

from app.core.config import get_settings

logger = structlog.get_logger(__name__)

# T0-2: CPF sem separador redatado como [CPF_REDACTED] (pode ser telefone).
# Falso positivo intencional — CPF roda antes de PHONE; 11-digit sempre redatado.
_CPF_RE = re.compile(r"\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b")
_CNPJ_RE = re.compile(r"\b\d{2}\.?\d{3}\.?\d{3}/?\d{4}-?\d{2}\b")
_EMAIL_RE = re.compile(r"\b[\w.+-]+@[\w-]+\.[\w.-]+\b")
_PHONE_RE = re.compile(
    r"(?:\+?55\s?)?(?:\(?\d{2}\)?\s?)?9?\d{4}[-\s]?\d{4}",
)
_DATE_RE = re.compile(r"\b\d{2}/\d{2}/\d{4}\b")


def redact_pii(text: str) -> str:
    """Substitui PII brasileiras por placeholders."""
    if not text:
        return text
    text = _CPF_RE.sub("[CPF_REDACTED]", text)
    text = _CNPJ_RE.sub("[CNPJ_REDACTED]", text)
    text = _EMAIL_RE.sub("[EMAIL_REDACTED]", text)
    text = _PHONE_RE.sub("[PHONE_REDACTED]", text)
    text = _DATE_RE.sub("[DATE_REDACTED]", text)
    return text


def _redact_recursive(obj: Any) -> Any:
    if isinstance(obj, str):
        return redact_pii(obj)
    if isinstance(obj, dict):
        return {k: _redact_recursive(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [_redact_recursive(item) for item in obj]
    return obj


def redact_pii_processor(_logger: Any, _method_name: str, event_dict: dict[str, Any]) -> dict[str, Any]:
    """structlog processor que aplica redact_pii em toda string do evento."""
    return _redact_recursive(event_dict)


def make_redacting_hooks() -> tuple[Callable[..., Any], Callable[..., Any]]:
    def hide_inputs(inputs: dict[str, Any]) -> dict[str, Any]:
        return _redact_recursive(inputs)  # type: ignore[no-any-return]

    def hide_outputs(outputs: dict[str, Any]) -> dict[str, Any]:
        return _redact_recursive(outputs)  # type: ignore[no-any-return]

    return hide_inputs, hide_outputs


def configure_observability() -> Client | None:
    settings = get_settings()

    if not settings.langsmith_tracing or not settings.langsmith_api_key:
        logger.info("langsmith.disabled")
        os.environ["LANGSMITH_TRACING"] = "false"
        return None

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
    )
    return client
