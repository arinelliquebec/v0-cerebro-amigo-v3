"""Testes unitários do catálogo de textos de lembrete de consulta (consulta_copy.py).

Valida os templates, hashes e interpolação de {quando}.
"""

from __future__ import annotations

import hashlib

from app.consulta_copy import (
    LEMBRETE_COPY,
    LEMBRETE_COPY_DEFAULT,
    LembreteCopy,
    get_lembrete_copy,
)


class TestLembreteCopy:
    def test_known_types_present(self) -> None:
        assert set(LEMBRETE_COPY.keys()) == {"24h", "1h"}

    def test_all_entries_are_lembrete_copy(self) -> None:
        for tipo, copy in LEMBRETE_COPY.items():
            assert isinstance(copy, LembreteCopy), f"{tipo} is not LembreteCopy"

    def test_hash_is_deterministic(self) -> None:
        for tipo, copy in LEMBRETE_COPY.items():
            expected = hashlib.sha256(
                f"{copy.versao}|{copy.titulo}|{copy.corpo_template}".encode()
            ).hexdigest()
            assert copy.hash_sha256 == expected, f"Hash mismatch for {tipo}"

    def test_default_hash_is_deterministic(self) -> None:
        d = LEMBRETE_COPY_DEFAULT
        expected = hashlib.sha256(
            f"{d.versao}|{d.titulo}|{d.corpo_template}".encode()
        ).hexdigest()
        assert d.hash_sha256 == expected

    def test_corpo_interpolation(self) -> None:
        copy = LEMBRETE_COPY["24h"]
        resultado = copy.corpo("15/06 às 14:00")
        assert "15/06 às 14:00" in resultado
        assert "{quando}" not in resultado

    def test_corpo_interpolation_1h(self) -> None:
        copy = LEMBRETE_COPY["1h"]
        resultado = copy.corpo("15/06 às 14:00")
        assert "15/06 às 14:00" in resultado


class TestGetLembreteCopy:
    def test_returns_known_type(self) -> None:
        copy = get_lembrete_copy("24h")
        assert "consulta" in copy.titulo.lower() or "lembrete" in copy.titulo.lower()

    def test_returns_default_for_unknown_type(self) -> None:
        copy = get_lembrete_copy("3h")
        assert copy is LEMBRETE_COPY_DEFAULT

    def test_default_corpo_interpolation(self) -> None:
        copy = get_lembrete_copy("desconhecido")
        resultado = copy.corpo("amanhã às 10:00")
        assert "amanhã às 10:00" in resultado
