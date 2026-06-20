"""Escriba clínico (Ambient Scribe, ADR-040): áudio da teleconsulta → transcrição
diarizada → rascunho FACTUAL para o médico revisar.

Reusa o pipeline efêmero do Diário de Voz (S3 → Amazon Transcribe → delete; o áudio
NUNCA persiste). Diferenças:
  - Diarização (ShowSpeakerLabels) separa Locutor 1 / Locutor 2 (não assume quem é médico).
  - O rascunho é FACTUAL (regra #1 clinical-safety): relato do paciente, temas, medicações
    MENCIONADAS, fatos. NÃO gera diagnóstico, CID, avaliação, dose nem plano — isso é do médico.
  - `mencao_risco` é observação factual ("o paciente mencionou risco?"), não dispara protocolo
    de crise patient-facing (regra #2): o rascunho é doctor-facing e o médico estava na consulta.
"""

from __future__ import annotations

import asyncio
import json
import time
import urllib.request
import uuid
from dataclasses import dataclass

import boto3
import structlog
from langchain_core.messages import HumanMessage, SystemMessage
from pydantic import BaseModel
from pydantic import Field as PydanticField

from app.core.config import get_settings
from app.core.llm import ainvoke_structured, sonnet
from app.services.transcricao import _delete_s3, _upload_s3  # reuso do pipeline efêmero

logger = structlog.get_logger(__name__)


# ─── Resultado público ──────────────────────────────────────────────────────


@dataclass
class EscribaResult:
    transcricao: str          # transcrição diarizada (Locutor 1/2)
    rascunho: dict            # rascunho factual (RascunhoFactualOutput serializado)
    mencao_risco: bool        # flag factual p/ o médico


# ─── Schema de saída do LLM (FACTUAL — sem decisão clínica) ─────────────────


class RascunhoFactualOutput(BaseModel):
    resumo_factual: str = PydanticField(
        description="Resumo NEUTRO do que foi dito na consulta, em pt-BR. Apenas fatos "
        "relatados/observados na fala — sem diagnóstico, sem interpretação clínica, sem plano.",
    )
    queixas_relatadas: list[str] = PydanticField(
        default_factory=list,
        description="O que o paciente RELATOU sentir/queixar, em linguagem descritiva. "
        "Ex: ['dificuldade para dormir', 'ansiedade pela manhã']. NÃO interpretar.",
    )
    fatos_relatados: list[str] = PydanticField(
        default_factory=list,
        description="Fatos/eventos que o paciente mencionou. Ex: ['mudou de emprego', "
        "'parou a medicação há 1 semana', 'dorme ~5h']. Só o que foi dito.",
    )
    objetivo: list[str] = PydanticField(
        default_factory=list,
        description="Dados OBJETIVOS ditos EXPLICITAMENTE na consulta: escalas com escore "
        "mencionado (ex: 'PHQ-9 = 12'), exames/resultados citados, sinais vitais citados. "
        "NÃO incluir exame do estado mental nem qualquer inferência (NÃO escreva 'humor "
        "deprimido' a menos que tenha sido dito com essas palavras). Vazio se nada objetivo "
        "foi dito.",
    )
    temas_abordados: list[str] = PydanticField(
        default_factory=list,
        description="Até 6 temas curtos discutidos na consulta. Ex: ['sono', 'trabalho', "
        "'efeitos colaterais']. TEMAS, não diagnósticos.",
    )
    medicacoes_mencionadas: list[str] = PydanticField(
        default_factory=list,
        description="Medicações CITADAS na conversa, como texto, para o MÉDICO confirmar. "
        "Ex: ['Escitalopram', 'Clonazepam SOS']. NÃO é prescrição nem recomendação de dose.",
    )
    mencao_risco: bool = PydanticField(
        default=False,
        description="True SE o paciente mencionou ideação suicida, autoagressão ou risco. "
        "É observação FACTUAL do que foi dito (para o médico revisar), não uma avaliação.",
    )
    sinais_de_alerta: list[str] = PydanticField(
        default_factory=list,
        description="Citações FACTUAIS de menção a risco (ideação suicida, autoagressão, uso "
        "abusivo de substância, abandono de medicação). Só o que foi dito, sem interpretar. "
        "Vazio se não houver.",
    )
    observacoes_para_revisao_medica: str = PydanticField(
        default="",
        description="Contradições, trechos ambíguos ou de baixa confiança na transcrição que o "
        "MÉDICO deve confirmar. Meta-observação sobre a transcrição — NÃO é conteúdo clínico, "
        "diagnóstico nem recomendação. Vazio se não houver.",
    )


