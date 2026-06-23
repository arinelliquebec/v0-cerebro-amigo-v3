import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { proxySinalSSE, proxySinalPOST } from "@/lib/teleconsulta-proxy"
import { isSameOrigin } from "@/lib/same-origin"

// SSE + cookies() já tornam estas rotas dinâmicas (sob cacheComponents não se
// usa `export const dynamic`). GET = recebe (SSE); POST = envia (offer/answer/ICE).
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const token = (await cookies()).get("auth_token")?.value
  return proxySinalSSE(`/api/v1/consultas/${id}/video/sinal`, token)
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  // CSRF (T1-9): cookie de sessão é sameSite=lax e não barra POST cross-site.
  if (!isSameOrigin(req)) {
    return NextResponse.json({ erro: "origem inválida" }, { status: 403 })
  }
  const { id } = await params
  const token = (await cookies()).get("auth_token")?.value
  return proxySinalPOST(`/api/v1/consultas/${id}/video/sinal`, token, await req.text())
}
