"""Texto FIXO do protocolo de crise — JAMAIS gerado por LLM.

Qualquer alteração aqui exige:
    1) Revisão psiquiátrica documentada (registrar PR aprovado).
    2) Atualização do hash em CRISIS_COPY_VERSION.
    3) Registro na trilha `protocolos_crise_acionados` referenciando a versão.

Conteúdo migrado de `apps/orchestrator/internal/agent/crise.go` — manter
paridade textual até nova revisão clínica.
"""

from __future__ import annotations

import hashlib
from dataclasses import dataclass


@dataclass(frozen=True)
class CrisisCopy:
    versao: str
    texto: str
    hash_sha256: str


def _versionar(versao: str, texto: str) -> CrisisCopy:
    h = hashlib.sha256(texto.encode("utf-8")).hexdigest()
    return CrisisCopy(versao=versao, texto=texto, hash_sha256=h)


# ─── v1 (placeholder — substituir pelo texto revisado em crise.go) ─────────
_TEXTO_V1 = (
    "Recebi sua mensagem e quero que você saiba que ela está sendo levada a "
    "sério agora. Estou avisando sua psiquiatra imediatamente.\n\n"
    "Enquanto isso, se você sente que pode se machucar ou que está em risco, "
    "por favor ligue agora para o CVV no 188 — atendimento 24h gratuito por "
    "voluntários treinados. Se houver risco imediato, vá ao pronto-socorro "
    "mais próximo ou ligue para o SAMU (192).\n\n"
    "Você não precisa lidar com isso sozinho(a). Sua psiquiatra vai te "
    "responder o mais breve possível."
)

CRISIS_COPY = _versionar("v1", _TEXTO_V1)


def texto_protocolo() -> str:
    """Retorna o texto vigente. Sempre logar `CRISIS_COPY.versao` junto."""
    return CRISIS_COPY.texto
