"use server"

import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { gateway, GatewayError } from "@/lib/gateway"

interface GatewayLoginResponse {
  token: string
  nome: string
  role: string
}

export interface LoginState {
  error: string | null
  next?: string
}

export async function loginAction(
  _prevState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const email = formData.get("email") as string
  const senha = formData.get("senha") as string

  if (!email || !senha) {
    return { error: "Email e senha são obrigatórios" }
  }

  try {
    const data = await gateway.post<GatewayLoginResponse>(
      "/api/v1/auth/login",
      { email, senha },
    )

    const cookieStore = await cookies()
    cookieStore.set("auth_token", data.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 8, // 8h
    })
  } catch (err) {
    if (err instanceof GatewayError) {
      if (err.status === 409) {
        const body = err.body as { error?: string }
        if (body?.error === "wrong_portal") {
          return { error: "Este email pertence ao portal do paciente. Acesse /p/entrar" }
        }
      }
      if (err.status === 401) {
        return { error: "Email ou senha incorretos" }
      }
    }
    return { error: "Erro de conexão. Tente novamente." }
  }

  redirect("/dashboard")
}
