"""Registry de jobs agendados.

Diferente dos `agents/` (analíticos, geram `insights` via LLM), `jobs/` 
são tarefas operacionais agendadas:
- gerador_checkins_medicacao: cria linhas em `checkins` a partir de `prescricoes`
- gerador_questionarios: agenda PHQ-9/GAD-7 periodicamente
- (futuros: limpeza, agregações, etc)

Sem LLM, sem `insights`. Apenas SQL + lógica de agendamento.
"""

from app.jobs.base import BaseJob, JobStats
from app.jobs.gerador_checkins_medicacao import GeradorCheckinsMedicacaoJob
from app.jobs.gerador_questionarios import GeradorQuestionariosJob

# Registry: cada novo job é adicionado aqui e ganha slot no scheduler.
JOB_REGISTRY: dict[str, type[BaseJob]] = {
    GeradorCheckinsMedicacaoJob.name: GeradorCheckinsMedicacaoJob,
    GeradorQuestionariosJob.name: GeradorQuestionariosJob,
}


def get_job(name: str) -> BaseJob:
    cls = JOB_REGISTRY.get(name)
    if cls is None:
        raise KeyError(f"job desconhecido: {name}")
    return cls()


__all__ = ["BaseJob", "JobStats", "JOB_REGISTRY", "get_job"]
