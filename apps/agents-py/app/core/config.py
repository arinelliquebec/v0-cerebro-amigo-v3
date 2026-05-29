"""Configuração tipada do agents-py."""

from functools import lru_cache
from typing import Literal

from pydantic import Field, SecretStr
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # App
    app_env: Literal["development", "staging", "production"] = "development"
    log_level: str = "INFO"
    agents_mode: Literal["scheduled", "manual"] = "scheduled"
    scheduler_interval_seconds: int = 300

    # AWS Bedrock (sem ANTHROPIC_API_KEY — auth via IAM role)
    aws_region: str = "sa-east-1"
    bedrock_region: str = "sa-east-1"
    bedrock_model_haiku: str = "anthropic.claude-haiku-4-5-20251001-v1:0"
    bedrock_model_sonnet: str = "anthropic.claude-sonnet-4-6-20251001-v1:0"
    bedrock_model_opus: str = "anthropic.claude-opus-4-8"

    # LangSmith
    langsmith_tracing: bool = True
    langsmith_api_key: SecretStr | None = None
    langsmith_project: str = "cerebro-amigo-v3"
    langsmith_hide_inputs: bool = False
    langsmith_hide_outputs: bool = False
    pii_redaction_enabled: bool = True

    # Postgres — URL format para asyncpg
    postgres_dsn: SecretStr = Field(validation_alias="POSTGRES_DSN_URL")

    # Auth interna
    internal_api_token: SecretStr

    # Resumidor
    resumidor_lead_min_min: int = 30
    resumidor_lead_min_max: int = 120

    # ─── Adesão ────────────────────────────────────────────────────────
    # AVISO: thresholds abaixo são DEFAULTS PROVISÓRIOS para desenvolvimento.
    # Em produção exigem revisão e aprovação da psiquiatra responsável
    # (ver ADR-006). Não são números clínicos validados.

    adesao_janela_dias: int = 30

    # Adesão de medicação: taxa global (% de doses tomadas)
    adesao_threshold_taxa_media: float = 0.70   # < 70% → severidade média
    adesao_threshold_taxa_alta: float = 0.50    # < 50% → severidade alta

    # Doses consecutivas perdidas
    adesao_threshold_consecutivas_media: int = 3   # 3+ perdidas em sequência
    adesao_threshold_consecutivas_alta: int = 5    # 5+ perdidas em sequência

    # Queda na taxa entre primeira e segunda metade da janela (pontos %)
    adesao_threshold_queda_trend_pp: float = 15.0

    # Tolerância para classificar tomada 'pendente' como perdida (horas
    # após horario_previsto)
    adesao_tolerancia_pendente_horas: int = 6

    # Adesão comportamental (independente de medicação)
    adesao_threshold_inatividade_dias: int = 7
    adesao_threshold_queda_engajamento_pct: float = 0.50

    # ─── Risco silencioso ──────────────────────────────────────────────
    # AVISO: thresholds abaixo são DEFAULTS PROVISÓRIOS para desenvolvimento.
    # Em produção exigem revisão e aprovação da psiquiatra responsável
    # (ver ADR-006). Não são números clínicos validados.

    risco_silencioso_threshold_dias_absoluto: int = 14
    risco_silencioso_threshold_p95_multiplicador: float = 1.5
    risco_silencioso_minimo_amostras_historico: int = 5
    risco_silencioso_janela_historico_dias: int = 180
    # Sinais negativos antes do silêncio (graduação)
    risco_silencioso_humor_threshold_baixo: int = 3
    risco_silencioso_ansiedade_threshold_alto: int = 8
    risco_silencioso_janela_crise_recente_dias: int = 30
    risco_silencioso_janela_crise_critica_dias: int = 14

    # ─── Padrões ───────────────────────────────────────────────────────
    # AVISO: thresholds abaixo são DEFAULTS PROVISÓRIOS para desenvolvimento.
    # Em produção exigem revisão e aprovação da psiquiatra responsável
    # (ver ADR-006). Não são números clínicos validados.

    padroes_janela_dias: int = 30
    padroes_minimo_registros: int = 8
    # Tendência (slope linear): unidades por semana, em escala 0-10
    padroes_slope_min_pontos_semana: float = 0.5   # |slope|*7 ≥ 0.5/semana
    padroes_slope_max_p_value: float = 0.10        # p-valor da regressão
    # Step change (quebra entre primeira e segunda metade da janela)
    padroes_step_change_min_diff: float = 1.5      # diferença de médias ≥ 1.5
    padroes_step_change_max_p_value: float = 0.10
    # Volatilidade
    padroes_stddev_threshold_media: float = 2.0    # stddev ≥ 2.0/10 → trigger
    padroes_stddev_threshold_alta: float = 2.8     # stddev ≥ 2.8 → alta

    # ─── Diário ────────────────────────────────────────────────────────

    diario_janela_dias: int = 14
    diario_minimo_entradas: int = 2
    diario_lead_min_min: int = 30   # mesma janela do resumidor
    diario_lead_min_max: int = 120

    # ─── Diário de Voz (Amazon Transcribe + S3) ────────────────────────
    # Bucket em sa-east-1 — deve existir antes de usar a feature.
    # Áudio é deletado do S3 logo após transcrição (LGPD).
    # Lifecycle rule de 24h no bucket como segurança extra.
    s3_bucket_audio: str = "cerebro-amigo-audio-sa-east-1"
    transcribe_poll_interval_s: float = 2.0
    transcribe_timeout_s: float = 120.0


@lru_cache
def get_settings() -> Settings:
    return Settings()  # type: ignore[call-arg]
