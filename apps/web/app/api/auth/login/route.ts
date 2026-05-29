import { NextRequest, NextResponse } from "next/server"
import { gateway, GatewayError } from "@/lib/gateway"

interface GatewayLoginResponse {
  token: string
  nome: string
  role: string
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  if (!body?.email || !body?.senha) {
    return NextResponse.json({ error: "email e senha obrigatórios" }, { status: 400 })
  }

  try {
    const data = await gateway.post<GatewayLoginResponse>(
      "/api/v1/auth/login",
      { email: body.email, senha: body.senha },
    )

    const res = NextResponse.json({ nome: data.nome, role: data.role })
    res.cookies.set("auth_token", data.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 8, // 8h — igual ao TTL do token médico
    })
    return res
  } catch (err) {
    if (err instanceof GatewayError) {
      if (err.status === 409) return NextResponse.json(err.body, { status: 409 })
      if (err.status === 401) return NextResponse.json({ error: "credenciais inválidas" }, { status: 401 })
    }
    return NextResponse.json({ error: "erro interno" }, { status: 500 })
  }
}
