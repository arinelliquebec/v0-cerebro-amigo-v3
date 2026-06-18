import { NextResponse } from "next/server"
import { gateway, gatewayErrorResponse } from "@/lib/gateway"

// Anônimo: redefine a senha a partir do token do e-mail.
export async function POST(req: Request) {
  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: "corpo_invalido" }, { status: 400 })
  try {
    await gateway.post("/api/v1/auth/redefinir-senha", body)
    return new NextResponse(null, { status: 204 })
  } catch (e) {
    return gatewayErrorResponse(e)
  }
}
