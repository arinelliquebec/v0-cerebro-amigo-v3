"""Base class para jobs operacionais agendados.

Diferente do `BaseAgent`, `BaseJob` não gera insights e não usa LLM.
Cada job é uma tarefa periódica que opera apenas em SQL + lógica de
agendamento (ex.: criar checkins futuros a partir de prescrições).

Cada job implementa apenas `run_once()`. A base registra
`agente_execucoes` para auditoria (mesma tabela que agents usa, com
`agente='job:nome'`).
"""

from __future__ import annotations

import abc
from dataclasses import asdict, dataclass, field
from typing import Any, ClassVar

import structlog

from app.core.db import acquire

logger = structlog.get_logger(__name__)


@dataclass
class JobStats:
    """Estatísticas de execução. Cada job estende com campos próprios."""

    rodou_em: str = ""
    sucesso: bool = True
    extras: dict[str, Any] = field(default_factory=dict)

    def as_dict(self) -> dict[str, Any]:
        return asdict(self)


class BaseJob(abc.ABC):
    """Tarefa operacional agendada. Sem LLM, sem insights."""

    name: ClassVar[str]

    @abc.abstractmethod
    async def run_once(self) -> dict[str, Any]:
        """Executa um ciclo. Retorna stats para o logger."""
        raise NotImplementedError

    async def _audit_execucao(
        self, stats: dict[str, Any], sucesso: bool, erro: str | None = None
    ) -> None:
        """Audit trail em `agente_execucoes` com agente='job:<nome>'.

        Mantém uma única tabela de auditoria para agents+jobs.
        """
        agente_label = f"job:{self.name}"
        try:
            async with acquire() as conn:
                await conn.execute(
                    """
                    INSERT INTO agente_execucoes 
                        (agente, paciente_id, concluido_em, sucesso, erro)
                    VALUES ($1, NULL, NOW(), $2, $3)
                    """,
                    agente_label,
                    sucesso,
                    erro,
                )
        except Exception as exc:
            # Audit failure não deve quebrar o job
            logger.warning("job.audit_failed", job=self.name, error=str(exc))
