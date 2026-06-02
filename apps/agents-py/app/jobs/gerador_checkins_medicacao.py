"""Gera check-ins de medicação a partir de prescrições ativas.

Algoritmo:
  1. Para cada prescrição ativa com inicio_em <= today e
     (fim_em IS NULL OR fim_em >= today):
  2. Para cada horário no array `prescricoes.horarios`:
  3. Para as próximas 48h (janela de geração):
  4. Se NÃO existe `tomadas_medicacao` para o par
     (prescricao_id, horario_previsto):
       a. INSERT tomadas_medicacao (status='pendente')
       b. INSERT checkins (tipo='medicacao', payload={tomada_id, ...})
         com `agendado_para = horario_previsto` para o dispatcher disparar.

Janela de 48h: gera tomadas futuras com folga, sem encher banco com
linhas distantes no tempo. Roda a cada N segundos (mesmo intervalo
do scheduler) — idempotente via UNIQUE check.

`checkins.tipo='medicacao'` consumido pelo dispatcher do notifier-py,
que pega copy de `checkin_copy.py` (ver notifier-py para texto).
"""

from __future__ import annotations

from datetime import UTC, date, datetime, time, timedelta
from typing import Any, ClassVar

import structlog

from app.core.db import acquire
from app.jobs.base import BaseJob

logger = structlog.get_logger(__name__)

# Janela: gera tomadas até 48h no futuro a partir do tick atual
GERAR_HORAS_NO_FUTURO = 48


class GeradorCheckinsMedicacaoJob(BaseJob):
    """Produtor de check-ins de medicação."""

    name: ClassVar[str] = "gerador_checkins_medicacao"

    async def run_once(self) -> dict[str, Any]:
        log = logger.bind(job=self.name)
        agora = datetime.now(UTC)
        ate = agora + timedelta(hours=GERAR_HORAS_NO_FUTURO)
        today = agora.date()

        stats = {
            "prescricoes_avaliadas": 0,
            "tomadas_criadas": 0,
            "checkins_criados": 0,
            "skipped_ja_existem": 0,
            "erros": 0,
        }

        try:
            async with acquire() as conn:
                # 1. Busca prescrições ativas no intervalo
                prescricoes = await conn.fetch(
                    """
                    SELECT id, paciente_id, medicamento, dose_descricao,
                           horarios, inicio_em, fim_em
                    FROM prescricoes
                    WHERE ativa = TRUE
                      AND inicio_em <= $1
                      AND (fim_em IS NULL OR fim_em >= $1)
                    """,
                    today,
                )

                stats["prescricoes_avaliadas"] = len(prescricoes)

                for p in prescricoes:
                    # 2. Para cada horário do dia atual + amanhã
                    horarios_a_gerar = self._gerar_horarios_na_janela(
                        horarios=list(p["horarios"]),
                        agora=agora,
                        ate=ate,
                        inicio_prescricao=p["inicio_em"],
                        fim_prescricao=p["fim_em"],
                    )

                    for horario_previsto in horarios_a_gerar:
                        # 3. Idempotência: já existe tomada pra esse slot?
                        existe = await conn.fetchval(
                            """
                            SELECT 1 FROM tomadas_medicacao
                            WHERE prescricao_id = $1 
                              AND horario_previsto = $2
                            LIMIT 1
                            """,
                            p["id"],
                            horario_previsto,
                        )
                        if existe:
                            stats["skipped_ja_existem"] += 1
                            continue

                        # 4. Cria tomada
                        try:
                            tomada_id = await conn.fetchval(
                                """
                                INSERT INTO tomadas_medicacao
                                    (prescricao_id, paciente_id, 
                                     horario_previsto, status)
                                VALUES ($1, $2, $3, 'pendente')
                                RETURNING id
                                """,
                                p["id"],
                                p["paciente_id"],
                                horario_previsto,
                            )
                            stats["tomadas_criadas"] += 1
                        except Exception as exc:
                            stats["erros"] += 1
                            log.warning(
                                "tomada.insert_failed",
                                prescricao_id=str(p["id"]),
                                horario=horario_previsto.isoformat(),
                                error=str(exc),
                            )
                            continue

                        # 5. Cria checkin apontando pra tomada
                        try:
                            await conn.execute(
                                """
                                INSERT INTO checkins
                                    (paciente_id, tipo, payload, 
                                     agendado_para, expirado_em)
                                VALUES ($1, 'medicacao', $2::jsonb, $3, $4)
                                """,
                                p["paciente_id"],
                                __import__("json").dumps({
                                    "tomada_id": str(tomada_id),
                                    "prescricao_id": str(p["id"]),
                                    "medicamento": p["medicamento"],
                                    "dose_descricao": p["dose_descricao"],
                                }),
                                horario_previsto,
                                horario_previsto + timedelta(hours=4),  # expira em 4h
                            )
                            stats["checkins_criados"] += 1
                        except Exception as exc:
                            stats["erros"] += 1
                            log.warning(
                                "checkin.insert_failed",
                                tomada_id=str(tomada_id),
                                error=str(exc),
                            )

            log.info("job.done", **stats)
            await self._audit_execucao(stats, sucesso=True)
            return stats

        except Exception as exc:
            log.exception("job.failed", error=str(exc))
            await self._audit_execucao(stats, sucesso=False, erro=str(exc))
            raise

    def _gerar_horarios_na_janela(
        self,
        horarios: list[time],
        agora: datetime,
        ate: datetime,
        inicio_prescricao: date,
        fim_prescricao: date | None,
    ) -> list[datetime]:
        """Gera datetimes na janela [agora, ate] considerando horários por dia.

        Retorna apenas horários DENTRO da janela e da vigência da prescrição.
        Considera UTC; ajustar TZ se necessário antes da produção (TODO).
        """
        out: list[datetime] = []
        cursor_dia = agora.date()
        while cursor_dia <= ate.date():
            # Respeita vigência da prescrição
            if cursor_dia < inicio_prescricao:
                cursor_dia += timedelta(days=1)
                continue
            if fim_prescricao and cursor_dia > fim_prescricao:
                break
            for h in horarios:
                slot = datetime.combine(cursor_dia, h, tzinfo=UTC)
                if agora <= slot <= ate:
                    out.append(slot)
            cursor_dia += timedelta(days=1)
        return out
