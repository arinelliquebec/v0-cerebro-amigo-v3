"""Factory de clientes LLM.

Centraliza criação dos `ChatBedrockConverse` para que retries, timeouts e
identificação fiquem consistentes em todos os nós.
Auth via IAM role (prod) ou AWS_PROFILE (dev) — sem ANTHROPIC_API_KEY.
"""

from __future__ import annotations

from functools import lru_cache
from typing import Any, TypeVar

from langchain_aws import ChatBedrockConverse
from langchain_core.language_models import BaseChatModel
from langchain_core.runnables import Runnable
from pydantic import BaseModel

from app.config import get_settings

T = TypeVar("T", bound=BaseModel)


@lru_cache(maxsize=4)
def haiku() -> ChatBedrockConverse:
    """Modelo leve para classificação/auditoria."""
    s = get_settings()
    return ChatBedrockConverse(
        model_id=s.bedrock_model_haiku,
        region_name=s.bedrock_region,
        temperature=0.0,
        max_tokens=512,
    )


@lru_cache(maxsize=4)
def sonnet(temperature: float = 0.3) -> ChatBedrockConverse:
    """Modelo médio para extração e geração de resposta.

    ChatBedrockConverse streaming é controlado pelo método de invocação
    (astream/astream_events) — não requer flag na inicialização.
    """
    s = get_settings()
    return ChatBedrockConverse(
        model_id=s.bedrock_model_sonnet,
        region_name=s.bedrock_region,
        temperature=temperature,
        max_tokens=1024,
    )


def with_schema(llm: BaseChatModel, schema: type[T]) -> Runnable[Any, T]:
    """Atalho para saída estruturada via JSON schema."""
    return llm.with_structured_output(schema, include_raw=False)  # type: ignore[return-value]
