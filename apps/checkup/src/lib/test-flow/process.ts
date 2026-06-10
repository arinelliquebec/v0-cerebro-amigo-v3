// Orquestra o fluxo do teste clínico.
// INVARIANTE: o gate de crise é a PRIMEIRA operação após o scoring.
// Nem callAI nem persistAnswers são chamados quando crisisFlag=true.
// Fonte: docs/CRISIS-PROTOCOL.md §1–4.

import type { ScaleResult } from "@/lib/scales/types";

export type FunnelEvent =
  | "test_started"
  | "crisis_routed"
  | "test_completed"
  | "report_generated"
  | "qr_scanned"
  | "doctor_signup_started";

export interface TestFlowDeps {
  callAI: (result: ScaleResult) => Promise<unknown>;
  persistAnswers: (sessionId: string, result: ScaleResult) => Promise<void>;
  recordEvent: (event: FunnelEvent, sessionId: string) => Promise<void>;
}

export type TestFlowOutcome =
  | { type: "crisis"; sessionId: string }
  | { type: "result"; sessionId: string; aiResponse: unknown };

/**
 * Processa as respostas de uma escala e orquestra os efeitos colaterais.
 *
 * @param scoreFn     - Função de scoring da escala (phq9, gad7…)
 * @param answers     - Respostas do usuário (0-based)
 * @param sessionId   - ID de sessão efêmera (anônimo)
 * @param consentGiven - Se o usuário consentiu com persistência (LGPD)
 * @param deps        - Dependências injetadas (facilita testes sem mocks globais)
 */
export async function processTestAnswers(
  scoreFn: (answers: number[]) => ScaleResult,
  answers: number[],
  sessionId: string,
  consentGiven: boolean,
  deps: TestFlowDeps,
): Promise<TestFlowOutcome> {
  const result = scoreFn(answers);

  // ──────────────────────────────────────────────────────
  // CRISIS GATE — executa ANTES de qualquer I/O ou IA.
  // Não move nenhuma linha deste bloco para depois das chamadas abaixo.
  // ──────────────────────────────────────────────────────
  if (result.crisisFlag) {
    // Telemetria mínima: só timestamp + sessão anônima, sem payload de respostas.
    // Fonte: CRISIS-PROTOCOL.md §4.
    await deps.recordEvent("crisis_routed", sessionId);
    return { type: "crisis", sessionId };
  }

  // Só persiste se consentimento explícito (LGPD / CLAUDE.md regra #3).
  if (consentGiven) {
    await deps.persistAnswers(sessionId, result);
  }

  const aiResponse = await deps.callAI(result);

  await deps.recordEvent("test_completed", sessionId);

  return { type: "result", sessionId, aiResponse };
}
