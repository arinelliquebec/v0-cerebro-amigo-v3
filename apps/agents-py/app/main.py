"""FastAPI entrypoint do agents-py."""

from __future__ import annotations

import logging
from contextlib import asynccontextmanager
from typing import AsyncIterator
from uuid import UUID

import structlog
from fastapi import Depends, FastAPI, Header, HTTPException
from pydantic import BaseModel

from app.agents import AGENT_REGISTRY, AgentPayload
from app.agents.resumidor import ResumidorAgent
from datetime import UTC, datetime, timedelta
from uuid import uuid4
from app.core.config import get_settings
from app.core.db import acquire, close_pool, init_pool
from app.core.observability import configure_observability, redact_pii_processor
from app.scheduler import (
    run_for_patient,
    run_once,
    shutdown_scheduler,
    start_scheduler,
)
from app.services.crisis import acionar_protocolo_diario, detectar_crise
from app.services.transcricao import transcrever_audio


def _configure_logging() -> None:
    settings = get_settings()
    logging.basicConfig(level=settings.log_level)
    structlog.configure(
        processors=[
            structlog.processors.add_log_level,
            structlog.processors.TimeStamper(fmt="iso"),
            structlog.processors.dict_tracebacks,
            redact_pii_processor,
            structlog.processors.JSONRenderer(),
        ],
        wrapper_class=structlog.make_filtering_bound_logger(
            logging.getLevelName(settings.log_level)
        ),
        cache_logger_on_first_use=True,
    )


@asynccontextmanager
async def lifespan(_app: FastAPI) -> AsyncIterator[None]:
    _configure_logging()
    log = structlog.get_logger(__name__)
    settings = get_settings()
    log.info("app.startup.begin", env=settings.app_env, mode=settings.agents_mode)

    configure_observability()
    await init_pool()

    if settings.agents_mode == "scheduled":
        start_scheduler()
        log.info("scheduler.started")
    else:
        log.info("scheduler.disabled.manual_mode")

    log.info("app.startup.done")
    try:
        yield
    finally:
        log.info("app.shutdown.begin")
        shutdown_scheduler()
        await close_pool()
        log.info("app.shutdown.done")


app = FastAPI(
    title="Cérebro Amigo · Agents (Python)",
    version="0.1.0",
    lifespan=lifespan,
)


# ─── Health checks ─────────────────────────────────────────────────────────


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/ready")
async def ready() -> dict[str, str]:
    async with acquire() as conn:
        await conn.execute("SELECT 1")
    return {"status": "ready"}


# ─── Endpoints manuais ─────────────────────────────────────────────────────


def _check_internal_token(authorization: str | None = Header(None)) -> None:
    import hmac

    settings = get_settings()
    expected = f"Bearer {settings.internal_api_token.get_secret_value()}"
    if not hmac.compare_digest(authorization or "", expected):
        raise HTTPException(status_code=401, detail="invalid internal token")


@app.get("/internal/agents", dependencies=[Depends(_check_internal_token)])
async def list_agents() -> dict[str, list[str]]:
    return {"agents": sorted(AGENT_REGISTRY.keys())}


@app.post(
    "/internal/agents/{name}/run",
    dependencies=[Depends(_check_internal_token)],
)
async def run_agent_now(name: str) -> dict:
    """Dispara um ciclo do agente agora (varre find_pending, executa,
    respeita dedup window). Útil para forçar processamento sem esperar
    o scheduler."""
    if name not in AGENT_REGISTRY:
        raise HTTPException(status_code=404, detail=f"agente '{name}' desconhecido")
    return await run_once(name)


class RunForPatientRequest(BaseModel):
    paciente_id: UUID


@app.post(
    "/internal/agents/{name}/run-for-patient",
    dependencies=[Depends(_check_internal_token)],
)
async def run_agent_for_patient(name: str, req: RunForPatientRequest) -> dict:
    """Força execução de um agente para um paciente específico, IGNORANDO
    dedup window. Usado quando médico clica 'regenerar' no dashboard.

    Se o agente não considera o paciente elegível agora (sem consulta
    agendada para resumidor, triggers não atingidos para adesão, etc.),
    retorna 200 com `insight_id=null` e mensagem explicativa.
    """
    if name not in AGENT_REGISTRY:
        raise HTTPException(status_code=404, detail=f"agente '{name}' desconhecido")
    return await run_for_patient(name, req.paciente_id)


