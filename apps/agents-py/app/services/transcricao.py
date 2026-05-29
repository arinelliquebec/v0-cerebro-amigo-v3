"""Serviço de transcrição de áudio: S3 efêmero → Amazon Transcribe → Claude análise.

Fluxo:
  1. Upload do áudio para S3 (chave temporária por paciente)
  2. StartTranscriptionJob (pt-BR) — polling até conclusão
  3. DELETE do S3 imediatamente após obter transcript (LGPD)
  4. Claude Sonnet: extrai humor estimado, emoção, tags e sintomas relatados

O áudio NUNCA persiste além do ciclo de transcrição.
"""

from __future__ import annotations

import asyncio
import json
import time
import urllib.request
import uuid
from dataclasses import dataclass, field
from typing import Literal

import boto3
import structlog
from langchain_core.messages import HumanMessage, SystemMessage
from pydantic import BaseModel, Field as PydanticField

from app.core.config import get_settings
from app.core.llm import ainvoke_structured, sonnet

logger = structlog.get_logger(__name__)


# ─── Resultado público ──────────────────────────────────────────────────────


@dataclass
class TranscricaoResult:
    transcricao: str
    humor_estimado: int | None          # 1-10 ou None se não inferível
    emocao_predominante: str            # "neutro" | "ansioso" | "triste" | etc.
    tags_sugeridas: list[str] = field(default_factory=list)
    sintomas_detectados: list[str] = field(default_factory=list)


# ─── Schema de saída do LLM ────────────────────────────────────────────────


class AnaliseVozOutput(BaseModel):
    humor_estimado: int | None = PydanticField(
        None,
        ge=1,
        le=10,
        description="Pontuação 1-10 baseada no que o paciente descreveu. "
        "Retornar null se o paciente não mencionar estado emocional.",
    )
    emocao_predominante: str = PydanticField(
        default="neutro",
        description="Emoção dominante em uma palavra em pt-BR: neutro, ansioso, triste, "
        "agitado, esperancoso, frustrado, aliviado, etc.",
    )
    tags_sugeridas: list[str] = PydanticField(
        default_factory=list,
        description="Até 5 palavras-chave curtas em PT-BR sobre temas mencionados. "
        "Ex: ['sono', 'trabalho', 'medicação', 'família']. Sem avaliações.",
    )
    sintomas_detectados: list[str] = PydanticField(
        default_factory=list,
        description="Sintomas que o paciente RELATOU sentir, em linguagem descritiva. "
        "Ex: ['dificuldade para dormir', 'tensão no peito', 'cansaço']. "
        "NÃO interpretar — apenas o que o paciente disse.",
    )


_ANALISE_SYSTEM = """\
Você é um assistente de saúde mental analisando a transcrição de um áudio de diário \
gravado por um paciente psiquiátrico.

PRINCÍPIOS RÍGIDOS:
1. NÃO diagnostique transtorno, fase, episódio ou condição clínica.
2. Identifique SINTOMAS RELATADOS (o que o paciente disse que sente), não interprete clinicamente.
3. NÃO copie trechos verbatim do paciente nos campos de análise — use linguagem descritiva neutra.
4. Humor estimado: 1=extremamente ruim, 10=excelente. Retorne null se não houver menção emocional clara.
5. Tags: até 5 temas curtos em PT-BR — TEMAS, não diagnósticos.
6. Sintomas: frases curtas descrevendo o que o paciente relatou, sem interpretação.

Responda com o JSON estruturado conforme o schema."""


# ─── Entrada pública ───────────────────────────────────────────────────────


