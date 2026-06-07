import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"

const GATEWAY = process.env.API_GATEWAY_URL ?? "http://localhost:5050"

async function tok() {
  return (await cookies()).get("paciente_token")?.value ?? null
}

// Histórico de humor (timeline)
export async function GET(req: NextRequest) {
  const token = await tok()
  if (!token) return NextResponse.json({ erro: "não autenticado" }, { status: 401 })
  const dias = req.nextUrl.searchParams.get("dias") ?? "30"

  try {
    const res = await fetch(`${GATEWAY}/api/v1/portal/paciente/humor/historico?dias=${dias}`, {
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

// Registrar humor do dia
export async function POST(req: NextRequest) {
  const token = await tok()
  if (!token) return NextResponse.json({ erro: "não autenticado" }, { status: 401 })
  const b = await req.json().catch(() => null)
  if (typeof b?.humor !== "number") {
    return NextResponse.json({ erro: "humor (1-10) obrigatório" }, { status: 400 })
  }

  try {
    const res = await fetch(`${GATEWAY}/api/v1/portal/paciente/humor`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        humor: b.humor,
        ansiedade: b.ansiedade ?? null,
        sonoHoras: b.sonoHoras ?? null,
        energia: b.energia ?? null,
        nota: b.nota ?? null,
      }),
    })
    return new NextResponse(res.status === 204 ? null : await res.text(), {
      status: res.status,
      headers: { "Content-Type": "application/json" },
    })
  } catch {
    return NextResponse.json({ erro: "serviço indisponível" }, { status: 502 })
  }
}
