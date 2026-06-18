import { NextResponse } from "next/server"
import { cookies } from "next/headers"

const GATEWAY = process.env.API_GATEWAY_URL ?? "http://localhost:5050"

// POST /api/paciente/audio/upload-url — gera presigned PUT para o S3
export async function POST() {
  const token = (await cookies()).get("paciente_token")?.value
  if (!token) return NextResponse.json({ erro: "não autenticado" }, { status: 401 })
  const res = await fetch(`${GATEWAY}/api/v1/portal/paciente/mensagens-audio/upload-url`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  })
  return new NextResponse(await res.text(), { status: res.status })
}
