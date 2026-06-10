// src/lib/scales/gad7.ts
// GAD-7 — versão brasileira. TODO(validar): conferir contra a versão validada
// (Moreno et al.) e marcar validated: true.

import type { Scale, ScaleResult } from "./types";

export const gad7: Scale = {
  id: "gad7",
  name: "GAD-7",
  timeframe: "últimas 2 semanas",
  instructions:
    "Durante as últimas 2 semanas, com que frequência você foi incomodado(a) pelos problemas abaixo?",
  options: [
    { value: 0, label: "Nenhuma vez" },
    { value: 1, label: "Vários dias" },
    { value: 2, label: "Mais da metade dos dias" },
    { value: 3, label: "Quase todos os dias" },
  ],
  items: [
    { index: 1, text: "Sentir-se nervoso(a), ansioso(a) ou muito tenso(a)" },
    { index: 2, text: "Não ser capaz de impedir ou de controlar as preocupações" },
    { index: 3, text: "Preocupar-se muito com diversas coisas" },
    { index: 4, text: "Dificuldade para relaxar" },
    { index: 5, text: "Ficar tão agitado(a) que se torna difícil permanecer sentado(a)" },
    { index: 6, text: "Ficar facilmente aborrecido(a) ou irritado(a)" },
    { index: 7, text: "Sentir medo como se algo horrível fosse acontecer" },
  ],
  bands: [
    { min: 0,  max: 4,  band: "minimal",  bandLabel: "sintomas mínimos" },
    { min: 5,  max: 9,  band: "mild",     bandLabel: "sintomas leves" },
    { min: 10, max: 14, band: "moderate", bandLabel: "sintomas moderados" },
    { min: 15, max: 21, band: "severe",   bandLabel: "sintomas graves" },
  ],
  validated: false, // TODO(validar): conferir itens contra Moreno AL et al.
  source: "GAD-7 versão brasileira (Moreno AL et al.)",
};

export function scoreGad7(answers: number[]): ScaleResult {
  if (answers.length !== gad7.items.length) {
    throw new Error(
      `GAD-7 espera ${gad7.items.length} respostas, recebeu ${answers.length}`
    );
  }
  for (let i = 0; i < answers.length; i++) {
    const v = answers[i];
    if (!Number.isInteger(v) || v < 0 || v > 3) {
      throw new Error(
        `GAD-7 item ${i + 1}: resposta inválida ${v} (esperado 0–3)`
      );
    }
  }

  const totalScore = answers.reduce((sum, v) => sum + v, 0);

  const band = gad7.bands.find((b) => totalScore >= b.min && totalScore <= b.max);
  if (!band) {
    throw new Error(`GAD-7: escore ${totalScore} fora das faixas definidas`);
  }

  return {
    scaleId: "gad7",
    answers,
    totalScore,
    band: band.band,
    bandLabel: band.bandLabel,
    crisisFlag: false, // GAD-7 não tem item de crise
  };
}
