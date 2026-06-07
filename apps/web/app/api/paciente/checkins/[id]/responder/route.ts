import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"

const GATEWAY = process.env.API_GATEWAY_URL ?? "http://localhost:5050"

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const token = (await cookies()).get("paciente_token")?.value
  if (!token) return NextResponse.json({ erro: "não autenticado" }, { status: 401 })
  const { id } = await params
  const body = await req.json().catch(() => ({}))

  try {
    const res = await fetch(
      `${GATEWAY}/api/v1/portal/paciente/checkins/${id}/responder`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ resposta: body?.resposta ?? {} }),
      },
    )
    return new NextResponse(res.status === 204 ? null : await res.text(), {
      status: res.status,
      headers: { "Content-Type": "application/json" },
    })
  } catch {
    return NextResponse.json({ erro: "serviço indisponível" }, { status: 502 })
  }
}