_RASCUNHO_SYSTEM = """\
Você é um ESCRIBA clínico. Recebe a transcrição de uma teleconsulta de psiquiatria entre um \
médico e um paciente (rotulados Locutor 1 e Locutor 2) e organiza o que foi DITO num rascunho \
factual para o MÉDICO revisar e completar. O rascunho segue o esqueleto SOAP apenas nas partes \
FACTUAIS (Subjetivo e Objetivo); Avaliação e Plano NÃO são sua tarefa — quem escreve é o médico.

REGRAS RÍGIDAS (inegociáveis):
1. NÃO diagnostique. NÃO sugira CID. NÃO faça avaliação clínica. NÃO sugira conduta, medicação \
   ou ajuste de dose. NÃO escreva plano terapêutico. Isso é decisão do MÉDICO.
2. Apenas ORGANIZE FATOS: o que o paciente relatou, temas abordados, medicações mencionadas \
   (como citação, para o médico confirmar), e eventos relatados.
3. Linguagem neutra e descritiva. Não interprete o que foi dito.
4. Se não houver informação para um campo, deixe-o vazio. Não invente.
5. mencao_risco = true apenas se houver menção explícita de risco (ideação suicida, autoagressão).

GUIA POR CAMPO:
- Subjetivo (resumo_factual, queixas_relatadas, fatos_relatados): o que o PACIENTE relatou. Factual.
- objetivo: SÓ dados objetivos ditos EXPLICITAMENTE (escalas com escore, exames/resultados, sinais \
  vitais). PROIBIDO incluir exame do estado mental ou inferência (ex.: não escreva "humor deprimido" \
  a menos que tenha sido dito literalmente). Vazio se nada objetivo foi dito.
- sinais_de_alerta: citações factuais de menção a risco. Só o que foi dito.
- observacoes_para_revisao_medica: contradições, trechos ambíguos ou de baixa confiança na \
  transcrição para o médico confirmar. NÃO é conteúdo clínico, diagnóstico nem recomendação.

Responda com o JSON estruturado conforme o schema."""


# ─── Entrada pública ───────────────────────────────────────────────────────


async def gerar_rascunho_consulta(
    audio_bytes: bytes,
    content_type: str,
    paciente_id: uuid.UUID,
) -> EscribaResult:
    """upload → transcribe (diarizado) → delete → rascunho factual."""
    settings = get_settings()
    log = logger.bind(service="escriba", paciente_id=str(paciente_id))

    s3_key = await asyncio.to_thread(
        _upload_s3, audio_bytes, content_type, paciente_id, settings
    )
    log.info("escriba.s3_uploaded", s3_key=s3_key, size_bytes=len(audio_bytes))

    try:
        transcricao = await asyncio.to_thread(_transcrever_consulta_s3, s3_key, settings)
        log.info("escriba.transcrito", chars=len(transcricao))
    finally:
        await asyncio.to_thread(_delete_s3, s3_key, settings)
        log.info("escriba.s3_deleted")

    if not transcricao.strip():
        return EscribaResult(transcricao="", rascunho={}, mencao_risco=False)

    call = await ainvoke_structured(
        sonnet(temperature=0.0),
        RascunhoFactualOutput,
        [
            SystemMessage(content=_RASCUNHO_SYSTEM),
            HumanMessage(content=f"Transcrição da teleconsulta:\n\n{transcricao}"),
        ],
    )
    rascunho: RascunhoFactualOutput = call.parsed  # type: ignore[assignment]
    log.info(
        "escriba.rascunho_done",
        n_queixas=len(rascunho.queixas_relatadas),
        mencao_risco=rascunho.mencao_risco,
        tokens_in=call.tokens_in,
        tokens_out=call.tokens_out,
    )

    return EscribaResult(
        transcricao=transcricao,
        rascunho=rascunho.model_dump(),
        mencao_risco=rascunho.mencao_risco,
    )


