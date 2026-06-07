import { describe, it, expect } from "vitest"
import { crmDigits, crmMask, crmValido } from "@/lib/crm"

describe("crmDigits", () => {
  it("strips non-alphanumeric characters and uppercases", () => {
    expect(crmDigits("CRM-12345")).toBe("CRM12345")
  })

  it("handles pure numeric input", () => {
    expect(crmDigits("123456")).toBe("123456")
  })

  it("returns empty string for empty input", () => {
    expect(crmDigits("")).toBe("")
  })

  it("removes spaces and hyphens", () => {
    expect(crmDigits("CRM 12-345")).toBe("CRM12345")
  })
})

describe("crmMask", () => {
  it("truncates at 10 alphanumeric characters", () => {
    expect(crmMask("12345678901234")).toBe("1234567890")
  })

  it("uppercases and strips special chars", () => {
    expect(crmMask("crm-1234")).toBe("CRM1234")
  })
})

describe("crmValido", () => {
  it("accepts CRM with 4 to 10 chars", () => {
    expect(crmValido("1234")).toBe(true)
    expect(crmValido("1234567890")).toBe(true)
  })

  it("rejects CRM shorter than 4 chars", () => {
    expect(crmValido("123")).toBe(false)
  })

  it("rejects empty string", () => {
    expect(crmValido("")).toBe(false)
  })

  it("validates with special characters in input (stripped internally)", () => {
    expect(crmValido("CRM-12345")).toBe(true)
  })
})
