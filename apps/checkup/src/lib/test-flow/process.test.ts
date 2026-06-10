// E2E do fluxo de crise.
// Prova: crisisFlag=true → desvio ocorre antes de callAI e antes de persistAnswers.
// Fonte: docs/CRISIS-PROTOCOL.md §Testes obrigatórios.

import { describe, it, expect, vi, beforeEach } from "vitest";
import { processTestAnswers, type TestFlowDeps } from "./process";
import { scorePhq9 } from "../scales/phq9";
import { scoreGad7 } from "../scales/gad7";

function makeDeps(): { deps: TestFlowDeps; callAI: ReturnType<typeof vi.fn>; persistAnswers: ReturnType<typeof vi.fn>; recordEvent: ReturnType<typeof vi.fn> } {
  const callAI = vi.fn().mockResolvedValue({ ok: true });
  const persistAnswers = vi.fn().mockResolvedValue(undefined);
  const recordEvent = vi.fn().mockResolvedValue(undefined);
  return { deps: { callAI, persistAnswers, recordEvent }, callAI, persistAnswers, recordEvent };
}

const SESSION = "sess-e2e-test";

describe("fluxo de crise — gate pré-IA e pré-persistência", () => {
  describe("PHQ-9 item 9 > 0", () => {
    it("outcome=crisis quando item9=1 (escore mínimo que aciona crise)", async () => {
      const { deps, callAI, persistAnswers } = makeDeps();
      const answers = [0, 0, 0, 0, 0, 0, 0, 0, 1];

      const outcome = await processTestAnswers(scorePhq9, answers, SESSION, true, deps);

      expect(outcome.type).toBe("crisis");
      // Prova: callAI NÃO chamado antes do desvio
      expect(callAI).not.toHaveBeenCalled();
      // Prova: persistAnswers NÃO chamado antes do desvio
      expect(persistAnswers).not.toHaveBeenCalled();
    });

    it("outcome=crisis quando item9=3 e todos outros itens=3 (escore máximo)", async () => {
      const { deps, callAI, persistAnswers } = makeDeps();
      const answers = [3, 3, 3, 3, 3, 3, 3, 3, 3];

      const outcome = await processTestAnswers(scorePhq9, answers, SESSION, true, deps);

      expect(outcome.type).toBe("crisis");
      expect(callAI).not.toHaveBeenCalled();
      expect(persistAnswers).not.toHaveBeenCalled();
    });

    it("recordEvent('crisis_routed') chamado exatamente uma vez com sessionId", async () => {
      const { deps, recordEvent } = makeDeps();
      const answers = [0, 0, 0, 0, 0, 0, 0, 0, 2];

      await processTestAnswers(scorePhq9, answers, SESSION, true, deps);

      expect(recordEvent).toHaveBeenCalledTimes(1);
      expect(recordEvent).toHaveBeenCalledWith("crisis_routed", SESSION);
    });

    it("sem consentimento: mesmo assim callAI e persistAnswers NÃO chamados", async () => {
      const { deps, callAI, persistAnswers } = makeDeps();
      const answers = [0, 0, 0, 0, 0, 0, 0, 0, 1];

      const outcome = await processTestAnswers(scorePhq9, answers, SESSION, false, deps);

      expect(outcome.type).toBe("crisis");
      expect(callAI).not.toHaveBeenCalled();
      expect(persistAnswers).not.toHaveBeenCalled();
    });
  });

  describe("PHQ-9 item 9 = 0 — fluxo normal", () => {
    it("callAI e persistAnswers chamados com consentimento", async () => {
      const { deps, callAI, persistAnswers } = makeDeps();
      // score=16, band=moderately_severe, item9=0
      const answers = [2, 2, 2, 2, 2, 2, 2, 2, 0];

      const outcome = await processTestAnswers(scorePhq9, answers, SESSION, true, deps);

      expect(outcome.type).toBe("result");
      expect(callAI).toHaveBeenCalledOnce();
      expect(persistAnswers).toHaveBeenCalledOnce();
    });

    it("callAI chamado, persistAnswers NÃO chamado sem consentimento", async () => {
      const { deps, callAI, persistAnswers } = makeDeps();
      const answers = [1, 1, 1, 1, 1, 1, 1, 1, 0]; // score=8, mild

      await processTestAnswers(scorePhq9, answers, SESSION, false, deps);

      expect(callAI).toHaveBeenCalledOnce();
      expect(persistAnswers).not.toHaveBeenCalled();
    });

    it("recordEvent('test_completed') chamado no fluxo normal", async () => {
      const { deps, recordEvent } = makeDeps();
      const answers = [0, 0, 0, 0, 0, 0, 0, 0, 0];

      await processTestAnswers(scorePhq9, answers, SESSION, true, deps);

      expect(recordEvent).toHaveBeenCalledWith("test_completed", SESSION);
      expect(recordEvent).not.toHaveBeenCalledWith("crisis_routed", SESSION);
    });
  });

  describe("GAD-7 — sem item de crise, sempre fluxo normal", () => {
    it("score máximo: callAI chamado, outcome=result", async () => {
      const { deps, callAI } = makeDeps();
      const answers = [3, 3, 3, 3, 3, 3, 3]; // score=21, severe

      const outcome = await processTestAnswers(scoreGad7, answers, SESSION, false, deps);

      expect(outcome.type).toBe("result");
      expect(callAI).toHaveBeenCalledOnce();
    });
  });
});
