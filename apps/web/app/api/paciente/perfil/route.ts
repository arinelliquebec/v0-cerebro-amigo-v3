import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"

const GATEWAY = process.env.API_GATEWAY_URL ?? "http://localhost:5050"

async function tok() {
  return (await cookies()).get("paciente_token")?.value ?? null
}

export async function GET() {
  const token = await tok()
  if (!token) return NextResponse.json({ erro: "não autenticado" }, { status: 401 })

  try {
    const res = await fetch(`${GATEWAY}/api/v1/portal/paciente/perfil`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    })
    return new NextResponse(await res.text(), {
      status: res.status,
      headers: { "Content-Type": "application/json" },
    })
  } catch {
    return NextResponse.json({ erro: "serviço indisponível" }, { status: 502 })
  }
}

export async function PATCH(req: NextRequest) {
  const token = await tok()
  if (!token) return NextResponse.json({ erro: "não autenticado" }, { status: 401 })
  const body = await req.json().catch(() => ({}))

  try {
    const res = await fetch(`${GATEWAY}/api/v1/portal/paciente/perfil`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ nome: body?.nome ?? null, email: body?.email ?? null }),
    })
    return new NextResponse(res.status === 204 ? null : await res.text(), {
      status: res.status,
      headers: { "Content-Type": "application/json" },
    })
  } catch {
    return NextResponse.json({ erro: "serviço indisponível" }, { status: 502 })
  }
}
