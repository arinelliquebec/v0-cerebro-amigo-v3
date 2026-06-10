"""Testes do escriba clínico (ADR-040): diarização, pipeline efêmero e guardrails.

Cobrem as invariantes que não podem regredir:
  - Áudio é SEMPRE deletado do S3, mesmo se a transcrição falhar (LGPD).
  - Transcrição vazia não chama o LLM (custo + não inventar rascunho).
  - O prompt do rascunho mantém a regra #1 (sem diagnóstico/CID/conduta).
  - Reconstrução diarizada rotula Locutor 1/2 sem assumir quem é médico.
"""

from __future__ import annotations

import json
import uuid
from types import SimpleNamespace
from unittest.mock import MagicMock

import pytest

from app.services import escriba
from app.services.escriba import (
    _RASCUNHO_SYSTEM,
    EscribaResult,
    RascunhoFactualOutput,
    _montar_transcricao_diarizada,
    _rotulo,
    _transcrever_consulta_s3,
    gerar_rascunho_consulta,
)

PACIENTE_ID = uuid.uuid4()


# ─── _rotulo ─────────────────────────────────────────────────────────────────


@pytest.mark.parametrize(
    ("spk", "esperado"),
    [
        ("spk_0", "Locutor 1"),
        ("spk_1", "Locutor 2"),
        (None, "Locutor"),
        ("", "Locutor"),
        ("garbage", "Locutor"),
    ],
)
def test_rotulo(spk, esperado):
    assert _rotulo(spk) == esperado


# ─── _montar_transcricao_diarizada ───────────────────────────────────────────


def _item(palavra: str, start: str) -> dict:
    return {
        "type": "pronunciation",
        "start_time": start,
        "alternatives": [{"content": palavra}],
    }


def _pont(char: str) -> dict:
    return {"type": "punctuation", "alternatives": [{"content": char}]}


def test_diarizacao_rotula_e_agrupa_por_locutor():
    data = {
        "results": {
            "speaker_labels": {
                "segments": [
                    {
                        "items": [
                            {"start_time": "0.0", "speaker_label": "spk_0"},
                            {"start_time": "0.5", "speaker_label": "spk_0"},
                            {"start_time": "1.2", "speaker_label": "spk_1"},
                        ]
                    }
                ]
            },
            "items": [
                _item("Como", "0.0"),
                _item("vai", "0.5"),
                _pont("?"),
                _item("Bem", "1.2"),
                _pont("."),
            ],
        }
    }
    assert _montar_transcricao_diarizada(data) == "Locutor 1: Como vai?\nLocutor 2: Bem."


def test_diarizacao_ausente_cai_para_transcript_simples():
    data = {"results": {"transcripts": [{"transcript": "texto corrido sem locutores"}]}}
    assert _montar_transcricao_diarizada(data) == "texto corrido sem locutores"


def test_diarizacao_payload_vazio():
    assert _montar_transcricao_diarizada({}) == ""
    assert _montar_transcricao_diarizada({"results": {}}) == ""


# ─── guardrails do prompt e do schema (regra #1 clinical-safety) ─────────────


def test_prompt_do_rascunho_mantem_guardrails_factuais():
    # Se alguém "suavizar" o prompt, este teste quebra de propósito.
    assert "NÃO diagnostique" in _RASCUNHO_SYSTEM
    assert "NÃO sugira CID" in _RASCUNHO_SYSTEM
    assert "decisão do MÉDICO" in _RASCUNHO_SYSTEM
    assert "Não invente" in _RASCUNHO_SYSTEM


def test_schema_mencao_risco_default_false():
    # Fail-safe: sem evidência explícita, não marca risco.
    assert RascunhoFactualOutput(resumo_factual="x").mencao_risco is False


# ─── gerar_rascunho_consulta (pipeline com mocks) ────────────────────────────


def _fake_structured_call(parsed: RascunhoFactualOutput) -> SimpleNamespace:
    return SimpleNamespace(parsed=parsed, tokens_in=100, tokens_out=50)


@pytest.fixture()
def pipeline_mocks(monkeypatch):
    """Mocka S3/Transcribe/LLM no namespace do módulo escriba."""
    upload = MagicMock(return_value="audio/teste.webm")
    delete = MagicMock()
    transcrever = MagicMock(return_value="Locutor 1: Olá.\nLocutor 2: Olá, doutor.")
    monkeypatch.setattr(escriba, "_upload_s3", upload)
    monkeypatch.setattr(escriba, "_delete_s3", delete)
    monkeypatch.setattr(escriba, "_transcrever_consulta_s3", transcrever)
    monkeypatch.setattr(escriba, "sonnet", MagicMock(return_value=object()))

    parsed = RascunhoFactualOutput(
        resumo_factual="Paciente relatou dificuldade para dormir.",
        queixas_relatadas=["dificuldade para dormir"],
        medicacoes_mencionadas=["Escitalopram"],
        mencao_risco=True,
    )
    llm_calls: list = []

    async def fake_ainvoke_structured(llm, schema, messages):
        llm_calls.append(messages)
        return _fake_structured_call(parsed)

    monkeypatch.setattr(escriba, "ainvoke_structured", fake_ainvoke_structured)
    return SimpleNamespace(
        upload=upload, delete=delete, transcrever=transcrever, llm_calls=llm_calls
    )


