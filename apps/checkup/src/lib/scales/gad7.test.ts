import { describe, it, expect } from "vitest";
import { scoreGad7 } from "./gad7";

describe("scoreGad7", () => {
  // ────────────────────────────────────────────────
  // Casos canônicos obrigatórios (CLAUDE.md §motor de escalas)
  // ────────────────────────────────────────────────

  describe("tudo-zero", () => {
    it("score=0 → minimal, crisisFlag=false", () => {
      const r = scoreGad7([0, 0, 0, 0, 0, 0, 0]);
      expect(r.totalScore).toBe(0);
      expect(r.band).toBe("minimal");
      expect(r.bandLabel).toBe("sintomas mínimos");
      expect(r.crisisFlag).toBe(false);
      expect(r.scaleId).toBe("gad7");
      expect(r.answers).toHaveLength(7);
    });
  });

  describe("tudo-máximo", () => {
    it("score=21 → severe", () => {
      const r = scoreGad7([3, 3, 3, 3, 3, 3, 3]);
      expect(r.totalScore).toBe(21);
      expect(r.band).toBe("severe");
      expect(r.crisisFlag).toBe(false);
    });
  });

  describe("um caso por faixa de corte", () => {
    it("score=4 (máx minimal) → minimal", () => {
      // [1,1,1,1,0,0,0] = 4
      const r = scoreGad7([1, 1, 1, 1, 0, 0, 0]);
      expect(r.totalScore).toBe(4);
      expect(r.band).toBe("minimal");
    });

    it("score=5 → mild", () => {
      const r = scoreGad7([1, 1, 1, 1, 1, 0, 0]);
      expect(r.totalScore).toBe(5);
      expect(r.band).toBe("mild");
    });

    it("score=9 (máx mild) → mild", () => {
      // [2,2,1,1,1,1,1] = 9
      const r = scoreGad7([2, 2, 1, 1, 1, 1, 1]);
      expect(r.totalScore).toBe(9);
      expect(r.band).toBe("mild");
    });

    it("score=10 → moderate", () => {
      // [2,2,2,1,1,1,1] = 10
      const r = scoreGad7([2, 2, 2, 1, 1, 1, 1]);
      expect(r.totalScore).toBe(10);
      expect(r.band).toBe("moderate");
    });

    it("score=14 (máx moderate) → moderate", () => {
      // [2,2,2,2,2,2,2] = 14
      const r = scoreGad7([2, 2, 2, 2, 2, 2, 2]);
      expect(r.totalScore).toBe(14);
      expect(r.band).toBe("moderate");
    });

    it("score=15 → severe", () => {
      // [3,3,3,2,2,1,1] = 15
      const r = scoreGad7([3, 3, 3, 2, 2, 1, 1]);
      expect(r.totalScore).toBe(15);
      expect(r.band).toBe("severe");
    });

    it("score=21 (máx severe) → severe", () => {
      const r = scoreGad7([3, 3, 3, 3, 3, 3, 3]);
      expect(r.totalScore).toBe(21);
      expect(r.band).toBe("severe");
    });
  });

  describe("GAD-7 nunca dispara crisisFlag", () => {
    it("qualquer escore → crisisFlag=false", () => {
      for (const answers of [
        [0, 0, 0, 0, 0, 0, 0],
        [3, 3, 3, 3, 3, 3, 3],
        [1, 2, 3, 2, 1, 2, 3],
      ]) {
        expect(scoreGad7(answers).crisisFlag).toBe(false);
      }
    });
  });

  describe("validação de entrada", () => {
    it("menos de 7 respostas: throw", () => {
      expect(() => scoreGad7([0, 0, 0])).toThrow(/espera 7/);
    });

    it("mais de 7 respostas: throw", () => {
      expect(() => scoreGad7([0, 0, 0, 0, 0, 0, 0, 0])).toThrow(/espera 7/);
    });

    it("resposta = 4 (fora do range): throw", () => {
      expect(() => scoreGad7([0, 0, 0, 0, 0, 0, 4])).toThrow(/inválida/);
    });

    it("resposta negativa: throw", () => {
      expect(() => scoreGad7([-1, 0, 0, 0, 0, 0, 0])).toThrow(/inválida/);
    });
  });
});
