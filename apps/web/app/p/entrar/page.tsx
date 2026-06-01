import { BrandWordmark } from "@/components/brand-wordmark"
import { EntrarForm } from "./entrar-form"

// Tela de entrada do PORTAL DO PACIENTE — distinta do /login do médico.
// Mobile-first. Modo "convite" (token na URL, vindo do magic link) cria a senha;
// modo "login" (sem token) autentica por e-mail+senha.
export default async function EntrarPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; next?: string }>
}) {
  const sp = await searchParams
  const next = sp.next?.startsWith("/p") ? sp.next : "/p"

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center space-y-3">
          <BrandWordmark layout="inline" size="lg" className="justify-center" />
          <div>
            <h1 className="text-xl font-semibold text-navy">
              {sp.token ? "Ative sua conta" : "Portal do paciente"}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Acompanhamento entre consultas
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
          <EntrarForm token={sp.token} next={next} />
        </div>

        <p className="text-center text-xs text-muted-foreground">
          Em caso de crise: CVV 188 (24h) · SAMU 192
        </p>
      </div>
    </div>
  )
}