@pytest.mark.asyncio
async def test_pipeline_feliz_propaga_rascunho_e_risco(pipeline_mocks):
    result = await gerar_rascunho_consulta(b"audio", "audio/webm", PACIENTE_ID)

    assert isinstance(result, EscribaResult)
    assert result.transcricao.startswith("Locutor 1:")
    assert result.rascunho["medicacoes_mencionadas"] == ["Escitalopram"]
    assert result.mencao_risco is True
    pipeline_mocks.delete.assert_called_once_with(
        "audio/teste.webm", escriba.get_settings()
    )
    # A transcrição vai ao LLM como mensagem humana
    assert len(pipeline_mocks.llm_calls) == 1


@pytest.mark.asyncio
async def test_audio_deletado_do_s3_mesmo_se_transcricao_falhar(pipeline_mocks):
    # Invariante LGPD: o delete fica num finally — falha não pode vazar áudio.
    pipeline_mocks.transcrever.side_effect = RuntimeError("Transcribe job falhou")

    with pytest.raises(RuntimeError):
        await gerar_rascunho_consulta(b"audio", "audio/webm", PACIENTE_ID)

    pipeline_mocks.delete.assert_called_once()
    assert pipeline_mocks.llm_calls == []


@pytest.mark.asyncio
async def test_transcricao_vazia_nao_chama_llm(pipeline_mocks):
    pipeline_mocks.transcrever.return_value = "   "

    result = await gerar_rascunho_consulta(b"audio", "audio/webm", PACIENTE_ID)

    assert result == EscribaResult(transcricao="", rascunho={}, mencao_risco=False)
    assert pipeline_mocks.llm_calls == []
    pipeline_mocks.delete.assert_called_once()


# ─── _transcrever_consulta_s3 (boto3 mockado) ────────────────────────────────


def _settings_rapidos() -> SimpleNamespace:
    return SimpleNamespace(
        s3_bucket_audio="bucket-teste",
        aws_region="sa-east-1",
        transcribe_poll_interval_s=0.0,
        transcribe_timeout_s=0.2,
    )


def _transcribe_client_mock(respostas: list[dict]) -> MagicMock:
    client = MagicMock()
    client.get_transcription_job.side_effect = respostas
    return client


def test_transcrever_completed_pede_diarizacao_e_monta_texto(monkeypatch):
    client = _transcribe_client_mock(
        [
            {"TranscriptionJob": {"TranscriptionJobStatus": "IN_PROGRESS"}},
            {
                "TranscriptionJob": {
                    "TranscriptionJobStatus": "COMPLETED",
                    "Transcript": {"TranscriptFileUri": "https://transcribe/fake.json"},
                }
            },
        ]
    )
    monkeypatch.setattr(escriba.boto3, "client", MagicMock(return_value=client))

    payload = {"results": {"transcripts": [{"transcript": "resultado final"}]}}

    class FakeResp:
        def read(self):
            return json.dumps(payload).encode()

        def __enter__(self):
            return self

        def __exit__(self, *exc):
            return False

    monkeypatch.setattr(
        escriba.urllib.request, "urlopen", MagicMock(return_value=FakeResp())
    )

    texto = _transcrever_consulta_s3("audio/x.webm", _settings_rapidos())

    assert texto == "resultado final"
    kwargs = client.start_transcription_job.call_args.kwargs
    assert kwargs["LanguageCode"] == "pt-BR"
    assert kwargs["MediaFormat"] == "webm"
    assert kwargs["Settings"] == {"ShowSpeakerLabels": True, "MaxSpeakerLabels": 2}


def test_transcrever_failed_levanta_runtime_error(monkeypatch):
    client = _transcribe_client_mock(
        [
            {
                "TranscriptionJob": {
                    "TranscriptionJobStatus": "FAILED",
                    "FailureReason": "formato inválido",
                }
            }
        ]
    )
    monkeypatch.setattr(escriba.boto3, "client", MagicMock(return_value=client))

    with pytest.raises(RuntimeError, match="formato inválido"):
        _transcrever_consulta_s3("audio/x.webm", _settings_rapidos())


def test_transcrever_timeout(monkeypatch):
    em_progresso = {"TranscriptionJob": {"TranscriptionJobStatus": "IN_PROGRESS"}}
    client = MagicMock()
    client.get_transcription_job.return_value = em_progresso
    monkeypatch.setattr(escriba.boto3, "client", MagicMock(return_value=client))

    with pytest.raises(TimeoutError):
        _transcrever_consulta_s3("audio/x.webm", _settings_rapidos())
