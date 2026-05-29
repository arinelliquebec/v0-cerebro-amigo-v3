import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { randomUUID } from 'crypto'
import { proxyFetch, isGatewayError } from '@/lib/api-gateway'

/**
 * BFF para o chat conversacional do paciente.
 *
 * - Lê JWT do cookie `paciente_token`
 * - Envia mensagem pro api-gateway `/api/portal/conversation/message`
 * - Faz pass-through do stream SSE com headers corretos
 *
 * Esperado do upstream: stream com `event: node` (nós do grafo LangGraph)
 * e `event: token` (deltas de tokens do agente).
 */
export async function POST(req: Request) {
  const cookieStore = await cookies()
  const token = cookieStore.get('paciente_token')?.value
  if (!token) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  // Lê o body do client (mensagem)
  const clientBody = await req.json().catch(() => ({}))

  // Sobrescreve/injeta idempotencyKey gerado server-side (UUID v4 garantido).
  // Evita problemas com clients sem crypto.randomUUID (HTTP sem secure context).
  const upstreamBody = {
    mensagem: clientBody.mensagem ?? '',
    idempotencyKey: randomUUID(),
  }
  const body = JSON.stringify(upstreamBody)

  const apiRes = await proxyFetch('/api/portal/conversation/message', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'text/event-stream',
      Authorization: `Bearer ${token}`,
    },
    body,
  })

  if (isGatewayError(apiRes)) return apiRes

  if (!apiRes.ok) {
    const errBody = await apiRes.text().catch(() => '')
    return NextResponse.json(
      { error: 'upstream_failed', detail: errBody.slice(0, 500) },
      { status: apiRes.status },
    )
  }

  // Stream pass-through nativo: passa o body do upstream direto
  return new Response(apiRes.body, {
    status: 200,
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'X-Accel-Buffering': 'no',
    },
  })
}
