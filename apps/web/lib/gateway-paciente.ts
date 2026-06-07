/**
 * Cliente tipado para o api-gateway no contexto do PACIENTE.
 * Lê o cookie httpOnly `paciente_token` e encaminha como Bearer.
 * Em chamadas anônimas (magic-validar, login) ainda não há cookie — nenhum
 * Bearer é anexado, e a resposta traz o token que o caller grava no cookie.
 * Usado só em Server Actions / Route Handlers — nunca expõe a URL ao browser.
 */

import { cookies } from "next/headers"
import { NextResponse } from "next/server"

const GATEWAY = process.env.API_GATEWAY_URL ?? "http://localhost:5050"

export class GatewayPacienteError extends Error {
  constructor(
    public status: number,
    public body: unknown,
  ) {
    super(`Gateway ${status}`)
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const store = await cookies()
  const bearer = store.get("paciente_token")?.value

  const res = await fetch(`${GATEWAY}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(bearer ? { Authorization: `Bearer ${bearer}` } : {}),
      ...(init.headers as Record<string, string> | undefined),
    },
    cache: "no-store",
  })

  if (!res.ok) {
    let body: unknown
    try {
      body = await res.json()
    } catch {
      body = null
    }
    throw new GatewayPacienteError(res.status, body)
  }

  const text = await res.text()
  return (text ? JSON.parse(text) : null) as T
}

/**
 * Mapeia um erro do gateway-paciente para uma resposta JSON do BFF.
 * 401/403 → "não autenticado"; demais → repassa status + corpo do gateway.
 * Erros de conexão (não-GatewayPacienteError) → 502.
 */
export function gatewayPacienteErrorResponse(err: unknown): Response {
  if (err instanceof GatewayPacienteError) {
    if (err.status === 401 || err.status === 403)
      return NextResponse.json({ erro: "não autenticado" }, { status: 401 })
    return NextResponse.json(err.body ?? { erro: "erro" }, { status: err.status })
  }
  return NextResponse.json({ erro: "erro_conexao" }, { status: 502 })
}

export const gatewayPaciente = {
  get: <T>(path: string) => request<T>(path, { method: "GET" }),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "POST", body: body != null ? JSON.stringify(body) : undefined }),
  patch: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "PATCH", body: body != null ? JSON.stringify(body) : undefined }),
  put: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "PUT", body: body != null ? JSON.stringify(body) : undefined }),
  delete: <T>(path: string) => request<T>(path, { method: "DELETE" }),
}
