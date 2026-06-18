import { NextResponse } from "next/server"
import { gateway, gatewayErrorResponse } from "@/lib/gateway"

// Anônimo: dispara e-mail de redefinição. Gateway responde 202 sempre (anti-enum).
export async function POST(req: Request) {
  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: "corpo_invalido" }, { status: 400 })
  try {
    await gateway.post("/api/v1/auth/esqueci-senha", body)
    return new NextResponse(null, { status: 202 })
  } catch (e) {
    return gatewayErrorResponse(e)
  }
}
