"""Fail-safe do classificador de crise — ADR-006 (fail-closed).

Estes testes tornam o ADR-006 *executável*: quando a chamada ao classificador
falha por qualquer motivo técnico, `detect_crisis` DEVE assumir crise
(`detectada=True`, `nivel="alto"`, `gatilho="classifier_error"`). Falso
negativo em risco de auto-extermínio é o pior erro possível do sistema.

São testes determinísticos — não chamam LLM nem fazem I/O. O cliente LLM é
substituído por um duble que ou levanta exceção (caminho fail-safe) ou retorna
uma saída controlada (caminho normal).
"""

from __future__ import annotations

import pytest

from app.conversation.nodes import crisis as crisis_node
from app.conversation.schemas import CrisisDetectionOutput


class _RaisingLLM:
    """Duble de LLM cujo ainvoke sempre falha — simula Bedrock/Anthropic fora do ar."""

    def __init__(self, exc: Exception) -> None:
        self._exc = exc

    async def ainvoke(self, _messages):
        raise self._exc


class _StubLLM:
    """Duble de LLM que retorna uma saída estruturada controlada."""

    def __init__(self, output: CrisisDetectionOutput) -> None:
        self._output = output

    async def ainvoke(self, _messages):
        return self._output


@pytest.fixture(autouse=True)
def _no_real_llm(monkeypatch):
    """Garante que nenhum teste deste módulo construa um cliente LLM real.

    `detect_crisis` chama `haiku()`, `with_schema(...)` e `get_prompt(...)`;
    neutralizamos todos no namespace do nó. `with_schema` é re-substituído
    por teste conforme o comportamento desejado (falhar ou retornar saída).
    """
    monkeypatch.setattr(crisis_node, "haiku", lambda: object())

    async def _stub_get_prompt(_agente: str, _nome: str) -> str:
        return "system-prompt-stub"

    monkeypatch.setattr(crisis_node, "get_prompt", _stub_get_prompt)


def _state(mensagem: str = "qualquer coisa") -> dict:
    return {"mensagem": mensagem}


@pytest.mark.parametrize(
    "exc",
    [
        RuntimeError("Bedrock indisponível"),
        TimeoutError("timeout de rede"),
        ValueError("output não conformante ao schema"),
    ],
)
async def test_failsafe_trata_falha_como_crise(monkeypatch, exc):
    """Qualquer exceção no classificador → fail-closed (ADR-006)."""
    monkeypatch.setattr(crisis_node, "with_schema", lambda _llm, _schema: _RaisingLLM(exc))

    out = await crisis_node.detect_crisis(_state())
    crise = out["crise"]

    assert crise["detectada"] is True, "fail-safe deve assumir crise"
    assert crise["nivel"] == "alto"
    assert crise["confianca"] == 0.0
    assert "classifier_error" in crise["gatilhos"], (
        "gatilho deve marcar a falha técnica para triagem no audit trail"
    )


async def test_caminho_normal_mapeia_saida_do_classificador(monkeypatch):
    """Sem falha: o nó propaga fielmente a classificação do modelo."""
    output = CrisisDetectionOutput(
        crise_detectada=True,
        confianca=0.92,
        nivel="critico",
        gatilhos=["ideacao_ativa", "plano"],
    )
    monkeypatch.setattr(crisis_node, "with_schema", lambda _llm, _schema: _StubLLM(output))

    out = await crisis_node.detect_crisis(_state("comprei remédio pra usar tudo"))
    crise = out["crise"]

    assert crise["detectada"] is True
    assert crise["nivel"] == "critico"
    assert crise["confianca"] == pytest.approx(0.92)
    assert crise["gatilhos"] == ["ideacao_ativa", "plano"]


async def test_caminho_normal_nao_crise(monkeypatch):
    """Classificação negativa não deve disparar crise."""
    output = CrisisDetectionOutput(
        crise_detectada=False,
        confianca=0.05,
        nivel="nenhum",
        gatilhos=[],
    )
    monkeypatch.setattr(crisis_node, "with_schema", lambda _llm, _schema: _StubLLM(output))

    out = await crisis_node.detect_crisis(_state("tomei o remédio hoje cedo"))
    assert out["crise"]["detectada"] is False
    assert out["crise"]["nivel"] == "nenhum"


def test_gatilho_principal_usa_primeira_categoria():
    assert crisis_node._gatilho_principal(["isolamento", "desesperanca"], "alto") == "isolamento"


def test_gatilho_principal_fallback_para_nivel():
    """Sem categorias explícitas, cai para nivel_<nivel> — nunca string vazia."""
    assert crisis_node._gatilho_principal([], "critico") == "nivel_critico"
