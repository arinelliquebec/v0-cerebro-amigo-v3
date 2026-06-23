import Link from "next/link"
import { BrandWordmark } from "@/components/brand-wordmark"
import { AuroraBackdrop } from "@/components/landing/aurora-backdrop"
import { BackButton } from "@/components/back-button"
import { EntrarForm } from "./entrar-form"

// Tela de entrada do PORTAL DO PACIENTE — distinta do /login do médico.
// Mobile-first, Neural Noir (herda .theme-noir do layout do portal).
// Modo "convite" (token na URL, vindo do magic link) cria a senha;
// modo "login" (sem token) autentica por e-mail+senha.
export default async function EntrarPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; next?: string }>
}) {
  const sp = await searchParams
  const next = sp.next?.startsWith("/p") ? sp.next : "/p"

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 py-12">
      <AuroraBackdrop />
      <div className="relative w-full max-w-sm space-y-8">
        <BackButton href="/" className="text-noir-text-dim hover:text-foreground" />
        <div className="space-y-3 text-center">
          <BrandWordmark layout="inline" size="lg" className="justify-center" />
          <div>
            <h1 className="text-xl font-semibold text-foreground">
              {sp.token ? "Ative sua conta" : "Portal do paciente"}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">Acompanhamento entre consultas</p>
          </div>
        </div>

        <div className="glass-noir rounded-2xl border border-noir-line p-6 glow-purple-lg">
          <EntrarForm token={sp.token} next={next} />
        </div>

        <div className="space-y-2 text-center">
          <p className="text-xs text-muted-foreground">
            Em caso de crise: <span className="font-mono text-foreground">CVV 188</span> (24h) ·{" "}
            <span className="font-mono text-foreground">SAMU 192</span>
          </p>
          <p className="text-xs text-noir-text-dim">
            É médico?{" "}
            <Link href="/login" className="font-medium text-primary hover:underline">Entre aqui</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
