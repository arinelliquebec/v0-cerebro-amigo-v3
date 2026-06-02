import { NextRequest, NextResponse } from "next/server"
import { gateway, GatewayError } from "@/lib/gateway"

export async function GET() {
  try {
    const data = await gateway.get("/api/v1/admin/assinaturas")
    return NextResponse.json(data)
  } catch (err) {
    if (err instanceof GatewayError && (err.status === 401 || err.status === 403))
      return NextResponse.json({ error: "não autorizado" }, { status: err.status })
    return NextResponse.json({ error: "erro interno" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: "corpo inválido" }, { status: 400 })
  try {
    const data = await gateway.post("/api/v1/admin/assinaturas", body)
    return NextResponse.json(data, { status: 201 })
  } catch (err) {
    if (err instanceof GatewayError) {
      if (err.status === 400) return NextResponse.json(err.body, { status: 400 })
      if (err.status === 401 || err.status === 403)
        return NextResponse.json({ error: "não autorizado" }, { status: err.status })
    }
    return NextResponse.json({ error: "erro interno" }, { status: 500 })
  }
}