# ─── Diário de Voz ────────────────────────────────────────────────────────


class TranscreverAudioRequest(BaseModel):
    audio_base64: str   # áudio codificado em base64 (WebM ou MP4, máx ~10MB)
    content_type: str   # "audio/webm" | "audio/mp4"
    paciente_id: UUID


@app.post(
    "/internal/diario/transcrever",
    dependencies=[Depends(_check_internal_token)],
)
async def transcrever_diario(req: TranscreverAudioRequest) -> dict:
    """Transcreve áudio de diário e retorna análise clínica estruturada.

    Fluxo interno: S3 upload → Amazon Transcribe (pt-BR) → Claude Sonnet → resultado.
    O áudio é deletado do S3 logo após a transcrição (LGPD).
    """
    import base64

    audio_bytes = base64.b64decode(req.audio_base64)
    if len(audio_bytes) > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="áudio maior que 10 MB")

    result = await transcrever_audio(audio_bytes, req.content_type, req.paciente_id)
    return {
        "transcricao": result.transcricao,
        "humor_estimado": result.humor_estimado,
        "emocao_predominante": result.emocao_predominante,
        "tags_sugeridas": result.tags_sugeridas,
        "sintomas_detectados": result.sintomas_detectados,
        "crise": result.crise,
        "crise_texto": result.crise_texto,
    }


class TriarTextoRequest(BaseModel):
    texto: str
    paciente_id: UUID


@app.post(
    "/internal/diario/triar-texto",
    dependencies=[Depends(_check_internal_token)],
)
async def triar_texto_diario(req: TriarTextoRequest) -> dict:
    """Triagem de crise para entradas de diário DIGITADAS (texto).

    O gateway chama isto ANTES de salvar a entrada de texto. Se houver crise,
    aciona o protocolo (texto fixo de acolhimento, trilha, notifica médico,
    pausa automação) e devolve crise=True — o gateway então NÃO salva a entrada
    como nota comum e o front exibe o acolhimento.

    Não faz análise (humor/tags) — só triagem de risco. Fail-safe: erro no
    classificador → tratado como crise (regra #2 clinical-safety).
    """
    crise = await detectar_crise(req.texto)
    if not crise.crise_detectada:
        return {"crise": False, "crise_texto": None}

    async with acquire() as conn:
        texto = await acionar_protocolo_diario(
            conn, req.paciente_id, crise, origem="diario_texto"
        )
    return {"crise": True, "crise_texto": texto}


@app.post(
    "/internal/agents/resumo_pre_consulta/run-on-demand",
    dependencies=[Depends(_check_internal_token)],
)
async def run_resumo_on_demand(req: RunForPatientRequest) -> dict:
    """Forca execucao do ResumidorAgent pra UM paciente, IGNORANDO find_pending.

    Diferente de /run-for-patient (que iteraria find_pending e desistiria se o
    paciente nao tem consulta agendada), este endpoint constroi um payload
    sintetico e dispara `_run_for_payload` direto. Usado pelo botao 'Gerar
    resumo' no dashboard medico, onde o medico decide quando quer o briefing
    independente de elegibilidade.
    """
    agent = ResumidorAgent()

    async with acquire() as conn:
        medico_id = await conn.fetchval(
            "SELECT medico_responsavel_id FROM pacientes WHERE cliente_id = $1",
            req.paciente_id,
        )
    if medico_id is None:
        raise HTTPException(
            status_code=404,
            detail="paciente sem medico_responsavel_id",
        )

    payload = AgentPayload(
        paciente_id=req.paciente_id,
        medico_id=medico_id,
        extra={
            "consulta_id": str(uuid4()),
            "consulta_inicia_em": (datetime.now(UTC) + timedelta(hours=24)).isoformat(),
            "consulta_modalidade": "on_demand",
        },
    )

    insight_id = await agent._run_for_payload(payload)  # noqa: SLF001
    return {
        "insight_id": str(insight_id) if insight_id else None,
        "on_demand": True,
    }
