"""Configuração tipada centralizada.

Carrega variáveis de ambiente via pydantic-settings. Todas as configurações
sensíveis (chaves de API, DSN) ficam fora do código.
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

    # ─── Anthropic ───
    anthropic_api_key: SecretStr
    model_haiku: str = "claude-haiku-4-5"
    model_sonnet: str = "claude-sonnet-4-6"

    # ─── LangSmith ───
    langsmith_tracing: bool = True
    langsmith_api_key: SecretStr | None = None
    langsmith_project: str = "cerebro-amigo-dev"
    langsmith_hide_inputs: bool = False
    langsmith_hide_outputs: bool = False
    pii_redaction_enabled: bool = True

    # ─── Postgres ───
    postgres_dsn: SecretStr

    # ─── Auth interna ───
    internal_api_token: SecretStr

    @property
    def is_production(self) -> bool:
        return self.app_env == "production"


@lru_cache
def get_settings() -> Settings:
    """Singleton cacheado das configurações."""
    return Settings()  # type: ignore[call-arg]
