"""Geração, auditoria e escalada da resposta ao paciente."""

from __future__ import annotations

import json

import structlog
from langchain_core.messages import HumanMessage, SystemMessage

from app.config import get_settings
from app.conversation.llm import haiku, sonnet, with_schema
from app.conversation.prompts import AUDIT_SYSTEM_V1, RESPONSE_GENERATION_SYSTEM_V1
from app.conversation.schemas import AuditOutput
from app.conversation.state import ConversaState
from app.db import acquire

logger = structlog.get_logger(__name__)


async def generate_response(state: ConversaState) -> dict:
    settings = get_settings()
    sintomas_resumo = json.dumps(state.get("sintomas") or {}, ensure_ascii=False)

    system = RESPONSE_GENERATION_SYSTEM_V1.format(
        nome_paciente=state.get("nome_paciente", "") or "",
        sintomas_resumo=sintomas_resumo,
    )

    msgs: list = [SystemMessage(content=system)]
    if state.get("retry_count", 0) > 0 and state.get("audit"):
        msgs.append(
            SystemMessage(
                content=(
                    "Sua resposta anterior foi reprovada na auditoria. "
                    f"Motivo: {state['audit']['motivo']}. "
                    f"Flags: {state['audit']['flags']}. "
                    "Reescreva corrigindo esses pontos."
                )
            )
        )
    msgs.append(HumanMessage(content=state["mensagem"]))

    response = await sonnet(temperature=0.3).ainvoke(msgs)
    rascunho = (
        response.content if isinstance(response.content, str) else str(response.content)
    ).strip()

    usage = getattr(response, "usage_metadata", None) or {}

    logger.info(
        "response.generate.done",
        retry_count=state.get("retry_count", 0),
        len_chars=len(rascunho),
        tokens_in=usage.get("input_tokens"),
        tokens_out=usage.get("output_tokens"),
    )

    return {
        "resposta_rascunho": rascunho,
        "retry_count": state.get("retry_count", 0),
        "modelo_resposta": settings.model_sonnet,
        "tokens_in": usage.get("input_tokens"),
        "tokens_out": usage.get("output_tokens"),
    }


async def audit_response(state: ConversaState) -> dict:
    rascunho = state["resposta_rascunho"]
    llm = with_schema(haiku(), AuditOutput)

    try:
        result: AuditOutput = await llm.ainvoke(
            [
                SystemMessage(content=AUDIT_SYSTEM_V1),
                HumanMessage(content=f"Resposta proposta ao paciente:\n\n{rascunho}"),
            ]
        )
    except Exception as exc:  # pragma: no cover
        logger.exception("audit.failed", error=str(exc))
        return {
            "audit": {
                "decisao": "bloquear",
                "motivo": "auditor_indisponivel",
                "flags": ["auditor_error"],
            }
        }

    logger.info(
        "audit.done", decisao=result.decisao, flags=result.flags, motivo=result.motivo
    )

    # Promove rascunho a `resposta_final` quando aprovado. Para 'reescrever'
    # ou 'bloquear', mantém None — `finalize` vê falta de texto e não persiste.
    promoted = (
        state["resposta_rascunho"] if result.decisao == "enviar" else None
    )

    return {
        "audit": {
            "decisao": result.decisao,
            "motivo": result.motivo,
            "flags": result.flags,
        },
        "retry_count": state.get("retry_count", 0)
        + (1 if result.decisao == "reescrever" else 0),
        "resposta_final": promoted,
    }


async def escalate_to_human(state: ConversaState) -> dict:
    metadata = {
        "motivo": state["audit"]["motivo"],
        "flags": state["audit"]["flags"],
        "retry_count": state.get("retry_count", 0),
        "mensagem_db_id": str(state.get("mensagem_db_id")),
        "rascunho_bloqueado": state.get("resposta_rascunho"),
    }

    async with acquire() as conn, conn.transaction():
        await conn.execute(
            """
            INSERT INTO notificacoes_medico
                (medico_id, paciente_id, severidade, tipo,
                 titulo, mensagem, metadata)
            VALUES ($1, $2, 'alta', 'escalada_auditor', $3, $4, $5::jsonb)
            """,
            state["medico_responsavel_id"],
            state["paciente_id"],
            "Resposta automática bloqueada para revisão",
            (
                f"O auditor automático bloqueou uma resposta gerada para o "
                f"paciente. Motivo: {state['audit']['motivo']}. "
                f"A automação foi escalada para revisão humana."
            ),
            json.dumps(metadata, ensure_ascii=False),
        )
        # Não envia nada ao paciente; também marca conversa pra humano cuidar
        await conn.execute(
            "UPDATE conversas SET status = 'humano' WHERE id = $1",
            state["conversa_id"],
        )

    logger.warning(
        "audit.escalated",
        paciente_id=str(state["paciente_id"]),
        motivo=state["audit"]["motivo"],
    )
    return {"resposta_final": None, "conversa_status": "humano"}
