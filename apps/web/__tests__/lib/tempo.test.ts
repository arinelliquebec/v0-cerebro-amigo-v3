import { describe, it, expect, vi, afterEach } from "vitest"
import { tempoRelativo } from "@/lib/tempo"

describe("tempoRelativo", () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns "sem mensagens" for null', () => {
    expect(tempoRelativo(null)).toBe("sem mensagens")
  })

  it('returns "agora" for timestamps less than 1 minute ago', () => {
    const now = new Date()
    expect(tempoRelativo(now.toISOString())).toBe("agora")
  })

  it("returns minutes for timestamps less than 1 hour ago", () => {
    vi.useFakeTimers()
    const base = new Date("2026-01-15T12:00:00Z")
    vi.setSystemTime(base)
    const thirtyMinAgo = new Date("2026-01-15T11:30:00Z").toISOString()
    expect(tempoRelativo(thirtyMinAgo)).toBe("há 30min")
    vi.useRealTimers()
  })

  it("returns hours for timestamps less than 24 hours ago", () => {
    vi.useFakeTimers()
    const base = new Date("2026-01-15T12:00:00Z")
    vi.setSystemTime(base)
    const fiveHoursAgo = new Date("2026-01-15T07:00:00Z").toISOString()
    expect(tempoRelativo(fiveHoursAgo)).toBe("há 5h")
    vi.useRealTimers()
  })

  it('returns "ontem" for timestamps 24-48 hours ago', () => {
    vi.useFakeTimers()
    const base = new Date("2026-01-15T12:00:00Z")
    vi.setSystemTime(base)
    const yesterday = new Date("2026-01-14T10:00:00Z").toISOString()
    expect(tempoRelativo(yesterday)).toBe("ontem")
    vi.useRealTimers()
  })

  it("returns days for 2-6 days ago", () => {
    vi.useFakeTimers()
    const base = new Date("2026-01-15T12:00:00Z")
    vi.setSystemTime(base)
    const threeDaysAgo = new Date("2026-01-12T10:00:00Z").toISOString()
    expect(tempoRelativo(threeDaysAgo)).toBe("há 3d")
    vi.useRealTimers()
  })

  it("returns formatted date for 7+ days ago", () => {
    vi.useFakeTimers()
    const base = new Date("2026-01-15T12:00:00Z")
    vi.setSystemTime(base)
    const tenDaysAgo = new Date("2026-01-05T12:00:00Z").toISOString()
    const result = tempoRelativo(tenDaysAgo)
    // Should be a date format like "05/01"
    expect(result).toMatch(/\d{2}\/\d{2}/)
    vi.useRealTimers()
  })
})
