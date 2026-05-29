/**
 * Cliente tipado para o api-gateway .NET.
 * Lê o cookie auth_token e encaminha como Bearer.
 * Usado somente em Route Handlers (server-side) — nunca expõe a URL do gateway ao browser.
 */

import { cookies } from "next/headers"

const GATEWAY = process.env.API_GATEWAY_URL ?? "http://localhost:5050"

export class GatewayError extends Error {
  constructor(
    public status: number,
    public body: unknown,
  ) {
    super(`Gateway ${status}`)
  }
}

async function request<T>(
  path: string,
  init: RequestInit = {},
  token?: string,
): Promise<T> {
  const cookieStore = await cookies()
  const bearer = token ?? cookieStore.get("auth_token")?.value

  const res = await fetch(`${GATEWAY}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(bearer ? { Authorization: `Bearer ${bearer}` } : {}),
      ...(init.headers as Record<string, string> | undefined),
    },
  })

  if (!res.ok) {
    let body: unknown
    try { body = await res.json() } catch { body = null }
    throw new GatewayError(res.status, body)
  }

  return res.json() as Promise<T>
}

export const gateway = {
  post: <T>(path: string, body: unknown, token?: string) =>
    request<T>(path, { method: "POST", body: JSON.stringify(body) }, token),
  get: <T>(path: string) => request<T>(path, { method: "GET" }),
}
