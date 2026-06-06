import { NextRequest, NextResponse } from "next/server"
import { gateway, GatewayError } from "@/lib/gateway"

export async function GET(req: NextRequest) {
  const desativados = new URL(req.url).searchParams.get("desativados")
  const path = desativados === "true"
    ? "/api/v1/admin/usuarios?desativados=true"
    : "/api/v1/admin/usuarios"
  try {
    const data = await gateway.get(path)
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
    const data = await gateway.post("/api/v1/admin/usuarios", body)
    return NextResponse.json(data, { status: 201 })
  } catch (err) {
    if (err instanceof GatewayError) {
      if (err.status === 409) return NextResponse.json(err.body, { status: 409 })
      if (err.status === 400) return NextResponse.json(err.body, { status: 400 })
      if (err.status === 401 || err.status === 403)
        return NextResponse.json({ error: "não autorizado" }, { status: err.status })
    }
    return NextResponse.json({ error: "erro interno" }, { status: 500 })
  }
}
