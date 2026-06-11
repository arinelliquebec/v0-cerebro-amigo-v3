import { describe, it, expect } from "vitest";
import { asrs18, scoreAsrs18 } from "./asrs18";

// Gate de validação: escala com validated=false não pode ser servida.
// ASRS-18 é o caso real — stub deliberado até transcrição do screener oficial.
describe("asrs18 — gate validated:false", () => {
  it("validated é false (escala não pode ir para produção)", () => {
    expect(asrs18.validated).toBe(false);
  });

  it("items está vazio (transcrição pendente)", () => {
    expect(asrs18.items).toHaveLength(0);
  });

  it("scoreAsrs18 lança erro explícito sobre validated:false", () => {
    expect(() => scoreAsrs18([])).toThrow(/validated=false/);
  });

  it("scoreAsrs18 lança para qualquer entrada enquanto não implementado", () => {
    expect(() => scoreAsrs18([0, 1, 2, 3, 0, 1])).toThrow();
  });
});
