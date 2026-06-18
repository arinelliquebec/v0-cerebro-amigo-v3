import { NextResponse } from "next/server"
import { gateway, gatewayErrorResponse } from "@/lib/gateway"

// ADR-066 — cofre de documentos do médico. Lista (ambas direções) + registra
// um envio após o upload concluído no S3. Binário nunca passa por aqui.

export async function GET() {
  try {
    return NextResponse.json(await gateway.get("/api/v1/conta/documentos"))
  } catch (e) {
    return gatewayErrorResponse(e)
  }
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: "corpo_invalido" }, { status: 400 })
  try {
    return NextResponse.json(await gateway.post("/api/v1/conta/documentos", body))
  } catch (e) {
    return gatewayErrorResponse(e)
  }
}
