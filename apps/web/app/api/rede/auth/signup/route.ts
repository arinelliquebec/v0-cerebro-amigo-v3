import { NextRequest, NextResponse } from "next/server"
import { gateway, GatewayError } from "@/lib/gateway"

interface SignupResp {
  token: string
  nome: string
  role: string
  handle: string
}

// Auto-cadastro de médico externo na rede (valida CRM no gateway). Em sucesso,
// seta o MESMO cookie httpOnly do login → o médico já entra logado.
export async function POST(req: NextRequest) {
  const b = await req.json().catch(() => null)
  if (!b?.nome || !b?.email || !b?.senha || !b?.crm || !b?.uf) {
    return NextResponse.json({ error: "campos_obrigatorios" }, { status: 400 })
  }
  try {
    const data = await gateway.post<SignupResp>("/api/v1/auth/rede/signup", {
      nome: b.nome,
      email: b.email,
      senha: b.senha,
      crm: b.crm,
      uf: b.uf,
    })
    const res = NextResponse.json({ nome: data.nome, role: data.role, handle: data.handle })
    res.cookies.set("auth_token", data.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 8,
    })
    return res
  } catch (err) {
    if (err instanceof GatewayError && [400, 409, 422, 503].includes(err.status)) {
      return NextResponse.json(err.body, { status: err.status })
    }
    return NextResponse.json({ error: "erro interno" }, { status: 500 })
  }
}
