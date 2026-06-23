import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { isSameOrigin } from "@/lib/same-origin"

const GATEWAY = process.env.API_GATEWAY_URL ?? "http://localhost:5050"

// Proxy SSE da conversa paciente↔IA. paciente_id é derivado do JWT no gateway
// (nunca do body). Repassa o stream sem bufferizar. NÃO loga o conteúdo da
// mensagem (LGPD — dado clínico cru não vai pra log).
export async function POST(req: NextRequest) {
  // CSRF (T1-9): cookie de sessão é sameSite=lax e não barra POST cross-site.
  if (!isSameOrigin(req)) {
    return NextResponse.json({ erro: "origem inválida" }, { status: 403 })
  }
  const token = (await cookies()).get("paciente_token")?.value
  if (!token) return NextResponse.json({ erro: "não autenticado" }, { status: 401 })

  const body = await req.json().catch(() => null)
  const mensagem = typeof body?.mensagem === "string" ? body.mensagem : ""
  if (!mensagem.trim()) {
    return NextResponse.json({ erro: "mensagem obrigatória" }, { status: 400 })
  }
  // idempotencyKey: usa o do cliente ou gera (UUID exigido pelo gateway).
  const idempotencyKey =
    typeof body?.idempotencyKey === "string" && body.idempotencyKey
      ? body.idempotencyKey
      : crypto.randomUUID()

  let upstream: Response
  try {
    upstream = await fetch(`${GATEWAY}/api/portal/conversation/message`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Accept: "text/event-stream",
      },
      body: JSON.stringify({ mensagem, idempotencyKey }),
      cache: "no-store",
    })
  } catch {
    return NextResponse.json({ erro: "serviço indisponível" }, { status: 502 })
  }

  // Erro upstream (não-SSE) → repassa status + corpo.
  if (!upstream.ok || !upstream.body) {
    const text = await upstream.text().catch(() => "")
    return new NextResponse(text || JSON.stringify({ erro: "falha no orquestrador" }), {
      status: upstream.status || 502,
      headers: { "Content-Type": upstream.headers.get("content-type") ?? "application/json" },
    })
  }

  // Passthrough do stream SSE.
  return new NextResponse(upstream.body, {
    status: 200,
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  })
}
