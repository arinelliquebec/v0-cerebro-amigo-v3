import { NextResponse } from "next/server"
import { gateway, GatewayError } from "@/lib/gateway"

// Posts com foto aguardando aprovação (só moderador/owner — gateway valida).
export async function GET() {
  try {
    return NextResponse.json(await gateway.get("/api/v1/rede/moderacao/posts-pendentes"))
  } catch (err) {
    if (err instanceof GatewayError && (err.status === 401 || err.status === 403))
      return NextResponse.json({ error: "não autorizado" }, { status: 403 })
    return NextResponse.json({ error: "erro interno" }, { status: 500 })
  }
}
