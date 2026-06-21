"use server"

import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { gatewayPaciente, GatewayPacienteError } from "@/lib/gateway-paciente"

export interface PacienteAuthState {
  error: string | null
}

const COOKIE_NAME = "paciente_token"
const COOKIE_OPTS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: 60 * 60 * 24 * 7, // 7 dias — igual ao TTL do JWT do paciente
}

function destinoSeguro(next: FormDataEntryValue | null): string {
  const n = typeof next === "string" ? next : ""
  // só aceita caminhos internos do portal
  return n.startsWith("/p") ? n : "/p"
}

// ─── Convite por magic link: valida token + define senha ───────────────────
export async function entrarComLink(
  _prev: PacienteAuthState,
  formData: FormData,
): Promise<PacienteAuthState> {
  const token = formData.get("token") as string
  const novaSenha = formData.get("novaSenha") as string
  const confirmar = formData.get("confirmar") as string

  if (!token) return { error: "Convite inválido. Peça um novo link ao seu médico." }
  if (!novaSenha || novaSenha.length < 8)
    return { error: "A senha precisa ter pelo menos 8 caracteres." }
  if (novaSenha !== confirmar) return { error: "As senhas não coincidem." }

  try {
    const data = await gatewayPaciente.post<{ token: string }>(
      "/api/v1/auth/paciente/magic-validar",
      { token, novaSenha },
    )
    ;(await cookies()).set(COOKIE_NAME, data.token, COOKIE_OPTS)
  } catch (err) {
    if (err instanceof GatewayPacienteError && err.status === 401)
      return { error: "Este convite expirou ou já foi usado. Peça um novo ao seu médico." }
    return { error: "Não foi possível ativar sua conta. Tente novamente." }
  }

  redirect(destinoSeguro(formData.get("next")))
}

// ─── Esqueci minha senha (anônimo) ─────────────────────────────────────────
// Anti-enumeração: SEMPRE devolve a mesma mensagem neutra, exista ou não a conta.
// O gateway responde 202 sem revelar nada e dispara o e-mail só se for paciente.
export interface EsqueciSenhaState {
  ok: boolean
  msg: string | null
}

const MSG_NEUTRA =
  "Se houver uma conta com esse e-mail, enviamos um link para redefinir a senha. " +
  "Verifique sua caixa de entrada (e o spam)."

export async function esqueciSenha(
  _prev: EsqueciSenhaState,
  formData: FormData,
): Promise<EsqueciSenhaState> {
  const email = (formData.get("email") as string)?.trim()
  if (!email) return { ok: false, msg: "Informe seu e-mail." }

  try {
    await gatewayPaciente.post("/api/v1/auth/paciente/esqueci-senha", { email })
  } catch {
    // Silencia qualquer erro (inclusive rede): não revela se o e-mail existe.
  }
  // Resposta sempre neutra — não vaza quem é paciente.
  return { ok: true, msg: MSG_NEUTRA }
}

// ─── Login com email + senha ───────────────────────────────────────────────
export async function entrarComSenha(
  _prev: PacienteAuthState,
  formData: FormData,
): Promise<PacienteAuthState> {
  const email = formData.get("email") as string
  const senha = formData.get("senha") as string

  if (!email || !senha) return { error: "E-mail e senha são obrigatórios." }

  let senhaTemporaria = false
  try {
    const data = await gatewayPaciente.post<{ token: string; senhaTemporaria: boolean }>(
      "/api/v1/auth/paciente/login",
      { email, senha },
    )
    ;(await cookies()).set(COOKIE_NAME, data.token, COOKIE_OPTS)
    senhaTemporaria = data.senhaTemporaria
  } catch (err) {
    if (err instanceof GatewayPacienteError) {
      if (err.status === 401) return { error: "E-mail ou senha incorretos." }
      if (err.status === 409)
        return { error: "Este e-mail é de acesso do médico. Use o portal em /login." }
      if (err.status === 429)
        return { error: "Muitas tentativas. Tente novamente em alguns minutos." }
    }
    return { error: "Erro de conexão. Tente novamente." }
  }

  redirect(senhaTemporaria ? "/p/trocar-senha" : destinoSeguro(formData.get("next")))
}

// ─── Troca de senha (autenticado) ──────────────────────────────────────────
export async function trocarSenha(
  _prev: PacienteAuthState,
  formData: FormData,
): Promise<PacienteAuthState> {
  const senhaAtual = formData.get("senhaAtual") as string
  const novaSenha = formData.get("novaSenha") as string
  const confirmar = formData.get("confirmar") as string

  if (!senhaAtual) return { error: "Informe a senha atual." }
  if (!novaSenha || novaSenha.length < 8)
    return { error: "A nova senha precisa ter pelo menos 8 caracteres." }
  if (novaSenha !== confirmar) return { error: "As senhas não coincidem." }

  try {
    await gatewayPaciente.post("/api/v1/auth/paciente/senha", { senhaAtual, novaSenha })
  } catch (err) {
    if (err instanceof GatewayPacienteError && err.status === 401)
      return { error: "Senha atual incorreta." }
    return { error: "Não foi possível trocar a senha. Tente novamente." }
  }

  redirect("/p")
}

// ─── Logout ────────────────────────────────────────────────────────────────
// CSRF (T1-9): é um Server Action — o Next já valida Origin × Host nativamente e
// rejeita POST cross-site, então não precisa do guard manual do Route Handler do
// médico (lib/same-origin.ts). O lado paciente fica coberto pela proteção do framework.
export async function sairPaciente(): Promise<void> {
  ;(await cookies()).set(COOKIE_NAME, "", { ...COOKIE_OPTS, maxAge: 0 })
  redirect("/p/entrar")
}
