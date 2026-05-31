import { Suspense } from "react"
import Link from "next/link"
import { BrandWordmark } from "@/components/brand-wordmark"
import { Logo } from "@/components/logo"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { LoginForm } from "@/components/login-form"

export const metadata = {
  title: "Entrar — Cérebro Amigo",
  description: "Acesse sua conta do Cérebro Amigo",
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-background flex">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-navy relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-transparent" />
        <div className="relative z-10 flex flex-col justify-center px-16 text-white">
          <div className="mb-12">
            <Logo showText={false} size="lg" variant="light" />
          </div>
          <h1 className="mb-6">
            <BrandWordmark size="auth" variant="light" />
          </h1>
          <p className="text-xl text-white/80 mb-8 leading-relaxed max-w-md">
            O CRM que trabalha entre consultas. Cuide dos seus pacientes com mais eficiência e acolhimento.
          </p>
          <div className="space-y-4">
            {["Prontuário eletrônico completo", "Comunicação segura com pacientes", "Conformidade com a LGPD"].map((txt) => (
              <div key={txt} className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/20 flex items-center justify-center shrink-0">
                  <svg className="h-5 w-5 text-accent-on-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-white/80">{txt}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute top-20 -right-10 w-40 h-40 bg-primary/10 rounded-full blur-2xl" />
      </div>

      {/* Right Side */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="lg:hidden mb-8 flex justify-center">
            <Logo size="lg" />
          </div>
          <Card className="border-border/50 shadow-lg">
            <CardHeader className="text-center pb-4">
              <CardTitle className="text-2xl font-semibold text-navy">
                Bem-vindo de volta
              </CardTitle>
              <CardDescription>
                Entre com suas credenciais para acessar o sistema
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Suspense fallback={null}>
                <LoginForm />
              </Suspense>
            </CardContent>
          </Card>
          <p className="text-center text-xs text-muted-foreground mt-6">
            Ao entrar, você concorda com nossos{" "}
            <Link href="/terms" className="text-primary hover:underline">Termos de Uso</Link>{" "}
            e{" "}
            <Link href="/privacy" className="text-primary hover:underline">Política de Privacidade</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