async def transcrever_audio(
    audio_bytes: bytes,
    content_type: str,
    paciente_id: uuid.UUID,
) -> TranscricaoResult:
    """Ponto de entrada principal: upload → transcribe → analisa → retorna."""
    settings = get_settings()
    log = logger.bind(service="transcricao", paciente_id=str(paciente_id))

    # 1. Upload para S3 (efêmero)
    s3_key = await asyncio.to_thread(
        _upload_s3, audio_bytes, content_type, paciente_id, settings
    )
    log.info("transcricao.s3_uploaded", s3_key=s3_key, size_bytes=len(audio_bytes))

    try:
        # 2. Amazon Transcribe
        transcricao = await asyncio.to_thread(_transcrever_s3, s3_key, settings)
        log.info("transcricao.done", chars=len(transcricao))
    finally:
        # 3. Delete imediato do S3 (LGPD — áudio não persiste)
        await asyncio.to_thread(_delete_s3, s3_key, settings)
        log.info("transcricao.s3_deleted")

    # 4. Claude Sonnet: análise contextual
    call = await ainvoke_structured(
        sonnet(temperature=0.0),
        AnaliseVozOutput,
        [
            SystemMessage(content=_ANALISE_SYSTEM),
            HumanMessage(content=f"Transcrição do paciente:\n\n{transcricao}"),
        ],
    )
    analise: AnaliseVozOutput = call.parsed  # type: ignore[assignment]
    log.info(
        "transcricao.analise_done",
        humor=analise.humor_estimado,
        emocao=analise.emocao_predominante,
        n_tags=len(analise.tags_sugeridas),
        tokens_in=call.tokens_in,
        tokens_out=call.tokens_out,
    )

    return TranscricaoResult(
        transcricao=transcricao,
        humor_estimado=analise.humor_estimado,
        emocao_predominante=analise.emocao_predominante,
        tags_sugeridas=analise.tags_sugeridas,
        sintomas_detectados=analise.sintomas_detectados,
    )


# ─── Helpers síncronos (executados em thread pool) ─────────────────────────


def _upload_s3(
    audio_bytes: bytes,
    content_type: str,
    paciente_id: uuid.UUID,
    settings,
) -> str:
    """Faz upload do áudio para S3 e retorna a chave."""
    ext = "webm" if "webm" in content_type else "mp4"
    # Chave namespaceada por paciente para facilitar auditoria e lifecycle rules
    key = f"audio-diario/{paciente_id}/{uuid.uuid4().hex}.{ext}"
    s3 = boto3.client("s3", region_name=settings.aws_region)
    s3.put_object(
        Bucket=settings.s3_bucket_audio,
        Key=key,
        Body=audio_bytes,
        ContentType=content_type,
        # Tag para lifecycle rule de 24h (rede de segurança)
        Tagging="auto-delete=true",
    )
    return key


def _transcrever_s3(s3_key: str, settings) -> str:
    """Inicia job no Amazon Transcribe e aguarda conclusão por polling."""
    job_name = f"ca-diario-{uuid.uuid4().hex}"
    s3_uri = f"s3://{settings.s3_bucket_audio}/{s3_key}"
    ext = s3_key.rsplit(".", 1)[-1].lower()
    media_format = "webm" if ext == "webm" else "mp4"

    client = boto3.client("transcribe", region_name=settings.aws_region)
    client.start_transcription_job(
        TranscriptionJobName=job_name,
        LanguageCode="pt-BR",
        MediaFormat=media_format,
        Media={"MediaFileUri": s3_uri},
        Settings={"ShowSpeakerLabels": False},
    )

    deadline = time.monotonic() + settings.transcribe_timeout_s
    while time.monotonic() < deadline:
        time.sleep(settings.transcribe_poll_interval_s)
        resp = client.get_transcription_job(TranscriptionJobName=job_name)
        status: str = resp["TranscriptionJob"]["TranscriptionJobStatus"]

        if status == "COMPLETED":
            transcript_uri: str = resp["TranscriptionJob"]["Transcript"]["TranscriptFileUri"]
            with urllib.request.urlopen(transcript_uri) as r:
                data = json.loads(r.read())
            return data["results"]["transcripts"][0]["transcript"]

        if status == "FAILED":
            reason = resp["TranscriptionJob"].get("FailureReason", "unknown")
            raise RuntimeError(f"Transcribe job falhou: {reason}")

    raise TimeoutError(
        f"Amazon Transcribe não concluiu em {settings.transcribe_timeout_s}s"
    )


def _delete_s3(s3_key: str, settings) -> None:
    s3 = boto3.client("s3", region_name=settings.aws_region)
    s3.delete_object(Bucket=settings.s3_bucket_audio, Key=s3_key)
