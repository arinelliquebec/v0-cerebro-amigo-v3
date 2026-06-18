import { NextResponse } from "next/server"
import { gateway, gatewayErrorResponse } from "@/lib/gateway"

// LGPD: registra pedido de exclusão (soft — admin processa). Exige a senha atual
// (reautenticação, ADR-066 review) — encaminha o corpo ao gateway, que valida.
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}))
  try {
    await gateway.post("/api/v1/me/exclusao", body ?? {})
    return new NextResponse(null, { status: 202 })
  } catch (e) {
    return gatewayErrorResponse(e)
  }
}
