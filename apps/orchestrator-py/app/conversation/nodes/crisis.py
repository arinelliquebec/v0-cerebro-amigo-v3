"""Nós de detecção e protocolo de crise.

`detect_crisis`: Haiku, fail-safe (exceção → trata como crise).
`crisis_protocol`: SEM LLM. Texto fixo, grava trilha e aciona o alerta ao médico.

Ordem em `crisis_protocol` (tudo numa transação):
  1. INSERT protocolos_crise_acionados (RETURNING id) — fonte da verdade da crise
  2. INSERT notificacoes_medico (severidade='critica') — canal in-app
  3. INSERT crise_alerta_eventos (canal='in_app') — abre a trilha de entrega (ADR-041)
  4. UPDATE conversas.status = 'humano'
  5. UPDATE pacientes.automacao_pausada = TRUE (defesa em camadas)
  6. INSERT mensagens (papel='assistant', conteudo=texto_protocolo, cifrado)

Após o commit: trigger best-effort ao notifier (`/internal/crise/despachar`)
para o e-mail sair em segundos. O watchdog do notifier é a rede durável se o
trigger falhar. Entrega, escalonamento e ack vivem em `crise_alerta_eventos`.
"""

from __future__ import annotations

import asyncio
import json
from uuid import UUID

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

# Referências fortes às tasks de trigger (evita GC enquanto rodam).
_background_tasks: set[asyncio.Task] = set()


def _schedule_notifier_trigger(protocolo_id: UUID) -> None:
    """Dispara o alerta ao notifier SEM bloquear a resposta ao paciente.

    Best-effort: sem event loop ou em falha de rede, o watchdog do notifier
    (varre `protocolos_crise_acionados` abertos) é a rede durável."""
    try:
        loop = asyncio.get_running_loop()
    except RuntimeError:  # pragma: no cover
        logger.warning("crise.trigger.no_loop", protocolo_id=str(protocolo_id))
        return
    task = loop.create_task(_notificar_notifier(protocolo_id))
    _background_tasks.add(task)
    task.add_done_callback(_background_tasks.discard)


async def _notificar_notifier(protocolo_id: UUID) -> None:
    settings = get_settings()
    try:
        import httpx
    except ImportError:  # pragma: no cover
        logger.warning("crise.trigger.no_httpx", protocolo_id=str(protocolo_id))
        return
    url = settings.notifier_url.rstrip("/") + "/internal/crise/despachar"
    token = settings.internal_api_token.get_secret_value()
    try:
        async with httpx.AsyncClient(timeout=5) as client:
            await client.post(
                url,
                headers={"Authorization": f"Bearer {token}"},
                json={"protocolo_id": str(protocolo_id)},
            )
        logger.info("crise.trigger.ok", protocolo_id=str(protocolo_id))
    except Exception as exc:
        logger.warning(
            "crise.trigger.failed", protocolo_id=str(protocolo_id), error=str(exc)
        )


# ── Camada 4 do ADR-063: observabilidade do classificador de crise ──────────
# PURA INSTRUMENTAÇÃO — não altera a decisão de crise (as camadas 1-3 do ADR, que
# mudam comportamento, dependem de atestação clínica). Aqui só tornamos um outage
# do classificador VISÍVEL à engenharia em minutos: o incidente que motivou o ADR
# (chave Anthropic revogada → fail-safe disparando crise em toda msg) passou ~18
# dias silencioso porque o `logger.exception` do structlog não chegava ao Sentry.


def _classify_llm_error(exc: Exception) -> tuple[str, bool]:
    """Retorna (error_class, is_systemic).

    Sistêmico = afeta TODOS os pacientes (config/credencial), não é ambiguidade de
    uma mensagem isolada: auth (401/403). Esse é o sinal que precisa gritar.
    """
    status = getattr(exc, "status_code", None)
    if status is None:
        status = getattr(getattr(exc, "response", None), "status_code", None)
    name = type(exc).__name__
    if status in (401, 403) or "Authentication" in name or "PermissionDenied" in name:
        return "auth", True
    if status == 429 or "RateLimit" in name:
        return "rate_limit", False
    if isinstance(status, int) and 500 <= status < 600:
        return "server", False
    return "other", False


