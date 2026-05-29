"""Factory de clientes LLM.

Centraliza criação dos `ChatAnthropic` para que prompt caching, retries,
timeouts e identificação fiquem consistentes em todos os nós.
"""

from __future__ import annotations

from functools import lru_cache
from typing import Any, TypeVar

from langchain_anthropic import ChatAnthropic
from langchain_core.runnables import Runnable
from pydantic import BaseModel

from app.config import get_settings

T = TypeVar("T", bound=BaseModel)


@lru_cache(maxsize=4)
def haiku() -> ChatAnthropic:
    """Modelo leve para classificação/auditoria."""
    s = get_settings()
    return ChatAnthropic(
        model=s.model_haiku,
        api_key=s.anthropic_api_key.get_secret_value(),
        temperature=0.0,            # classificação → determinismo
        max_tokens=512,
        timeout=15.0,
        max_retries=2,
    )


@lru_cache(maxsize=4)
def sonnet(temperature: float = 0.3) -> ChatAnthropic:
    """Modelo médio para extração e geração de resposta.

    `streaming=True` é obrigatório para que `astream_events(v2)` capture
    chunks de tokens. ChatAnthropic com streaming=True ainda funciona
    perfeitamente em `ainvoke` (agrega chunks e retorna mensagem final),
    então não há regressão para chamadas síncronas.
    """
    s = get_settings()
    return ChatAnthropic(
        model=s.model_sonnet,
        api_key=s.anthropic_api_key.get_secret_value(),
        temperature=temperature,
        max_tokens=1024,
        timeout=30.0,
        max_retries=2,
        streaming=True,
    )


def with_schema(llm: ChatAnthropic, schema: type[T]) -> Runnable[Any, T]:
    """Atalho para saída estruturada via JSON schema."""
    return llm.with_structured_output(schema, include_raw=False)  # type: ignore[return-value]
