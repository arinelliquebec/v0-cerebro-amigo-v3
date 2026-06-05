import { NextResponse } from "next/server"
import { gateway, gatewayErrorResponse } from "@/lib/gateway"

export async function GET() {
  try {
    const data = await gateway.get("/api/v1/rede/sugestoes?limite=5")
    return NextResponse.json(data)
  } catch (err) {
    return gatewayErrorResponse(err)
  }
}
