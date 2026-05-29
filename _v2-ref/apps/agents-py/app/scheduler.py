"""APScheduler — dispara cada agente em sua cadência.

Default: roda todos os agentes registrados a cada N segundos
(`SCHEDULER_INTERVAL_SECONDS`). Cada agente decide internamente quais
pacientes processar via `find_pending()` + dedup window.

Se quiser cadências diferentes por agente no futuro, mover para
schedules específicos aqui (ex.: resumidor a cada 5min, padroes
diariamente, etc).
"""

from __future__ import annotations

import asyncio

import structlog
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.interval import IntervalTrigger

from app.agents import AGENT_REGISTRY, get_agent
from app.jobs import JOB_REGISTRY, get_job
from app.core.config import get_settings

logger = structlog.get_logger(__name__)

_scheduler: AsyncIOScheduler | None = None


async def _tick_agent(name: str) -> None:
    """Roda um ciclo de um agente, com isolamento de falhas."""
    log = logger.bind(agente=name)
    try:
        agent = get_agent(name)
        stats = await agent.run_once()
        log.info("scheduler.tick.done", **stats)
    except Exception as exc:  # noqa: BLE001
        log.exception("scheduler.tick.failed", error=str(exc))

async def _tick_job(name: str) -> None:
    """Roda um ciclo de um job, com isolamento de falhas."""
    log = logger.bind(job=name)
    try:
        job = get_job(name)
        stats = await job.run_once()
        log.info("scheduler.job_tick.done", **stats)
    except Exception as exc:  # noqa: BLE001
        log.exception("scheduler.job_tick.failed", error=str(exc))


def start_scheduler() -> AsyncIOScheduler:
    global _scheduler
    if _scheduler is not None:
        return _scheduler

    settings = get_settings()
    interval = settings.scheduler_interval_seconds

    sched = AsyncIOScheduler(timezone="UTC")
    for agent_name in AGENT_REGISTRY:
        sched.add_job(
            _tick_agent,
            trigger=IntervalTrigger(seconds=interval),
            args=[agent_name],
            id=f"tick:{agent_name}",
            replace_existing=True,
            coalesce=True,        # se atrasar, não acumular execuções
            max_instances=1,      # nunca dois ticks paralelos do mesmo agente
        )
        logger.info("scheduler.job.added", agente=agent_name, interval_s=interval)

    # Registra jobs operacionais (não-LLM) junto dos agents
    for job_name in JOB_REGISTRY:
        sched.add_job(
            _tick_job,
            trigger=IntervalTrigger(seconds=interval),
            args=[job_name],
            id=f"tick:job:{job_name}",
            replace_existing=True,
            coalesce=True,
            max_instances=1,
        )
        logger.info("scheduler.job.added", job=job_name, interval_s=interval)
        
    sched.start()
    _scheduler = sched
    return sched


def shutdown_scheduler() -> None:
    global _scheduler
    if _scheduler is not None:
        _scheduler.shutdown(wait=False)
        _scheduler = None


async def run_once(name: str) -> dict:
    """Disparo manual síncrono — usado pelos endpoints HTTP."""
    agent = get_agent(name)
    return await agent.run_once()


async def run_for_patient(name: str, paciente_id) -> dict:
    """Disparo manual focado em um paciente — útil para testes e bypass.

    Estratégia: percorre o `find_pending` do agente e processa o primeiro
    payload cujo `paciente_id` bate. Isto respeita a lógica de elegibilidade
    do agente (consulta agendada para resumidor, triggers ativos para
    adesao, etc.) e dispara `_run_for_payload` que ignora dedup window
    propositadamente — endpoint manual é para forçar nova execução.

    Se o agente não considera o paciente "pending" agora (ex.: triggers
    de adesão não atingidos, sem consulta agendada), retorna sem criar
    insight, explicitando o motivo.
    """
    agent = get_agent(name)

    async for payload in agent.find_pending():
        if payload.paciente_id == paciente_id:
            insight_id = await agent._run_for_payload(payload)  # noqa: SLF001
            return {
                "insight_id": str(insight_id) if insight_id else None,
                "payload_extra": payload.extra,
            }

    return {
        "insight_id": None,
        "message": (
            "Agente não considera o paciente elegível no momento. "
            "Possíveis razões: triggers não atingidos, sem consulta "
            "agendada, ou contexto insuficiente."
        ),
    }


# Re-export pra typing
__all__ = ["run_for_patient", "run_once", "shutdown_scheduler", "start_scheduler"]
