// src/lib/scales/phq9.ts
// PHQ-9 — versão brasileira. Itens preenchidos a partir da versão validada
// (Santos et al., 2013). TODO(validar): conferir caractere a caractere contra a
// publicação e então marcar validated: true. Enquanto false, não usar em produção.

import type { Scale, ScaleResult } from "./types";

export const phq9: Scale = {
  id: "phq9",
  name: "PHQ-9",
  timeframe: "últimas 2 semanas",
  instructions:
    "Durante as últimas 2 semanas, com que frequência você foi incomodado(a) por qualquer um dos problemas abaixo?",
  options: [
    { value: 0, label: "Nenhuma vez" },
    { value: 1, label: "Vários dias" },
    { value: 2, label: "Mais da metade dos dias" },
    { value: 3, label: "Quase todos os dias" },
  ],
  items: [
    { index: 1, text: "Pouco interesse ou pouco prazer em fazer as coisas" },
    { index: 2, text: "Se sentir \"para baixo\", deprimido(a) ou sem perspectiva" },
    { index: 3, text: "Dificuldade para pegar no sono ou permanecer dormindo, ou dormir mais do que de costume" },
    { index: 4, text: "Se sentir cansado(a) ou com pouca energia" },
    { index: 5, text: "Falta de apetite ou comendo demais" },
    { index: 6, text: "Se sentir mal consigo mesmo(a) — ou achar que você é um fracasso ou que decepcionou sua família ou você mesmo(a)" },
    { index: 7, text: "Dificuldade para se concentrar nas coisas, como ler o jornal ou ver televisão" },
    { index: 8, text: "Lentidão para se movimentar ou falar a ponto das outras pessoas perceberem, ou o oposto: estar tão agitado(a) ou irrequieto(a) que você fica andando de um lado para o outro mais do que de costume" },
    { index: 9, text: "Pensar em se ferir de alguma maneira ou que seria melhor estar morto(a)", isCrisisItem: true },
  ],
  bands: [
    { min: 0,  max: 4,  band: "minimal",           bandLabel: "sintomas mínimos" },
    { min: 5,  max: 9,  band: "mild",               bandLabel: "sintomas leves" },
    { min: 10, max: 14, band: "moderate",            bandLabel: "sintomas moderados" },
    { min: 15, max: 19, band: "moderately_severe",   bandLabel: "sintomas moderadamente graves" },
    { min: 20, max: 27, band: "severe",              bandLabel: "sintomas graves" },
  ],
  validated: false, // TODO(validar): conferir itens contra Santos IS et al., Cad. Saúde Pública, 2013
  source: "PHQ-9 versão brasileira (Santos IS et al., Cad. Saúde Pública, 2013)",
};

export function scorePhq9(answers: number[]): ScaleResult {
  if (answers.length !== phq9.items.length) {
    throw new Error(
      `PHQ-9 espera ${phq9.items.length} respostas, recebeu ${answers.length}`
    );
  }
  for (let i = 0; i < answers.length; i++) {
    const v = answers[i];
    if (!Number.isInteger(v) || v < 0 || v > 3) {
      throw new Error(
        `PHQ-9 item ${i + 1}: resposta inválida ${v} (esperado 0–3)`
      );
    }
  }

  const totalScore = answers.reduce((sum, v) => sum + v, 0);

  // item 9 (índice 8) > 0 dispara fluxo de crise antes de qualquer resultado
  // Fonte: docs/CRISIS-PROTOCOL.md §1, src/lib/scales/CLAUDE.md §PHQ-9
  const crisisFlag = answers[8] > 0;

  const band = phq9.bands.find((b) => totalScore >= b.min && totalScore <= b.max);
  if (!band) {
    throw new Error(`PHQ-9: escore ${totalScore} fora das faixas definidas`);
  }

  return {
    scaleId: "phq9",
    answers,
    totalScore,
    band: band.band,
    bandLabel: band.bandLabel,
    crisisFlag,
  };
}
