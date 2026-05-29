import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"

const GATEWAY = process.env.API_GATEWAY_URL ?? "http://localhost:5050"

export async function POST(req: NextRequest) {
  const cookieStore = await cookies()
  const token = cookieStore.get("paciente_token")?.value
  if (!token) {
    return NextResponse.json({ erro: "não autenticado" }, { status: 401 })
  }

  let form: FormData
  try {
    form = await req.formData()
  } catch {
    return NextResponse.json({ erro: "body inválido" }, { status: 400 })
  }

  const audio = form.get("audio") as File | null
  if (!audio || audio.size === 0) {
    return NextResponse.json({ erro: "campo 'audio' obrigatório" }, { status: 400 })
  }

  // Encaminha multipart para o gateway (que converte base64 e chama agents-py)
  const gatewayForm = new FormData()
  gatewayForm.append("audio", audio)

  let res: Response
  try {
    res = await fetch(`${GATEWAY}/api/v1/portal/paciente/diario/audio/transcrever`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: gatewayForm,
    })
  } catch {
    return NextResponse.json({ erro: "gateway indisponível" }, { status: 502 })
  }

  const body = await res.text()
  return new NextResponse(body, {
    status: res.status,
    headers: { "Content-Type": "application/json" },
  })
}
