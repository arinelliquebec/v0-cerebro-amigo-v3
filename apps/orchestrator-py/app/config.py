"""Configuração tipada centralizada.

Carrega variáveis de ambiente via pydantic-settings. Autenticação AWS
via IAM role (produção) ou AWS_PROFILE (dev local) — sem ANTHROPIC_API_KEY.
"""

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

    # ─── App ───
    app_env: Literal["development", "staging", "production"] = "development"
    log_level: str = "INFO"
    frontend_url: str = "http://localhost:3000"
    shadow_mode: bool = Field(
        default=False,
        description="Se True, processa toda a conversa mas NÃO envia ao paciente. "
        "Usado na fase de validação shadow contra o orchestrator Go.",
    )
    max_retry_audit: int = 2

    # ─── AWS Bedrock (sem ANTHROPIC_API_KEY — auth via IAM role) ───
    aws_region: str = "sa-east-1"
    bedrock_region: str = "sa-east-1"
    bedrock_model_haiku: str = "anthropic.claude-haiku-4-5-20251001-v1:0"
    bedrock_model_sonnet: str = "anthropic.claude-sonnet-4-6-20251001-v1:0"
    bedrock_model_opus: str = "anthropic.claude-opus-4-8"

    # ─── LangSmith ───
    langsmith_tracing: bool = True
    langsmith_api_key: SecretStr | None = None
    langsmith_project: str = "cerebro-amigo-v3"
    langsmith_hide_inputs: bool = False
    langsmith_hide_outputs: bool = False
    pii_redaction_enabled: bool = True

    # ─── Postgres ─── URL format: postgresql://user:pass@host/db
    postgres_dsn: SecretStr = Field(validation_alias="POSTGRES_DSN_URL")

    # ─── Auth interna ───
    internal_api_token: SecretStr

    @property
    def is_production(self) -> bool:
        return self.app_env == "production"


@lru_cache
def get_settings() -> Settings:
    """Singleton cacheado das configurações."""
    return Settings()  # type: ignore[call-arg]
