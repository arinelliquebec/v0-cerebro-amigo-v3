"""Acesso ao Postgres.

Duas conexões distintas:

* `pool` (asyncpg)  → queries de domínio (pacientes, prescrições, sintomas...).
* `checkpoint_dsn`  → DSN passada ao LangGraph AsyncPostgresSaver. Usa o driver
  psycopg3 sob o capô e gerencia o próprio pool.

Por que dois drivers? O checkpointer oficial do LangGraph para Postgres usa
psycopg3. Para o resto do projeto asyncpg é mais ergonômico e performático.
"""

from __future__ import annotations

from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

import asyncpg
import structlog

from app.config import get_settings

logger = structlog.get_logger(__name__)

_pool: asyncpg.Pool | None = None


async def init_pool() -> asyncpg.Pool:
    global _pool
    if _pool is not None:
        return _pool

    settings = get_settings()
    _pool = await asyncpg.create_pool(
        dsn=settings.postgres_dsn.get_secret_value(),
        min_size=2,
        max_size=20,
        command_timeout=15,
    )
    logger.info("db.pool.ready", min_size=2, max_size=20)
    return _pool


async def close_pool() -> None:
    global _pool
    if _pool is not None:
        await _pool.close()
        _pool = None
        logger.info("db.pool.closed")


def get_pool() -> asyncpg.Pool:
    if _pool is None:
        raise RuntimeError("DB pool não inicializado. Chame init_pool() no startup.")
    return _pool


@asynccontextmanager
async def acquire() -> AsyncIterator[asyncpg.Connection]:
    pool = get_pool()
    async with pool.acquire() as conn:
        yield conn


def checkpoint_dsn() -> str:
    """DSN para AsyncPostgresSaver do LangGraph (driver psycopg3)."""
    return get_settings().postgres_dsn.get_secret_value()
