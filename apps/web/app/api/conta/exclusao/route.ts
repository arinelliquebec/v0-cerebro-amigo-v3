import { NextResponse } from "next/server"
import { gateway, gatewayErrorResponse } from "@/lib/gateway"

// LGPD: registra pedido de exclusão (soft — admin processa).
export async function POST() {
  try {
    await gateway.post("/api/v1/me/exclusao", {})
    return new NextResponse(null, { status: 202 })
  } catch (e) {
    return gatewayErrorResponse(e)
  }
}
