"""Testes unitários do tradutor de eventos SSE (streaming.py).

Valida _summary_for_node, _final_state_payload e translate_events
sem dependência de DB ou LLM.
"""

from __future__ import annotations

from typing import Any
from uuid import uuid4

import pytest

from app.conversation.streaming import (
    _STREAMABLE_NODE,
    _final_state_payload,
    _summary_for_node,
    translate_events,
)


class TestSummaryForNode:
    def test_load_context(self) -> None:
        output = {
            "conversa_id": uuid4(),
            "conversa_status": "ativa",
            "automacao_pausada": False,
            "checkin_pendente": {"id": "abc"},
        }
        summary = _summary_for_node("load_context", output)
        assert summary["conversa_status"] == "ativa"
        assert summary["automacao_pausada"] is False
        assert summary["tem_checkin_pendente"] is True

    def test_load_context_no_checkin(self) -> None:
        output = {"conversa_id": None, "conversa_status": "nova"}
        summary = _summary_for_node("load_context", output)
        assert summary["tem_checkin_pendente"] is False

    def test_detect_crisis_detected(self) -> None:
        output = {"crise": {"detectada": True, "nivel": "alto", "confianca": 0.95}}
        summary = _summary_for_node("detect_crisis", output)
        assert summary["detectada"] is True
        assert summary["nivel"] == "alto"
        assert summary["confianca"] == 0.95

    def test_detect_crisis_not_detected(self) -> None:
        output = {"crise": {"detectada": False, "nivel": None, "confianca": 0.1}}
        summary = _summary_for_node("detect_crisis", output)
        assert summary["detectada"] is False

    def test_classify_medication(self) -> None:
        output = {"medicacao": {"eh_resposta": True, "status": "tomou"}}
        summary = _summary_for_node("classify_medication", output)
        assert summary["eh_resposta"] is True
        assert summary["status"] == "tomou"

    def test_extract_symptoms(self) -> None:
        output = {"sintomas": ["insonia", "ansiedade"]}
        summary = _summary_for_node("extract_symptoms", output)
        assert summary["has_sintomas"] is True

    def test_extract_symptoms_none(self) -> None:
        output = {"sintomas": None}
        summary = _summary_for_node("extract_symptoms", output)
        assert summary["has_sintomas"] is False

    def test_audit_response(self) -> None:
        output = {"audit": {"decisao": "aprovado", "motivo": "OK"}}
        summary = _summary_for_node("audit_response", output)
        assert summary["decisao"] == "aprovado"

    def test_crisis_protocol(self) -> None:
        summary = _summary_for_node("crisis_protocol", {})
        assert summary["acionado"] is True

    def test_escalate_to_human(self) -> None:
        summary = _summary_for_node("escalate_to_human", {})
        assert summary["escalado"] is True

    def test_finalize(self) -> None:
        output = {"enviado": True}
        summary = _summary_for_node("finalize", output)
        assert summary["enviado"] is True

    def test_unknown_node_returns_empty(self) -> None:
        summary = _summary_for_node("unknown_node", {"x": 1})
        assert summary == {}


class TestFinalStatePayload:
    def test_includes_expected_keys(self) -> None:
        state: dict[str, Any] = {
            "conversa_id": uuid4(),
            "conversa_status": "finalizada",
            "resposta_final": "Tudo bem!",
            "enviado": True,
            "crise": None,
            "medicacao": None,
            "sintomas": None,
            "audit": None,
            "trace_id": "abc123",
            "extra_field": "ignored",
        }
        payload = _final_state_payload(state)
        assert set(payload.keys()) == {
            "conversa_id",
            "conversa_status",
            "resposta_final",
            "enviado",
            "crise",
            "medicacao",
            "sintomas",
            "audit",
            "trace_id",
        }
        assert payload["resposta_final"] == "Tudo bem!"
        assert "extra_field" not in payload


class TestTranslateEvents:
    @staticmethod
    async def _collect(events: list[dict[str, Any]]) -> list[dict[str, Any]]:
        async def gen():
            for e in events:
                yield e
        return [ev async for ev in translate_events(gen())]

    @pytest.mark.asyncio
    async def test_node_start_event(self) -> None:
        events = [{"event": "on_chain_start", "name": "load_context", "data": {}}]
        result = await self._collect(events)
        assert len(result) == 1
        assert result[0]["event"] == "node"
        assert result[0]["data"]["status"] == "started"

    @pytest.mark.asyncio
    async def test_node_end_event(self) -> None:
        events = [
            {
                "event": "on_chain_end",
                "name": "detect_crisis",
                "data": {"output": {"crise": {"detectada": False, "nivel": None, "confianca": 0.1}}},
            }
        ]
        result = await self._collect(events)
        assert len(result) == 1
        assert result[0]["event"] == "node"
        assert result[0]["data"]["status"] == "completed"

    @pytest.mark.asyncio
    async def test_ignores_non_node_chain_events(self) -> None:
        events = [{"event": "on_chain_start", "name": "some_internal_thing", "data": {}}]
        result = await self._collect(events)
        assert len(result) == 0

    @pytest.mark.asyncio
    async def test_token_event_from_streamable_node(self) -> None:
        class FakeChunk:
            content = "Olá"
        events = [
            {
                "event": "on_chat_model_stream",
                "name": "ChatAnthropic",
                "data": {"chunk": FakeChunk()},
                "metadata": {"langgraph_node": _STREAMABLE_NODE},
            }
        ]
        result = await self._collect(events)
        assert len(result) == 1
        assert result[0]["event"] == "token"
        assert result[0]["data"]["delta"] == "Olá"

    @pytest.mark.asyncio
    async def test_ignores_token_from_non_streamable_node(self) -> None:
        class FakeChunk:
            content = "data"
        events = [
            {
                "event": "on_chat_model_stream",
                "name": "ChatAnthropic",
                "data": {"chunk": FakeChunk()},
                "metadata": {"langgraph_node": "detect_crisis"},
            }
        ]
        result = await self._collect(events)
        assert len(result) == 0

    @pytest.mark.asyncio
    async def test_complete_event(self) -> None:
        events = [
            {
                "event": "on_chain_end",
                "name": "LangGraph",
                "data": {
                    "output": {
                        "conversa_id": str(uuid4()),
                        "resposta_final": "Cuide-se!",
                        "enviado": True,
                    }
                },
            }
        ]
        result = await self._collect(events)
        assert len(result) == 1
        assert result[0]["event"] == "complete"
        assert result[0]["data"]["resposta_final"] == "Cuide-se!"
