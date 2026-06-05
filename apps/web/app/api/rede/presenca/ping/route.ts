import { NextResponse } from "next/server"
import { gateway, GatewayError } from "@/lib/gateway"

// Heartbeat de presença (chamado pelo cliente ~30s).
export async function POST() {
  try {
    await gateway.post("/api/v1/rede/presenca/ping", {})
    return new NextResponse(null, { status: 204 })
  } catch (err) {
    if (err instanceof GatewayError && (err.status === 401 || err.status === 403))
      return new NextResponse(null, { status: 401 })
    return new NextResponse(null, { status: 500 })
  }
}
