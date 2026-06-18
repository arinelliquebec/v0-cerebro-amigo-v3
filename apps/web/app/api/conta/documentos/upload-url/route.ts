import { NextResponse } from "next/server"
import { gateway, gatewayErrorResponse } from "@/lib/gateway"

// Gera URL de upload presigned (PUT direto no S3). O browser sobe o arquivo
// usando essa URL; depois chama POST /api/conta/documentos para registrar.

export async function POST(req: Request) {
  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: "corpo_invalido" }, { status: 400 })
  try {
    return NextResponse.json(await gateway.post("/api/v1/conta/documentos/upload-url", body))
  } catch (e) {
    return gatewayErrorResponse(e)
  }
}
