import { NextResponse } from "next/server"
import { gateway, gatewayErrorResponse } from "@/lib/gateway"

// LGPD: baixa os dados de cadastro do médico como JSON (attachment).
export async function GET() {
  try {
    const data = await gateway.get("/api/v1/me/exportar")
    return new NextResponse(JSON.stringify(data, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": 'attachment; filename="meus-dados-cerebro-amigo.json"',
      },
    })
  } catch (e) {
    return gatewayErrorResponse(e)
  }
}
