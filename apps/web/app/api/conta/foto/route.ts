import { NextResponse } from "next/server"
import { gateway, gatewayErrorResponse } from "@/lib/gateway"

// Confirma a foto após o upload no S3 (grava foto_s3_key).
export async function POST(req: Request) {
  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: "corpo_invalido" }, { status: 400 })
  try {
    await gateway.post("/api/v1/me/foto", body)
    return new NextResponse(null, { status: 204 })
  } catch (e) {
    return gatewayErrorResponse(e)
  }
}
