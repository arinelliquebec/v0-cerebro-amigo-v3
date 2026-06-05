import { NextResponse } from "next/server"
import { gateway, GatewayError } from "@/lib/gateway"

// Lista de médicos online agora (ping < 60s).
export async function GET() {
  try {
    return NextResponse.json(await gateway.get("/api/v1/rede/presenca/online"))
  } catch (err) {
    if (err instanceof GatewayError && (err.status === 401 || err.status === 403))
      return NextResponse.json([], { status: 200 })
    return NextResponse.json([], { status: 200 })
  }
}
