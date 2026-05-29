"""APScheduler para o notifier."""

from __future__ import annotations

import structlog
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.interval import IntervalTrigger

from app.core.config import get_settings
from app.dispatcher import dispatch_pending

logger = structlog.get_logger(__name__)

_scheduler: AsyncIOScheduler | None = None


async def _tick() -> None:
    try:
        await dispatch_pending()
    except Exception as exc:  # noqa: BLE001
        logger.exception("scheduler.tick.failed", error=str(exc))


def start_scheduler() -> AsyncIOScheduler:
    global _scheduler
    if _scheduler is not None:
        return _scheduler

    settings = get_settings()
    sched = AsyncIOScheduler(timezone="UTC")
    sched.add_job(
        _tick,
        trigger=IntervalTrigger(seconds=settings.scheduler_interval_seconds),
        id="tick:dispatch_pending",
        replace_existing=True,
        coalesce=True,
        max_instances=1,
    )
    sched.start()
    _scheduler = sched
    logger.info(
        "scheduler.started", interval_s=settings.scheduler_interval_seconds
    )
    return sched


def shutdown_scheduler() -> None:
    global _scheduler
    if _scheduler is not None:
        _scheduler.shutdown(wait=False)
        _scheduler = None
