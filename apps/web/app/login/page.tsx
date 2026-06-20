import { Suspense } from "react"
import Link from "next/link"
import { BrandWordmark } from "@/components/brand-wordmark"
import { Logo } from "@/components/logo"
import { LoginForm } from "@/components/login-form"
import { NeuralField } from "@/components/landing/neural-field"
import { AuroraBackdrop } from "@/components/landing/aurora-backdrop"
import { Eyebrow } from "@/components/landing/eyebrow"
import { BackButton } from "@/components/back-button"
import { CheckCircle } from "lucide-react"

export const metadata = {
  title: "Entrar — Cérebro Amigo",
  description: "Acesse sua conta do Cérebro Amigo",
  // Login não deve ranquear (já em robots disallow); reforça com noindex.
  robots: { index: false, follow: false },
}

const props = [
  "Briefing pré-consulta gerado por IA",
  "Acompanhamento seguro entre consultas",
  "Conformidade com a LGPD",
]

export default function LoginPage() {
  return (
    <div className="theme-noir min-h-screen bg-background text-foreground flex">
      {/* Esquerda — marca + campo neural */}
      <div className="relative hidden w-1/2 overflow-hidden lg:flex">
        <AuroraBackdrop grid />
        <div className="pointer-events-none absolute inset-0 opacity-60">
          <NeuralField />
        </div>
        <div className="relative z-10 flex flex-col justify-center px-16">
          <div className="mb-8">
            <Logo showText={false} size="lg" variant="light" />
          </div>
          <Eyebrow className="mb-4">Para psiquiatras e clínicos</Eyebrow>
          <h1 className="mb-5">
            <BrandWordmark size="auth" variant="light" />
          </h1>
          <p className="mb-10 max-w-md text-lg leading-relaxed text-muted-foreground">
            O CRM que trabalha entre consultas. Cuide dos seus pacientes com mais
            eficiência e acolhimento.
          </p>
          <div className="space-y-4">
            {props.map((txt) => (
              <div key={txt} className="flex items-center gap-3.5">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary/15 border border-primary/20">
                  <CheckCircle className="h-4 w-4 text-accent-on-dark" />
                </span>
                <span className="text-sm font-medium text-muted-foreground">{txt}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Direita — formulário */}
      <div className="flex flex-1 items-center justify-center p-8">
        <div className="w-full max-w-md">
          <BackButton className="mb-4 text-noir-text-dim hover:text-foreground" />
          <div className="mb-8 flex justify-center lg:hidden">
            <Logo size="lg" variant="light" />
          </div>
          <div className="glass-noir rounded-2xl border border-noir-line p-7 glow-purple-lg">
            <div className="pb-5 text-center">
              <h2 className="text-2xl font-semibold tracking-tight text-foreground">
                Bem-vindo de volta
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Entre com suas credenciais para acessar o sistema
              </p>
            </div>
            <Suspense fallback={null}>
              <LoginForm />
            </Suspense>
          </div>
          <p className="mt-6 text-center text-xs text-muted-foreground">
            Ao entrar, você concorda com nossos{" "}
            <Link href="/terms" className="font-medium text-primary hover:underline">Termos de Uso</Link>{" "}
            e{" "}
            <Link href="/privacy" className="font-medium text-primary hover:underline">Política de Privacidade</Link>
          </p>
          <p className="mt-4 text-center text-xs text-noir-text-dim">
            É paciente?{" "}
            <Link href="/p/entrar" className="font-medium text-primary hover:underline">Acesse seu portal</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
