import { describe, it, expect } from "vitest";
import { isScaleAvailable } from "./gate";
import { phq9 } from "./phq9";
import { gad7 } from "./gad7";
import { asrs18 } from "./asrs18";
import type { Scale } from "./types";

// Escala mínima para testar o caminho feliz
const MOCK_VALIDATED_SCALE: Scale = {
  id: "phq9",
  name: "Mock",
  timeframe: "2 semanas",
  instructions: "teste",
  options: [{ value: 0, label: "Nenhuma" }],
  items: [{ index: 1, text: "Item 1" }],
  bands: [{ min: 0, max: 1, band: "minimal", bandLabel: "mínimo" }],
  validated: true,
  source: "teste",
};

describe("isScaleAvailable — gate de produção", () => {
  it("phq9: validated=false → BLOQUEADO (aguarda conferência do texto)", () => {
    expect(isScaleAvailable(phq9)).toBe(false);
    expect(phq9.validated).toBe(false); // confirma: ninguém flipou sem revisão
  });

  it("gad7: validated=false → BLOQUEADO (aguarda conferência do texto)", () => {
    expect(isScaleAvailable(gad7)).toBe(false);
    expect(gad7.validated).toBe(false); // confirma: ninguém flipou sem revisão
  });

  it("asrs18: validated=false + items=[] → BLOQUEADO (stub deliberado)", () => {
    expect(isScaleAvailable(asrs18)).toBe(false);
    expect(asrs18.validated).toBe(false);
    expect(asrs18.items).toHaveLength(0);
  });

  it("escala totalmente pronta (validated=true + items preenchidos) → LIBERADA", () => {
    expect(isScaleAvailable(MOCK_VALIDATED_SCALE)).toBe(true);
  });

  it("validated=true mas items=[] → BLOQUEADO (defesa contra stub sem texto)", () => {
    const stub: Scale = { ...MOCK_VALIDATED_SCALE, items: [] };
    expect(isScaleAvailable(stub)).toBe(false);
  });

  it("validated=false mas items preenchidos → BLOQUEADO (texto não conferido)", () => {
    const unverified: Scale = { ...MOCK_VALIDATED_SCALE, validated: false };
    expect(isScaleAvailable(unverified)).toBe(false);
  });
});
