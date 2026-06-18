import { NextResponse } from "next/server"
import { cookies } from "next/headers"

const GATEWAY = process.env.API_GATEWAY_URL ?? "http://localhost:5050"

async function tok() {
  return (await cookies()).get("paciente_token")?.value ?? null
}

// GET — verificar consentimento
export async function GET() {
  const token = await tok()
  if (!token) return NextResponse.json({ erro: "não autenticado" }, { status: 401 })
  const res = await fetch(`${GATEWAY}/api/v1/portal/paciente/mensagens-audio/consent`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  return new NextResponse(await res.text(), { status: res.status })
}

// POST — registrar consentimento
export async function POST() {
  const token = await tok()
  if (!token) return NextResponse.json({ erro: "não autenticado" }, { status: 401 })
  const res = await fetch(`${GATEWAY}/api/v1/portal/paciente/mensagens-audio/consent`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  })
  return new NextResponse(null, { status: res.status })
}
