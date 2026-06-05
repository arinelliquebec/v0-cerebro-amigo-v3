import { NextRequest, NextResponse } from "next/server"
import { gateway, GatewayError } from "@/lib/gateway"

// Cria post com foto (entra na fila de aprovação do admin).
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  if (!Array.isArray(body?.midias) || body.midias.length === 0)
    return NextResponse.json({ error: "sem_foto" }, { status: 400 })
  try {
    return NextResponse.json(
      await gateway.post("/api/v1/rede/posts/com-foto", {
        corpo: body.corpo ?? "",
        comunidadeId: body.comunidadeId ?? null,
        midias: body.midias,
      }),
      { status: 201 },
    )
  } catch (err) {
    if (err instanceof GatewayError && [400, 403, 422].includes(err.status))
      return NextResponse.json(err.body, { status: err.status })
    return NextResponse.json({ error: "erro interno" }, { status: 500 })
  }
}