def _report_classifier_down(exc: Exception, error_class: str, systemic: bool) -> None:
    """Alerta de OPS no Sentry (canal de erro do backend). Best-effort: nunca deixa
    a observabilidade derrubar o caminho de crise.

    LGPD/R4: usa ``capture_message`` (NÃO ``capture_exception``) — não anexa frame
    locals, que conteriam a mensagem do paciente. Só classe/tipo/status do erro.
    Fingerprint estável → 1 issue agrupada (não spamma 1 por mensagem).
    Gate manual: regra de alerta no Sentry mirando ``component:crisis_classifier``
    (ou nível fatal) → e-mail/Slack à engenharia.
    """
    try:
        import sentry_sdk
    except ImportError:
        return
    try:
        status = getattr(exc, "status_code", None)
        with sentry_sdk.push_scope() as scope:
            scope.set_tag("component", "crisis_classifier")
            scope.set_tag("error_class", error_class)
            scope.set_tag("systemic", "true" if systemic else "false")
            if status is not None:
                scope.set_tag("http_status", str(status))
            scope.set_level("fatal" if systemic else "error")
            scope.fingerprint = ["crisis-classifier-down", error_class]
            detalhe = f"{error_class} / {type(exc).__name__}"
            if status is not None:
                detalhe += f" / HTTP {status}"
            sentry_sdk.capture_message(
                f"crisis classifier indisponível (ADR-063 camada 4): {detalhe}",
                level="fatal" if systemic else "error",
            )
    except Exception:  # nunca deixa a observabilidade derrubar a crise
        logger.warning("crisis.detect.sentry_capture_failed")


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
        error_class, systemic = _classify_llm_error(exc)
        # Fail-safe clínico (INALTERADO): classificador falhou → trata como crise.
        logger.exception(
            "crisis.detect.failed",
            error=str(exc),
            error_class=error_class,
            systemic=systemic,
        )
        # Camada 4 (ADR-063): torna o outage do classificador visível à engenharia.
        # NÃO altera a decisão abaixo — só alerta. Sistêmico (auth) = afeta todos.
        _report_classifier_down(exc, error_class, systemic)
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
        # 1. Trilha de auditoria (fonte da verdade da crise). `medico_notificado`
        #    aqui = "processo de alerta iniciado"; a entrega/ack REAIS vivem em
        #    crise_alerta_eventos (ADR-041), já que esta linha é imutável.
        protocolo_id = await conn.fetchval(
            """
            INSERT INTO protocolos_crise_acionados
                (paciente_id, medico_id, mensagem_id, gatilho, palavras_detectadas,
                 confianca, resposta_enviada, medico_notificado,
                 medico_notificado_em)
            VALUES ($1, $2, $3, $4, $5, $6, $7, TRUE, NOW())
            RETURNING id
            """,
            paciente_id,
            medico_id,
            mensagem_db_id,
            _gatilho_principal(crise["gatilhos"], crise["nivel"]),
            crise["gatilhos"],
            crise["confianca"],
            texto,
        )

        # 2. Notifica médico (canal in-app — aparece no dashboard)
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

        # 3. Abre a trilha de entrega do alerta (ADR-041). O canal in-app já
        #    está entregue (a notificação acima aparece no dashboard).
        await conn.execute(
            """
            INSERT INTO crise_alerta_eventos
                (protocolo_id, medico_id, canal, evento, estagio, detalhe)
            VALUES ($1, $2, 'in_app', 'enviado', 0, 'notificacao_dashboard')
            """,
            protocolo_id,
            medico_id,
        )

        # 4. Escala conversa para humano
        await conn.execute(
            "UPDATE conversas SET status = 'humano' WHERE id = $1",
            conversa_id,
        )

        # 5. Pausa automação do paciente (toggle global)
        await conn.execute(
            "UPDATE pacientes SET automacao_pausada = TRUE WHERE cliente_id = $1",
            paciente_id,
        )

        # 6. Mensagem do bot persistida — texto fixo de protocolo (cifrado)
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

    # Trigger imediato ao notifier (best-effort; watchdog é a rede durável).
    _schedule_notifier_trigger(protocolo_id)

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
