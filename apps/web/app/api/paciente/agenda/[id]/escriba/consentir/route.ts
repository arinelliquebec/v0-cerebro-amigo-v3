import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"

const GATEWAY = process.env.API_GATEWAY_URL ?? "http://localhost:5050"

// Paciente consente (POST) / revoga (DELETE) a gravação da teleconsulta p/ o Escriba (LGPD).
async function forward(id: string, method: "POST" | "DELETE") {
  const token = (await cookies()).get("paciente_token")?.value
  if (!token) return NextResponse.json({ erro: "não autenticado" }, { status: 401 })

  const res = await fetch(`${GATEWAY}/api/v1/portal/paciente/agenda/${id}/escriba/consentir`, {
    method,
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  })
  return new NextResponse(res.status === 204 ? null : await res.text(), {
    status: res.status,
    headers: { "Content-Type": res.headers.get("content-type") ?? "application/json" },
  })
}

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return forward(id, "POST")
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return forward(id, "DELETE")
}
