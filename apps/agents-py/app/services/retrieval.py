"""Retrieval semântico (ADR-028) — doctor-facing, retrieval-only.

Devolve TRECHOS CITADOS do corpus (KB global + prontuário do paciente), nunca
conduta gerada (regra clínica #1). Não há passo de LLM aqui — só KNN + hydration.

Tenant (regra #4): o filtro de tenant é SEMPRE a primeira cláusula. Só entram
chunks do médico autenticado (+ KB sentinela global, se pedido). O `medico_id`
vem do JWT validado no gateway — NUNCA do cliente.

ADR-018: chunks sensíveis são pointer-only (`conteudo` NULL). O texto é
re-buscado na fonte e decifrado no read, com o tenant RE-VALIDADO via JOIN em
`pacientes` (defesa contra reatribuição de paciente que deixe o tenant do chunk
defasado).
"""

from __future__ import annotations

import json
from dataclasses import asdict, dataclass
from uuid import UUID

import structlog

from app.core import crypto
from app.core.config import get_settings
from app.core.db import acquire
from app.jobs.indexador_rag import SENTINEL_TENANT
from app.services.embeddings import embed_one, to_pgvector

logger = structlog.get_logger(__name__)

_SNIPPET_MAX = 800  # tamanho do trecho exibido ao médico


@dataclass
class Trecho:
    """Resultado de busca — um trecho citado, com procedência e score."""

    fonte_tipo: str
    fonte_id: str | None
    paciente_id: str | None
    trecho: str
    score: float
    data: str | None

    def as_dict(self) -> dict:
        return asdict(self)


def _enc_key() -> str | None:
    s = get_settings()
    return s.encryption_key.get_secret_value() if s.encryption_key else None


# fonte_tipo → SQL que re-busca o texto JÁ com re-validação de tenant.
# (mensagem liga ao paciente via conversas; as demais por paciente_id = clientes.id.)
_HYDRATE_SQL: dict[str, str] = {
    "mensagem": (
        "SELECT m.conteudo AS txt FROM mensagens m "
        "JOIN conversas c ON c.id = m.conversa_id "
        "JOIN pacientes p ON p.cliente_id = c.cliente_id "
        "WHERE m.id = $1 AND p.medico_responsavel_id = $2"
    ),
    "diario": (
        "SELECT concat_ws(E'\\n', NULLIF(d.titulo, ''), d.conteudo) AS txt "
        "FROM diario_entradas d JOIN pacientes p ON p.cliente_id = d.paciente_id "
        "WHERE d.id = $1 AND p.medico_responsavel_id = $2"
    ),
    "sintoma": (
        "SELECT s.nota AS txt FROM sintomas s "
        "JOIN pacientes p ON p.cliente_id = s.paciente_id "
        "WHERE s.id = $1 AND p.medico_responsavel_id = $2"
    ),
    "evento": (
        "SELECT concat_ws(E'\\n', NULLIF(e.titulo, ''), e.descricao) AS txt "
        "FROM eventos e JOIN pacientes p ON p.cliente_id = e.paciente_id "
        "WHERE e.id = $1 AND p.medico_responsavel_id = $2"
    ),
    "consulta": (
        "SELECT cs.notas AS txt FROM consultas cs "
        "JOIN pacientes p ON p.cliente_id = cs.paciente_id "
        "WHERE cs.id = $1 AND p.medico_responsavel_id = $2"
    ),
}


async def buscar(
    medico_id: UUID,
    *,
    query: str,
    paciente_id: UUID | None = None,
    k: int | None = None,
    fontes: list[str] | None = None,
    incluir_kb: bool = True,
) -> list[Trecho]:
    """Busca semântica doctor-facing.

    - `medico_id`: tenant (do JWT validado no gateway).
    - `paciente_id`: se dado, inclui o prontuário do paciente (+ KB); se None,
      busca só na KB (paciente_id IS NULL) — nunca cruza pacientes.
    - `fontes`: filtra por tipo ('mensagem','diario',...); None = todas.
    - `incluir_kb`: inclui o catálogo global (tenant sentinela).
    """
    s = get_settings()
    k = k or s.rag_top_k

    qvec = to_pgvector(await embed_one(query, input_type="search_query"))
    tenants = [medico_id, SENTINEL_TENANT] if incluir_kb else [medico_id]

    async with acquire() as conn:
        rows = await conn.fetch(
            "SELECT fonte_tipo, fonte_id, paciente_id, conteudo, metadata, "
            "       1 - (embedding <=> $1::vector) AS score "
            "FROM conhecimento "
            "WHERE tenant_id = ANY($2::uuid[]) "          # tenant SEMPRE primeiro
            "  AND (paciente_id IS NULL OR paciente_id = $3) "
            "  AND ($4::text[] IS NULL OR fonte_tipo = ANY($4)) "
            "ORDER BY embedding <=> $1::vector "
            "LIMIT $5",
            qvec, tenants, paciente_id, fontes, k,
        )

        key = _enc_key()
        trechos: list[Trecho] = []
        for r in rows:
            texto = await _hydrate_trecho(conn, r, medico_id, key)
            if texto is None:
                continue  # fonte sumiu ou falhou re-validação de tenant
            meta = r["metadata"] or {}
            if isinstance(meta, str):
                meta = json.loads(meta)
            trechos.append(
                Trecho(
                    fonte_tipo=r["fonte_tipo"],
                    fonte_id=str(r["fonte_id"]) if r["fonte_id"] else None,
                    paciente_id=str(r["paciente_id"]) if r["paciente_id"] else None,
                    trecho=texto[:_SNIPPET_MAX],
                    score=round(float(r["score"]), 4),
                    data=meta.get("data"),
                )
            )

    # PII-safe: loga só contagem/score, nunca a query nem o texto (regra #4).
    logger.info(
        "rag.buscar",
        tenant=str(medico_id),
        paciente=str(paciente_id) if paciente_id else None,
        n=len(trechos),
        top_score=trechos[0].score if trechos else None,
    )
    return trechos


async def _hydrate_trecho(conn, row, medico_id: UUID, key: str | None) -> str | None:
    """Resolve o texto de um chunk.

    KB (conteudo presente, não-PII) → usa direto. Chunk sensível (conteudo NULL)
    → re-busca a fonte COM re-validação de tenant e decifra. Retorna None se a
    fonte não pertence mais a este médico (paciente reatribuído) ou sumiu.
    """
    if row["conteudo"] is not None:
        return row["conteudo"]

    sql = _HYDRATE_SQL.get(row["fonte_tipo"])
    if sql is None or row["fonte_id"] is None:
        return None
    src = await conn.fetchval(sql, row["fonte_id"], medico_id)
    if src is None:
        return None
    return crypto.decrypt(src, key)
