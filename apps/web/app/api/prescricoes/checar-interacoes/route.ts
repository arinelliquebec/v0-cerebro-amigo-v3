import { NextResponse } from "next/server"
import { gateway, gatewayErrorResponse } from "@/lib/gateway"

// Segunda barreira de interações/duplicidade (A5). Repassa o corpo ao gateway
// (determinístico, base local). { medicamentos?: string[], pacienteId?: string }
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}))
    const data = await gateway.post("/api/v1/prescricoes/checar-interacoes", body)
    return NextResponse.json(data)
  } catch (err) {
    return gatewayErrorResponse(err)
  }
}
