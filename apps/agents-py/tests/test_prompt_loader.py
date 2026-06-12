"""T4-1: prompt_loader dos agentes — DB > builtin, com cache TTL."""

import asyncio

import pytest

from app.core import prompt_loader
from app.core.prompt_loader import get_prompt, invalidate_cache


def _sem_db(monkeypatch):
    async def none_db(agente: str, nome: str) -> None:
        return None

    monkeypatch.setattr(prompt_loader, "_fetch_from_db", none_db)


def test_fallback_builtin_sem_linha_no_banco(monkeypatch):
    _sem_db(monkeypatch)
    invalidate_cache()

    out = asyncio.run(get_prompt("agents", "adesao"))

    from app.agents.adesao import ADESAO_SYSTEM_V1

    assert out == ADESAO_SYSTEM_V1


def test_todos_os_5_agentes_tem_builtin(monkeypatch):
    _sem_db(monkeypatch)
    invalidate_cache()
    for nome in ("adesao", "diario", "padroes", "resumidor", "risco_silencioso"):
        out = asyncio.run(get_prompt("agents", nome))
        assert "Cérebro Amigo" in out


def test_prompt_do_banco_vence_e_cacheia(monkeypatch):
    calls = {"n": 0}

    async def db(agente: str, nome: str) -> str:
        calls["n"] += 1
        return "PROMPT EDITADO NO PAINEL"

    monkeypatch.setattr(prompt_loader, "_fetch_from_db", db)
    invalidate_cache()

    assert asyncio.run(get_prompt("agents", "diario")) == "PROMPT EDITADO NO PAINEL"
    assert asyncio.run(get_prompt("agents", "diario")) == "PROMPT EDITADO NO PAINEL"
    assert calls["n"] == 1  # segunda leitura veio do cache (TTL 60s)


def test_prompt_desconhecido_levanta(monkeypatch):
    _sem_db(monkeypatch)
    invalidate_cache()
    with pytest.raises(KeyError):
        asyncio.run(get_prompt("agents", "nao_existe"))
