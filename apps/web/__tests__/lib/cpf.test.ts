import { describe, it, expect } from "vitest"
import { cpfDigits, cpfMask, cpfValido } from "@/lib/cpf"

describe("cpfDigits", () => {
  it("strips non-digit characters", () => {
    expect(cpfDigits("123.456.789-09")).toBe("12345678909")
  })

  it("returns empty string for empty input", () => {
    expect(cpfDigits("")).toBe("")
  })

  it("keeps digits only from mixed input", () => {
    expect(cpfDigits("abc12def34")).toBe("1234")
  })
})

describe("cpfMask", () => {
  it("formats a full 11-digit CPF", () => {
    expect(cpfMask("12345678909")).toBe("123.456.789-09")
  })

  it("formats a CPF that already has punctuation", () => {
    expect(cpfMask("123.456.789-09")).toBe("123.456.789-09")
  })

  it("partially formats short inputs", () => {
    expect(cpfMask("123")).toBe("123")
    expect(cpfMask("1234")).toBe("123.4")
    expect(cpfMask("1234567")).toBe("123.456.7")
    expect(cpfMask("1234567890")).toBe("123.456.789-0")
  })

  it("truncates to 11 digits maximum", () => {
    expect(cpfMask("123456789012345")).toBe("123.456.789-01")
  })
})

describe("cpfValido", () => {
  it("validates a known-valid CPF", () => {
    expect(cpfValido("529.982.247-25")).toBe(true)
  })

  it("validates a valid CPF without punctuation", () => {
    expect(cpfValido("52998224725")).toBe(true)
  })

  it("rejects a CPF with wrong check digits", () => {
    expect(cpfValido("529.982.247-00")).toBe(false)
  })

  it("rejects CPF with all identical digits", () => {
    expect(cpfValido("111.111.111-11")).toBe(false)
    expect(cpfValido("00000000000")).toBe(false)
  })

  it("rejects CPF with wrong length", () => {
    expect(cpfValido("1234567890")).toBe(false)
    expect(cpfValido("123456789012")).toBe(false)
  })

  it("rejects empty string", () => {
    expect(cpfValido("")).toBe(false)
  })
})
