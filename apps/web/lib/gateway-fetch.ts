/**
 * Wrapper de baixo nível para TODA chamada do BFF ao api-gateway (.NET).
 *
 * Único ponto que injeta o header secreto de origem `X-Edge-Auth` (ADR-074):
 * quando `EDGE_AUTH_SECRET` está no ambiente, todo egress BFF→gateway carrega o
 * header e o gateway valida fail-closed. INERTE (no-op) quando a env não está
 * setada → seguro no EC2 atual e em dev (header ausente, gateway não exige).
 *
 * Server-side apenas — nunca expõe a URL do gateway nem o segredo ao browser.
 * Não loga corpo nem header (LGPD — Regra 3). Só repassa init/stream intactos
 * (SSE/proxy seguem funcionando: só adiciona um header de request).
 */
const EDGE_AUTH_SECRET = process.env.EDGE_AUTH_SECRET

export function gatewayFetch(input: string, init: RequestInit = {}): Promise<Response> {
  if (!EDGE_AUTH_SECRET) return fetch(input, init)
  const headers = new Headers(init.headers)
  headers.set("X-Edge-Auth", EDGE_AUTH_SECRET)
  return fetch(input, { ...init, headers })
}
