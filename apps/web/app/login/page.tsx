"use client"

import { BrandWordmark } from "@/components/brand-wordmark"
import { Logo } from "@/components/logo"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { Mail, Lock, ArrowRight } from "lucide-react"
import { useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState("")
  const [senha, setSenha] = useState("")
  const [erro, setErro] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErro(null)
    setLoading(true)
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, senha }),
      })
      if (res.ok) {
        const next = searchParams.get("next") ?? "/dashboard"
        router.push(next)
        router.refresh()
      } else {
        const data = await res.json().catch(() => ({}))
        if (res.status === 409 && data.error === "wrong_portal") {
          setErro("Este email pertence ao portal do paciente. Acesse /p/entrar")
        } else {
          setErro("Email ou senha incorretos")
        }
      }
    } catch {
      setErro("Erro de conexão. Tente novamente.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="space-y-2">
        <Label htmlFor="email" className="text-[#0F2137]">E-mail</Label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="email"
            type="email"
            placeholder="seu@email.com"
            className="pl-9 focus-visible:ring-[#14B8A6]"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="password" className="text-[#0F2137]">Senha</Label>
          <Link
            href="/forgot-password"
            className="text-xs text-[#14B8A6] hover:text-[#0D9488] transition-colors"
          >
            Esqueceu a senha?
          </Link>
        </div>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="password"
            type="password"
            placeholder="••••••••"
            className="pl-9 focus-visible:ring-[#14B8A6]"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            required
            autoComplete="current-password"
          />
        </div>
      </div>

      {erro && (
        <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-md">{erro}</p>
      )}

      <Button
        type="submit"
        className="w-full bg-[#14B8A6] hover:bg-[#0D9488] text-white gap-2"
        disabled={loading}
      >
        {loading ? "Entrando..." : "Entrar"}
        {!loading && <ArrowRight className="h-4 w-4" />}
      </Button>
    </form>
  )
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-background flex">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#0F2137] relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#14B8A6]/20 to-transparent" />
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
                <div className="h-10 w-10 rounded-lg bg-[#14B8A6]/20 flex items-center justify-center shrink-0">
                  <svg className="h-5 w-5 text-[#14B8A6]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-white/80">{txt}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-[#14B8A6]/10 rounded-full blur-3xl" />
        <div className="absolute top-20 -right-10 w-40 h-40 bg-[#14B8A6]/10 rounded-full blur-2xl" />
      </div>

      {/* Right Side */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="lg:hidden mb-8 flex justify-center">
            <Logo size="lg" />
          </div>
          <Card className="border-border/50 shadow-lg">
            <CardHeader className="text-center pb-4">
              <CardTitle className="text-2xl font-semibold text-[#0F2137]">
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
              <p className="text-center text-sm text-muted-foreground">
                Não tem uma conta?{" "}
                <Link href="/register" className="text-[#14B8A6] hover:text-[#0D9488] font-medium transition-colors">
                  Cadastre-se
                </Link>
              </p>
            </CardContent>
          </Card>
          <p className="text-center text-xs text-muted-foreground mt-6">
            Ao entrar, você concorda com nossos{" "}
            <Link href="/terms" className="text-[#14B8A6] hover:underline">Termos de Uso</Link>{" "}
            e{" "}
            <Link href="/privacy" className="text-[#14B8A6] hover:underline">Política de Privacidade</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
