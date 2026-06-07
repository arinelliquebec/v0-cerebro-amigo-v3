import { describe, it, expect } from "vitest"
import { PROMPTS_TRAVADOS, promptTravado } from "@/lib/prompts-guard"

describe("PROMPTS_TRAVADOS", () => {
  it("contains the clinical safety prompts", () => {
    expect(PROMPTS_TRAVADOS.has("orchestrator:crisis_detection")).toBe(true)
    expect(PROMPTS_TRAVADOS.has("orchestrator:audit")).toBe(true)
  })

  it("does not contain arbitrary prompts", () => {
    expect(PROMPTS_TRAVADOS.has("orchestrator:response_generation")).toBe(false)
  })
})

describe("promptTravado", () => {
  it("returns true for locked prompts", () => {
    expect(promptTravado("orchestrator", "crisis_detection")).toBe(true)
    expect(promptTravado("orchestrator", "audit")).toBe(true)
  })

  it("returns false for unlocked prompts", () => {
    expect(promptTravado("orchestrator", "response_generation")).toBe(false)
    expect(promptTravado("agents", "resumo")).toBe(false)
  })

  it("returns false for empty inputs", () => {
    expect(promptTravado("", "")).toBe(false)
  })
})
