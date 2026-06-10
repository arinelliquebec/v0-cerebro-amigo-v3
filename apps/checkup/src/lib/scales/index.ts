// Barrel do motor de instrumentos.
// VALIDATED_SCALES: apenas escalas prontas para produção (validated: true).
// O fluxo do teste DEVE usar VALIDATED_SCALES, não o array completo.

export { phq9, scorePhq9 } from "./phq9";
export { gad7, scoreGad7 } from "./gad7";
export { asrs18, scoreAsrs18 } from "./asrs18";
export type { Scale, ScaleId, ScaleItem, ScaleResult, ScoreBand, ScoreFn, ResponseOption } from "./types";

import { phq9 } from "./phq9";
import { gad7 } from "./gad7";
import { asrs18 } from "./asrs18";
import type { Scale } from "./types";

export const ALL_SCALES: Scale[] = [phq9, gad7, asrs18];

// Usado pelo fluxo de produção: escalas com itens verificados.
// Enquanto validated: false, a escala não aparece aqui.
export const VALIDATED_SCALES: Scale[] = ALL_SCALES.filter((s) => s.validated);
