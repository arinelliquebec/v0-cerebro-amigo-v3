import { NextRequest, NextResponse } from "next/server"
import { gateway, GatewayError } from "@/lib/gateway"

// Pede a URL presigned (PUT) p/ o navegador subir a foto direto pro S3.
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  if (!body?.contentType) return NextResponse.json({ error: "contentType obrigatório" }, { status: 400 })
  try {
    return NextResponse.json(await gateway.post("/api/v1/rede/posts/foto-presign", { contentType: body.contentType }))
  } catch (err) {
    if (err instanceof GatewayError && [400, 403, 503].includes(err.status))
      return NextResponse.json(err.body, { status: err.status })
    return NextResponse.json({ error: "erro interno" }, { status: 500 })
  }
}
