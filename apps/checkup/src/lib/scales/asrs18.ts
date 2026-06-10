// src/lib/scales/asrs18.ts
// ASRS-18 v1.1 (OMS) — TDAH adulto, versão brasileira (Mattos P et al., 2006).
//
// ⚠️ STUB DELIBERADO. Não preencher itens nem a tabela de sombreamento de memória.
// Passos para completar (humano + Claude Code juntos):
//   1. Obter o screener oficial em PT-BR (OMS/HCPA) e transcrever os 18 itens.
//   2. Transcrever a tabela de células sombreadas da Parte A (itens 1–6) — os
//      valores que contam como positivos VARIAM por item.
//   3. Preencher shadedValues por item, escrever asrs18.test.ts com casos do
//      manual, e só então validated: true.
// Scoring da Parte A: >= 4 itens positivos ⇒ band "positive" (triagem positiva).

import type { Scale, ScaleResult } from "./types";

export const asrs18: Scale = {
  id: "asrs18",
  name: "ASRS-18 (v1.1)",
  timeframe: "últimos 6 meses",
  instructions:
    "Responda pensando em como você se sentiu e se comportou nos últimos 6 meses.",
  options: [
    { value: 0, label: "Nunca" },
    { value: 1, label: "Raramente" },
    { value: 2, label: "Às vezes" },
    { value: 3, label: "Frequentemente" },
    { value: 4, label: "Muito frequentemente" },
  ],
  items: [], // TODO(validar): transcrever da versão validada
  bands: [
    { min: 0, max: 3, band: "negative", bandLabel: "triagem negativa" },
    { min: 4, max: 6, band: "positive", bandLabel: "triagem positiva" },
  ],
  validated: false,
  source: "ASRS-18 v1.1, versão brasileira (Mattos P et al., Rev Psiq Clín, 2006)",
};

export function scoreAsrs18(answers: number[]): ScaleResult {
  throw new Error("not implemented — ver TODO(validar) acima");
}
