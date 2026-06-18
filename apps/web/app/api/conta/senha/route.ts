import { NextResponse } from "next/server"
import { gateway, gatewayErrorResponse } from "@/lib/gateway"

// Trocar senha do médico logado (verifica a atual no gateway).
export async function POST(req: Request) {
  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: "corpo_invalido" }, { status: 400 })
  try {
    await gateway.post("/api/v1/me/senha", body)
    return new NextResponse(null, { status: 204 })
  } catch (e) {
    return gatewayErrorResponse(e)
  }
}
