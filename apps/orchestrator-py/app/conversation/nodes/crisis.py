"""Nós de detecção e protocolo de crise.

`detect_crisis`: Haiku, fail-safe (exceção → trata como crise).
`crisis_protocol`: SEM LLM. Texto fixo, grava trilha e notifica médico.

Ordem em `crisis_protocol`:
  1. INSERT protocolos_crise_acionados (referencia mensagens.id)
  2. INSERT notificacoes_medico (severidade='critica')
  3. UPDATE conversas.status = 'humano'
  4. UPDATE pacientes.automacao_pausada = TRUE (defesa em camadas)
  5. INSERT mensagens (papel='assistant', conteudo=texto_protocolo)
  6. Envio WhatsApp (somente se não shadow_mode)
"""

from __future__ import annotations

import json

import structlog
from langchain_core.messages import HumanMessage, SystemMessage

from app.config import get_settings
from app.conversation.crisis_copy import CRISIS_COPY, texto_protocolo
from app.conversation.llm import haiku, with_schema
from app.conversation.prompt_loader import get_prompt
from app.conversation.schemas import CrisisDetectionOutput
from app.conversation.state import ConversaState
from app.core.crypto import encrypt
from app.db import acquire

logger = structlog.get_logger(__name__)


async def detect_crisis(state: ConversaState) -> dict:
    llm = with_schema(haiku(), CrisisDetectionOutput)

    try:
        result: CrisisDetectionOutput = await llm.ainvoke(
            [
                SystemMessage(content=await get_prompt("orchestrator", "crisis_detection")),
                HumanMessage(content=state["mensagem"]),
            ]
        )
    except Exception as exc:  # pragma: no cover
        # Fail-safe: classificador falhou → trata como crise.
        logger.exception("crisis.detect.failed", error=str(exc))
        return {
            "crise": {
                "detectada": True,
                "confianca": 0.0,
                "nivel": "alto",
                "gatilhos": ["classifier_error"],
            }
        }

    logger.info(
        "crisis.detect.done",
        detectada=result.crise_detectada,
        nivel=result.nivel,
        confianca=result.confianca,
    )

    return {
        "crise": {
            "detectada": result.crise_detectada,
            "confianca": result.confianca,
            "nivel": result.nivel,
            "gatilhos": result.gatilhos,
        }
    }


def _gatilho_principal(gatilhos: list[str], nivel: str) -> str:
    """`protocolos_crise_acionados.gatilho` é texto único.

    Usa a primeira categoria do classificador, ou o nível como fallback.
    """
    if gatilhos:
        return gatilhos[0]
    return f"nivel_{nivel}"


async def crisis_protocol(state: ConversaState) -> dict:
    paciente_id = state["paciente_id"]
    medico_id = state["medico_responsavel_id"]
    conversa_id = state["conversa_id"]
    mensagem_db_id = state["mensagem_db_id"]
    crise = state["crise"]
    texto = texto_protocolo()
    settings = get_settings()

    metadata = {
        "nivel": crise["nivel"],
        "confianca": crise["confianca"],
        "gatilhos": crise["gatilhos"],
        "copy_versao": CRISIS_COPY.versao,
        "copy_hash": CRISIS_COPY.hash_sha256,
    }

    async with acquire() as conn, conn.transaction():
        # 1. Trilha de auditoria
        await conn.execute(
            """
            INSERT INTO protocolos_crise_acionados
                (paciente_id, mensagem_id, gatilho, palavras_detectadas,
                 confianca, resposta_enviada, medico_notificado,
                 medico_notificado_em)
            VALUES ($1, $2, $3, $4, $5, $6, TRUE, NOW())
            """,
            paciente_id,
            mensagem_db_id,
            _gatilho_principal(crise["gatilhos"], crise["nivel"]),
            crise["gatilhos"],
            crise["confianca"],
            texto,
        )

        # 2. Notifica médico
        await conn.execute(
            """
            INSERT INTO notificacoes_medico
                (medico_id, paciente_id, severidade, tipo,
                 titulo, mensagem, metadata)
            VALUES ($1, $2, 'critica', 'crise', $3, $4, $5::jsonb)
            """,
            medico_id,
            paciente_id,
            f"Protocolo de crise acionado (nível: {crise['nivel']})",
            (
                f"O paciente enviou uma mensagem classificada como risco "
                f"{crise['nivel']} (confiança {crise['confianca']:.2f}). "
                f"A automação foi suspensa e a conversa foi marcada para "
                f"intervenção humana. Resposta padrão de crise (v"
                f"{CRISIS_COPY.versao}) foi enviada ao paciente."
            ),
            json.dumps(metadata, ensure_ascii=False),
        )

        # 3. Escala conversa para humano
        await conn.execute(
            "UPDATE conversas SET status = 'humano' WHERE id = $1",
            conversa_id,
        )

        # 4. Pausa automação do paciente (toggle global)
        await conn.execute(
            "UPDATE pacientes SET automacao_pausada = TRUE WHERE cliente_id = $1",
            paciente_id,
        )

        # 5. Mensagem do bot persistida — texto fixo de protocolo (cifrado)
        key = get_settings().encryption_key
        key_str = key.get_secret_value() if key else None
        await conn.execute(
            """
            INSERT INTO mensagens (conversa_id, papel, conteudo, modelo_usado)
            VALUES ($1, 'assistant', $2, $3)
            """,
            conversa_id,
            encrypt(texto, key_str),
            f"crisis_copy:{CRISIS_COPY.versao}",
        )

    # O texto vai pro paciente via SSE/PWA — não há envio HTTP aqui.
    logger.warning(
        "crisis.protocol.executed",
        paciente_id=str(paciente_id),
        nivel=crise["nivel"],
        copy_versao=CRISIS_COPY.versao,
        shadow_mode=settings.shadow_mode,
    )

    return {
        "resposta_final": texto,
        "enviado": not settings.shadow_mode,
        "automacao_pausada": True,
        "conversa_status": "humano",
    }
