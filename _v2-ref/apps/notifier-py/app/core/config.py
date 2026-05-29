"""Configuração tipada do notifier-py."""

from functools import lru_cache
from typing import Literal

from pydantic import SecretStr
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
    notifier_mode: Literal["scheduled", "manual"] = "scheduled"
    scheduler_interval_seconds: int = 60

    # DB
    postgres_dsn: SecretStr

    # Auth
    internal_api_token: SecretStr

    # VAPID
    vapid_public_key: str
    vapid_private_key: str
    vapid_subject: str

    # Push tuning
    push_ttl_seconds: int = 3600
    push_urgency: Literal["very-low", "low", "normal", "high"] = "normal"


@lru_cache
def get_settings() -> Settings:
    return Settings()  # type: ignore[call-arg]
