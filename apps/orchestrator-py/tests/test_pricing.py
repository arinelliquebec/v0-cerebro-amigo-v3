"""Testes unitários do módulo de pricing (pricing.py).

Valida tier_from_model_id, compute_cost e as constantes PRICE_MAP.
"""

from __future__ import annotations

import pytest

from app.conversation.pricing import (
    PRICE_MAP,
    LLMProvider,
    ModelTier,
    compute_cost,
    tier_from_model_id,
)


class TestTierFromModelId:
    def test_haiku(self) -> None:
        assert tier_from_model_id("claude-3-haiku-20240307") == ModelTier.HAIKU

    def test_sonnet(self) -> None:
        assert tier_from_model_id("claude-sonnet-4-6") == ModelTier.SONNET

    def test_opus(self) -> None:
        assert tier_from_model_id("claude-opus-4-6") == ModelTier.OPUS

    def test_bedrock_model_id(self) -> None:
        assert tier_from_model_id("global.anthropic.claude-sonnet-4-6") == ModelTier.SONNET

    def test_none_for_unknown(self) -> None:
        assert tier_from_model_id("gpt-4") is None

    def test_none_for_empty(self) -> None:
        assert tier_from_model_id("") is None

    def test_none_for_none(self) -> None:
        assert tier_from_model_id(None) is None

    def test_case_insensitive(self) -> None:
        assert tier_from_model_id("CLAUDE-HAIKU-3") == ModelTier.HAIKU


class TestPriceMap:
    def test_all_providers_and_tiers_present(self) -> None:
        for provider in LLMProvider:
            for tier in ModelTier:
                key = (provider, tier)
                assert key in PRICE_MAP, f"Missing price for {key}"

    def test_prices_are_positive(self) -> None:
        for key, (inp, out) in PRICE_MAP.items():
            assert inp > 0, f"Non-positive input price for {key}"
            assert out > 0, f"Non-positive output price for {key}"

    def test_output_more_expensive_than_input(self) -> None:
        for key, (inp, out) in PRICE_MAP.items():
            assert out >= inp, f"Output cheaper than input for {key}"


class TestComputeCost:
    def test_basic_cost(self) -> None:
        cost = compute_cost(LLMProvider.ANTHROPIC, "claude-3-haiku-20240307", 1_000_000, 1_000_000)
        assert cost is not None
        assert cost == pytest.approx(1.0 + 5.0)

    def test_zero_tokens(self) -> None:
        cost = compute_cost(LLMProvider.BEDROCK, "claude-sonnet-4-6", 0, 0)
        assert cost == 0.0

    def test_none_tokens(self) -> None:
        cost = compute_cost(LLMProvider.BEDROCK, "claude-sonnet-4-6", None, None)
        assert cost == 0.0

    def test_none_for_unknown_model(self) -> None:
        cost = compute_cost(LLMProvider.ANTHROPIC, "gpt-4", 1000, 1000)
        assert cost is None

    def test_none_for_none_model(self) -> None:
        cost = compute_cost(LLMProvider.ANTHROPIC, None, 1000, 1000)
        assert cost is None

    def test_rounding(self) -> None:
        cost = compute_cost(LLMProvider.ANTHROPIC, "claude-3-haiku-20240307", 1, 1)
        assert cost is not None
        # 1 token at $1/M in + 1 token at $5/M out = 0.000006
        assert cost == pytest.approx(0.000006)

    def test_bedrock_sonnet(self) -> None:
        cost = compute_cost(LLMProvider.BEDROCK, "global.anthropic.claude-sonnet-4-6", 500_000, 200_000)
        assert cost is not None
        # (500_000/1M)*3.0 + (200_000/1M)*15.0 = 1.5 + 3.0 = 4.5
        assert cost == pytest.approx(4.5)
