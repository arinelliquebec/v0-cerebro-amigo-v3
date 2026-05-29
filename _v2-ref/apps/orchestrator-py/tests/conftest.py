"""Fixtures globais de teste.

Em CI: idealmente subir um Postgres efêmero (testcontainers ou serviço do
GitHub Actions). Aqui deixamos a estrutura para Patrick decidir o setup.
"""

from __future__ import annotations

import asyncio

import pytest


@pytest.fixture(scope="session")
def event_loop_policy():
    return asyncio.DefaultEventLoopPolicy()
