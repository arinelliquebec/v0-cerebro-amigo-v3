import { NextResponse } from "next/server"
import { gateway, gatewayErrorResponse } from "@/lib/gateway"

// Lista de cobranças do médico (Fluxo B). ?status filtra.
export async function GET(req: Request) {
  try {
    const status = new URL(req.url).searchParams.get("status") ?? ""
    const data = await gateway.get(`/api/v1/cobrancas${status ? `?status=${encodeURIComponent(status)}` : ""}`)
    return NextResponse.json(data)
  } catch (err) {
    return gatewayErrorResponse(err)
  }
}

// Cria cobrança Pix para um paciente. { pacienteId, valor, descricao?, consultaId?, vencimento? }
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}))
    const data = await gateway.post("/api/v1/cobrancas", body)
    return NextResponse.json(data)
  } catch (err) {
    return gatewayErrorResponse(err)
  }
}
