"""Factory de ChatBedrockConverse compartilhada."""

from __future__ import annotations

from dataclasses import dataclass
from functools import lru_cache
from typing import Any, TypeVar

from langchain_aws import ChatBedrockConverse
from langchain_core.runnables import Runnable
from pydantic import BaseModel

from app.core.config import get_settings

T = TypeVar("T", bound=BaseModel)


@lru_cache(maxsize=4)
def haiku() -> ChatBedrockConverse:
    s = get_settings()
    return ChatBedrockConverse(
        model_id=s.bedrock_model_haiku,
        region_name=s.bedrock_region,
        temperature=0.0,
        max_tokens=1024,
    )


@lru_cache(maxsize=4)
def sonnet(temperature: float = 0.2) -> ChatBedrockConverse:
    s = get_settings()
    return ChatBedrockConverse(
        model_id=s.bedrock_model_sonnet,
        region_name=s.bedrock_region,
        temperature=temperature,
        max_tokens=2048,
    )


def with_schema(llm: ChatBedrockConverse, schema: type[T]) -> Runnable[Any, T]:
    """Saída estruturada simples (sem trilha de uso)."""
    return llm.with_structured_output(schema, include_raw=False)  # type: ignore[return-value]


@dataclass(frozen=True)
class StructuredCall:
    """Resultado de uma chamada estruturada com métricas de uso."""

    parsed: BaseModel
    tokens_in: int | None
    tokens_out: int | None
    model_id: str | None


async def ainvoke_structured(
    llm: ChatBedrockConverse,
    schema: type[T],
    messages: list,
) -> StructuredCall:
    """Chama o modelo com structured output E captura usage metadata.

    Falha alto: se o LLM responder mas o output não validar contra o
    schema, levantamos com o conteúdo bruto truncado nos logs.
    """
    import structlog as _structlog
    _log = _structlog.get_logger(__name__)

    runnable = llm.with_structured_output(schema, include_raw=True)
    result = await runnable.ainvoke(messages)

    raw = result.get("raw") if isinstance(result, dict) else None
    parsed = result.get("parsed") if isinstance(result, dict) else result
    parsing_error = (
        result.get("parsing_error") if isinstance(result, dict) else None
    )

    usage = getattr(raw, "usage_metadata", None) or {}
    # Bedrock devolve model_id em response_metadata
    model_id = getattr(raw, "response_metadata", {}).get("model_id")

    if parsing_error is not None or parsed is None:
        raw_content = getattr(raw, "content", None)
        raw_preview = (
            str(raw_content)[:800] if raw_content else "<no raw content>"
        )
        _log.error(
            "structured_output.parsing_failed",
            schema=schema.__name__,
            parsing_error=str(parsing_error) if parsing_error else "parsed=None",
            raw_preview=raw_preview,
            tokens_in=usage.get("input_tokens"),
            tokens_out=usage.get("output_tokens"),
        )
        raise ValueError(
            f"LLM output failed schema validation for {schema.__name__}: "
            f"{parsing_error or 'parsed=None'}"
        )

    return StructuredCall(
        parsed=parsed,  # type: ignore[arg-type]
        tokens_in=usage.get("input_tokens"),
        tokens_out=usage.get("output_tokens"),
        model_id=model_id,
    )
