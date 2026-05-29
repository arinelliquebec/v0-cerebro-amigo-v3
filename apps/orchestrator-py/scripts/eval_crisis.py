"""Avaliação do classificador de crise contra o dataset semente.

Uso:
    python scripts/eval_crisis.py --dataset tests/datasets/crisis_examples.jsonl

Sobe os exemplos como dataset no LangSmith (idempotente pelo nome) e
roda evals comparando contra `expected_crise` e `expected_nivel`.

Métricas que importam:
* recall_crise          → não tolerar falso negativo
* precisao_crise        → falso positivo é tolerável mas medimos
* acuracia_nivel        → entre crise=true, acerta o nível?
"""

from __future__ import annotations

import argparse
import asyncio
import json
import os
from pathlib import Path
from typing import Any

from langchain_core.messages import HumanMessage, SystemMessage
from langsmith import Client
from langsmith.evaluation import aevaluate

from app.conversation.llm import haiku, with_schema
from app.conversation.prompts import CRISIS_DETECTION_SYSTEM_V1
from app.conversation.schemas import CrisisDetectionOutput


DATASET_NAME = "cerebro-amigo:crisis-detection-v1"


def _load_examples(path: Path) -> list[dict[str, Any]]:
    out = []
    with path.open() as f:
        for line in f:
            line = line.strip()
            if line:
                out.append(json.loads(line))
    return out


def _ensure_dataset(client: Client, examples: list[dict[str, Any]]) -> None:
    if client.has_dataset(dataset_name=DATASET_NAME):
        print(f"Dataset '{DATASET_NAME}' já existe; pulando upload.")
        return
    ds = client.create_dataset(
        dataset_name=DATASET_NAME,
        description="Mensagens semente para avaliar detecção de crise.",
    )
    client.create_examples(
        dataset_id=ds.id,
        inputs=[{"mensagem": ex["mensagem"]} for ex in examples],
        outputs=[
            {
                "expected_crise": ex["expected_crise"],
                "expected_nivel": ex["expected_nivel"],
            }
            for ex in examples
        ],
    )
    print(f"Dataset '{DATASET_NAME}' criado com {len(examples)} exemplos.")


async def _target(inputs: dict) -> dict:
    llm = with_schema(haiku(), CrisisDetectionOutput)
    result = await llm.ainvoke(
        [
            SystemMessage(content=CRISIS_DETECTION_SYSTEM_V1),
            HumanMessage(content=inputs["mensagem"]),
        ]
    )
    return result.model_dump()


def _eval_crise_match(outputs: dict, reference_outputs: dict) -> bool:
    return outputs["crise_detectada"] == reference_outputs["expected_crise"]


def _eval_nivel_match(outputs: dict, reference_outputs: dict) -> bool:
    # Só avalia quando a referência diz que é crise.
    if not reference_outputs["expected_crise"]:
        return True
    return outputs["nivel"] == reference_outputs["expected_nivel"]


def _eval_no_false_negative(outputs: dict, reference_outputs: dict) -> bool:
    """Métrica de segurança: NUNCA classificar crise real como não-crise."""
    if reference_outputs["expected_crise"]:
        return outputs["crise_detectada"] is True
    return True


async def main(dataset_path: Path) -> None:
    if not os.getenv("LANGSMITH_API_KEY"):
        raise RuntimeError("LANGSMITH_API_KEY ausente; configure antes de rodar evals.")

    client = Client()
    examples = _load_examples(dataset_path)
    _ensure_dataset(client, examples)

    results = await aevaluate(
        _target,
        data=DATASET_NAME,
        evaluators=[_eval_crise_match, _eval_nivel_match, _eval_no_false_negative],
        experiment_prefix="crisis-detect",
        max_concurrency=4,
    )
    print(f"Eval done. View: {results}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--dataset",
        type=Path,
        default=Path("tests/datasets/crisis_examples.jsonl"),
    )
    args = parser.parse_args()
    asyncio.run(main(args.dataset))
