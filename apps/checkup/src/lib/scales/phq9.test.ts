import { describe, it, expect } from "vitest";
import { scorePhq9 } from "./phq9";

describe("scorePhq9", () => {
  // ────────────────────────────────────────────────
  // Casos canônicos obrigatórios (CLAUDE.md §motor de escalas)
  // ────────────────────────────────────────────────

  describe("tudo-zero", () => {
    it("score=0 → minimal, crisisFlag=false", () => {
      const r = scorePhq9([0, 0, 0, 0, 0, 0, 0, 0, 0]);
      expect(r.totalScore).toBe(0);
      expect(r.band).toBe("minimal");
      expect(r.bandLabel).toBe("sintomas mínimos");
      expect(r.crisisFlag).toBe(false);
      expect(r.scaleId).toBe("phq9");
      expect(r.answers).toHaveLength(9);
    });
  });

  describe("tudo-máximo", () => {
    it("score=27 → severe, crisisFlag=true (item 9 = 3)", () => {
      const r = scorePhq9([3, 3, 3, 3, 3, 3, 3, 3, 3]);
      expect(r.totalScore).toBe(27);
      expect(r.band).toBe("severe");
      expect(r.crisisFlag).toBe(true);
    });
  });

  describe("um caso por faixa de corte", () => {
    it("score=4 → minimal", () => {
      // [1,1,1,1,0,0,0,0,0] = 4; item9=0 → sem crise
      const r = scorePhq9([1, 1, 1, 1, 0, 0, 0, 0, 0]);
      expect(r.totalScore).toBe(4);
      expect(r.band).toBe("minimal");
      expect(r.crisisFlag).toBe(false);
    });

    it("score=5 → mild", () => {
      const r = scorePhq9([1, 1, 1, 1, 1, 0, 0, 0, 0]);
      expect(r.totalScore).toBe(5);
      expect(r.band).toBe("mild");
    });

    it("score=9 (máx mild) → mild", () => {
      // [1,1,2,2,1,1,1,0,0] = 9
      const r = scorePhq9([1, 1, 2, 2, 1, 1, 1, 0, 0]);
      expect(r.totalScore).toBe(9);
      expect(r.band).toBe("mild");
    });

    it("score=10 → moderate", () => {
      // [2,2,2,1,1,1,1,0,0] = 10
      const r = scorePhq9([2, 2, 2, 1, 1, 1, 1, 0, 0]);
      expect(r.totalScore).toBe(10);
      expect(r.band).toBe("moderate");
    });

    it("score=14 (máx moderate) → moderate, item9=0", () => {
      // [2,2,2,2,2,2,0,2,0] = 14; item9(idx8)=0
      const r = scorePhq9([2, 2, 2, 2, 2, 2, 0, 2, 0]);
      expect(r.totalScore).toBe(14);
      expect(r.band).toBe("moderate");
      expect(r.crisisFlag).toBe(false);
    });

    it("score=15 → moderately_severe, item9=0", () => {
      // [2,2,2,2,2,2,2,1,0] = 15
      const r = scorePhq9([2, 2, 2, 2, 2, 2, 2, 1, 0]);
      expect(r.totalScore).toBe(15);
      expect(r.band).toBe("moderately_severe");
      expect(r.crisisFlag).toBe(false);
    });

    it("score=19 (máx moderately_severe) → moderately_severe", () => {
      // [3,3,2,2,2,3,2,2,0] = 19
      const r = scorePhq9([3, 3, 2, 2, 2, 3, 2, 2, 0]);
      expect(r.totalScore).toBe(19);
      expect(r.band).toBe("moderately_severe");
    });

    it("score=20 → severe, item9=0", () => {
      // [3,3,3,2,2,3,2,2,0] = 20
      const r = scorePhq9([3, 3, 3, 2, 2, 3, 2, 2, 0]);
      expect(r.totalScore).toBe(20);
      expect(r.band).toBe("severe");
      expect(r.crisisFlag).toBe(false);
    });
  });

  // ────────────────────────────────────────────────
  // Casos de crise — item 9 (CRISIS-PROTOCOL.md §Gatilho)
  // ────────────────────────────────────────────────
  describe("caso de crise — item 9", () => {
    it("item 9 = 1 com score total baixo (1): crisisFlag=true", () => {
      // Score=1, band=minimal — mas crisisFlag independe do total
      const r = scorePhq9([0, 0, 0, 0, 0, 0, 0, 0, 1]);
      expect(r.crisisFlag).toBe(true);
      expect(r.totalScore).toBe(1);
      expect(r.band).toBe("minimal");
    });

    it("item 9 = 2: crisisFlag=true", () => {
      const r = scorePhq9([0, 0, 0, 0, 0, 0, 0, 0, 2]);
      expect(r.crisisFlag).toBe(true);
    });

    it("item 9 = 3: crisisFlag=true", () => {
      const r = scorePhq9([0, 0, 0, 0, 0, 0, 0, 0, 3]);
      expect(r.crisisFlag).toBe(true);
    });

    it("item 9 = 0 mesmo com score alto (24, severe): crisisFlag=false", () => {
      // [3,3,3,3,3,3,3,3,0] = 24
      const r = scorePhq9([3, 3, 3, 3, 3, 3, 3, 3, 0]);
      expect(r.totalScore).toBe(24);
      expect(r.band).toBe("severe");
      expect(r.crisisFlag).toBe(false);
    });

    it("qualquer combinação dos outros itens + item 9 > 0 → crisisFlag=true", () => {
      // Testa as 4 combinações de valor de item 9 não-zero com itens restantes todos 0
      for (const v of [1, 2, 3] as const) {
        const answers = Array(9).fill(0) as number[];
        answers[8] = v;
        expect(scorePhq9(answers).crisisFlag).toBe(true);
      }
    });
  });

  // ────────────────────────────────────────────────
  // Validação de entrada
  // ────────────────────────────────────────────────
  describe("validação de entrada", () => {
    it("menos de 9 respostas: throw", () => {
      expect(() => scorePhq9([0, 0, 0])).toThrow(/espera 9/);
    });

    it("mais de 9 respostas: throw", () => {
      expect(() => scorePhq9([0, 0, 0, 0, 0, 0, 0, 0, 0, 0])).toThrow(/espera 9/);
    });

    it("resposta = 4 (fora do range): throw", () => {
      expect(() => scorePhq9([0, 0, 0, 0, 0, 0, 0, 0, 4])).toThrow(/inválida/);
    });

    it("resposta = -1: throw", () => {
      expect(() => scorePhq9([-1, 0, 0, 0, 0, 0, 0, 0, 0])).toThrow(/inválida/);
    });
  });
});
