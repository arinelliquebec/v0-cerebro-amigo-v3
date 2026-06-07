import { describe, it, expect } from "vitest"
import { GatewayError, gatewayErrorResponse } from "@/lib/gateway"

describe("GatewayError", () => {
  it("stores status and body", () => {
    const err = new GatewayError(404, { error: "not found" })
    expect(err.status).toBe(404)
    expect(err.body).toEqual({ error: "not found" })
    expect(err.message).toBe("Gateway 404")
  })

  it("is an instance of Error", () => {
    const err = new GatewayError(500, null)
    expect(err).toBeInstanceOf(Error)
  })
})

describe("gatewayErrorResponse", () => {
  it("returns 401 with sessao_expirada for GatewayError 401", async () => {
    const err = new GatewayError(401, null)
    const res = gatewayErrorResponse(err)
    expect(res.status).toBe(401)
    const body = await res.json()
    expect(body).toEqual({ error: "sessao_expirada" })
  })

  it("repasses domain errors (400, 403, 404, 409, 422)", async () => {
    for (const status of [400, 403, 404, 409, 422]) {
      const payload = { error: `err_${status}` }
      const err = new GatewayError(status, payload)
      const res = gatewayErrorResponse(err)
      expect(res.status).toBe(status)
      const body = await res.json()
      expect(body).toEqual(payload)
    }
  })

  it("returns 502 for unknown GatewayError status", async () => {
    const err = new GatewayError(503, { error: "upstream" })
    const res = gatewayErrorResponse(err)
    expect(res.status).toBe(502)
    const body = await res.json()
    expect(body).toEqual({ error: "erro_conexao" })
  })

  it("returns 502 for non-GatewayError", async () => {
    const err = new TypeError("fetch failed")
    const res = gatewayErrorResponse(err)
    expect(res.status).toBe(502)
    const body = await res.json()
    expect(body).toEqual({ error: "erro_conexao" })
  })

  it("returns 502 for null/undefined", async () => {
    const res = gatewayErrorResponse(null)
    expect(res.status).toBe(502)
  })
})
