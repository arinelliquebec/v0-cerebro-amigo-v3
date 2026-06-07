"""Testes unitários do catálogo de textos de check-in (checkin_copy.py).

Valida que os textos fixos estão corretos, hashados deterministicamente
e que o fallback genérico funciona para tipos desconhecidos.
"""

from __future__ import annotations

import hashlib

from app.checkin_copy import (
    CHECKIN_COPY,
    CHECKIN_COPY_DEFAULT,
    PushCopy,
    get_copy,
)


class TestPushCopy:
    def test_known_types_present(self) -> None:
        expected = {"humor_diario", "sintomas_semanal", "medicacao_lembrete", "diario_lembrete"}
        assert set(CHECKIN_COPY.keys()) == expected

    def test_all_entries_are_push_copy(self) -> None:
        for tipo, copy in CHECKIN_COPY.items():
            assert isinstance(copy, PushCopy), f"{tipo} is not PushCopy"

    def test_hash_is_deterministic(self) -> None:
        for tipo, copy in CHECKIN_COPY.items():
            expected = hashlib.sha256(
                f"{copy.versao}|{copy.titulo}|{copy.corpo}".encode()
            ).hexdigest()
            assert copy.hash_sha256 == expected, f"Hash mismatch for {tipo}"

    def test_default_hash_is_deterministic(self) -> None:
        d = CHECKIN_COPY_DEFAULT
        expected = hashlib.sha256(
            f"{d.versao}|{d.titulo}|{d.corpo}".encode()
        ).hexdigest()
        assert d.hash_sha256 == expected

    def test_titles_are_non_empty(self) -> None:
        for tipo, copy in CHECKIN_COPY.items():
            assert copy.titulo, f"Empty titulo for {tipo}"
            assert copy.corpo, f"Empty corpo for {tipo}"


class TestGetCopy:
    def test_returns_known_type(self) -> None:
        copy = get_copy("humor_diario")
        assert copy.titulo == "Como você está hoje?"

    def test_returns_default_for_unknown_type(self) -> None:
        copy = get_copy("tipo_inexistente_xyz")
        assert copy is CHECKIN_COPY_DEFAULT
        assert copy.titulo == "Cérebro Amigo"

    def test_medicacao_lembrete(self) -> None:
        copy = get_copy("medicacao_lembrete")
        assert "medicação" in copy.titulo.lower() or "medicação" in copy.corpo.lower()
