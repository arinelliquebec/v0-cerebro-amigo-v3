import { NextResponse } from "next/server"
import { gateway, gatewayErrorResponse } from "@/lib/gateway"

// Modo demo (item 2): popula a conta do médico com pacientes de exemplo (1 clique).
export async function POST() {
  try {
    const data = await gateway.post("/api/v1/seed/demo", {})
    return NextResponse.json(data)
  } catch (err) {
    return gatewayErrorResponse(err)
  }
}
