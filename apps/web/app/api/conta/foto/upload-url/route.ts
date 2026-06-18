import { NextResponse } from "next/server"
import { gateway, gatewayErrorResponse } from "@/lib/gateway"

export async function POST(req: Request) {
  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: "corpo_invalido" }, { status: 400 })
  try {
    return NextResponse.json(await gateway.post("/api/v1/me/foto/upload-url", body))
  } catch (e) {
    return gatewayErrorResponse(e)
  }
}