# ─── Transcribe com diarização ──────────────────────────────────────────────


def _transcrever_consulta_s3(s3_key: str, settings) -> str:
    """Amazon Transcribe com diarização (2 locutores). Reconstrói o texto rotulado."""
    job_name = f"ca-escriba-{uuid.uuid4().hex}"
    s3_uri = f"s3://{settings.s3_bucket_audio}/{s3_key}"
    ext = s3_key.rsplit(".", 1)[-1].lower()
    media_format = "webm" if ext == "webm" else "mp4"

    client = boto3.client("transcribe", region_name=settings.aws_region)
    client.start_transcription_job(
        TranscriptionJobName=job_name,
        LanguageCode="pt-BR",
        MediaFormat=media_format,
        Media={"MediaFileUri": s3_uri},
        Settings={"ShowSpeakerLabels": True, "MaxSpeakerLabels": 2},
    )

    deadline = time.monotonic() + settings.transcribe_timeout_s
    while time.monotonic() < deadline:
        time.sleep(settings.transcribe_poll_interval_s)
        resp = client.get_transcription_job(TranscriptionJobName=job_name)
        status: str = resp["TranscriptionJob"]["TranscriptionJobStatus"]

        if status == "COMPLETED":
            transcript_uri = resp["TranscriptionJob"]["Transcript"]["TranscriptFileUri"]
            with urllib.request.urlopen(transcript_uri) as r:
                data = json.loads(r.read())
            return _montar_transcricao_diarizada(data)

        if status == "FAILED":
            reason = resp["TranscriptionJob"].get("FailureReason", "unknown")
            raise RuntimeError(f"Transcribe job falhou: {reason}")

    raise TimeoutError(f"Amazon Transcribe não concluiu em {settings.transcribe_timeout_s}s")


def _montar_transcricao_diarizada(data: dict) -> str:
    """Reconstrói 'Locutor N: …' a partir do JSON do Transcribe. Sem diarização,
    cai para o transcript simples."""
    results = data.get("results", {})
    if "speaker_labels" not in results:
        transcripts = results.get("transcripts", [])
        return transcripts[0]["transcript"] if transcripts else ""

    spk_por_inicio: dict[str, str] = {}
    for seg in results["speaker_labels"].get("segments", []):
        for it in seg.get("items", []):
            if "start_time" in it:
                spk_por_inicio[it["start_time"]] = it.get("speaker_label", "")

    linhas: list[str] = []
    atual: str | None = None
    buf: list[str] = []
    for it in results.get("items", []):
        if it.get("type") == "punctuation":
            if buf:
                buf[-1] = buf[-1] + it["alternatives"][0]["content"]
            continue
        spk = spk_por_inicio.get(it.get("start_time"))
        palavra = it["alternatives"][0]["content"]
        if spk != atual:
            if buf:
                linhas.append(f"{_rotulo(atual)}: " + " ".join(buf))
            buf = [palavra]
            atual = spk
        else:
            buf.append(palavra)
    if buf:
        linhas.append(f"{_rotulo(atual)}: " + " ".join(buf))
    return "\n".join(linhas)


def _rotulo(spk: str | None) -> str:
    """spk_0 → 'Locutor 1'. Não assume quem é médico/paciente."""
    if not spk:
        return "Locutor"
    try:
        return f"Locutor {int(spk.replace('spk_', '')) + 1}"
    except ValueError:
        return "Locutor"
