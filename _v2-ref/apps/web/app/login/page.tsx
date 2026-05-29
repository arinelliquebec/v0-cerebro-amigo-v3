'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { gsap } from 'gsap'
import { ArrowLeft, Mail, Lock, AlertCircle, Loader2 } from 'lucide-react'

type Erro =
  | { tipo: 'invalid'; mensagem: string }
  | { tipo: 'wrong_portal'; go: string }
  | { tipo: 'connection' }

export default function LoginPage() {
  const router = useRouter()
  const leftRef = useRef<HTMLDivElement>(null)
  const rightRef = useRef<HTMLDivElement>(null)

  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState<Erro | null>(null)
  const [carregando, setCarregando] = useState(false)

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(leftRef.current, { opacity: 0, x: -30 }, { opacity: 1, x: 0, duration: 0.6, ease: 'power2.out', delay: 0.1 })
      gsap.fromTo(rightRef.current, { opacity: 0, x: 30 }, { opacity: 1, x: 0, duration: 0.6, ease: 'power2.out', delay: 0.3 })
    })
    return () => ctx.revert()
  }, [])

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErro(null)
    setCarregando(true)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, senha }),
      })
      if (res.status === 409) {
        const data = (await res.json().catch(() => ({}))) as { go?: string }
        setErro({ tipo: 'wrong_portal', go: data.go ?? '/p/entrar' })
        return
      }
      if (!res.ok) {
        setErro({ tipo: 'invalid', mensagem: 'E-mail ou senha incorretos.' })
        return
      }
      router.push('/dashboard')
    } catch {
      setErro({ tipo: 'connection' })
    } finally {
      setCarregando(false)
    }
  }

  return (
    <div className="min-h-[100dvh] bg-[#0A0E0E] flex">
      {/* ─── LEFT — Illustration ─── */}
      <div
        ref={leftRef}
        className="hidden lg:flex lg:w-1/2 relative items-center justify-center p-12 opacity-0"
        style={{
          background:
            'radial-gradient(ellipse 70% 60% at 30% 50%, rgba(0, 217, 192, 0.08) 0%, transparent 60%), #0A0E0E',
        }}
      >
        <div className="relative z-10 max-w-[440px]">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-[#9AA8A8] hover:text-[#F5F7F7] transition-colors mb-12 group"
          >
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
            <span className="text-sm font-medium">voltar</span>
          </Link>

          <div className="flex items-center gap-2 mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00D9C0]" />
            <span className="font-mono text-xs tracking-[0.08em] uppercase text-[#00D9C0]">
              ACESSO CLÍNICO · V.2026
            </span>
          </div>

          <h1 className="text-4xl xl:text-5xl font-bold leading-[1.05] tracking-[-0.03em] mb-6">
            <span className="text-[#F5F7F7]">Bem-vindo</span>
            <br />
            <span className="text-[#00D9C0]">de volta.</span>
          </h1>

          <p className="text-base text-[#9AA8A8] leading-relaxed mb-8 max-w-[380px]">
            O painel do médico abre o histórico em uma só timeline: humor, adesão, diário,
            prescrições, notificações. Continue de onde a última sessão parou.
          </p>

          <span className="font-mono text-[11px] tracking-wide text-[#9AA8A8]/60">
            ↳ acesso restrito · LGPD categoria especial
          </span>

          {/* Decorative dashboard preview */}
          <div
            className="mt-12 rounded-xl overflow-hidden border border-[#00D9C0]/10 opacity-80"
            style={{ boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5), 0 0 40px rgba(0, 217, 192, 0.08)' }}
          >
            <img src="/assets/dashboard-mockup-hero.jpg" alt="Preview do dashboard" className="w-full h-auto" />
          </div>
        </div>

        <Link href="/privacidade" className="absolute bottom-8 right-8 font-mono text-[11px] text-[#9AA8A8]/50 hover:text-[#00D9C0] transition-colors">
          privacidade →
        </Link>
      </div>

      {/* ─── RIGHT — Form ─── */}
      <div ref={rightRef} className="flex-1 flex items-center justify-center p-6 md:p-12 opacity-0">
        <div className="w-full max-w-[400px]">
          {/* Mobile back */}
          <div className="lg:hidden mb-8">
            <Link href="/" className="inline-flex items-center gap-2 text-[#9AA8A8] hover:text-[#F5F7F7] transition-colors">
              <ArrowLeft size={16} />
              <span className="text-sm">voltar</span>
            </Link>
          </div>

          <div className="flex items-center gap-2 mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00D9C0]" />
            <span className="font-mono text-xs tracking-[0.08em] uppercase text-[#00D9C0]">
              LOGIN · MÉDICO
            </span>
          </div>

          <h2 className="text-3xl md:text-4xl font-bold tracking-[-0.02em] mb-3">
            <span className="text-[#F5F7F7]">Entre no </span>
            <span className="text-[#00D9C0]">painel.</span>
          </h2>

          <p className="text-sm text-[#9AA8A8] mb-8">
            Use o e-mail e senha cadastrados pela sua clínica. Esqueceu? Fale com o admin.
          </p>

          {/* Error banner */}
          {erro && (
            <div className="mb-4 flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-500/10 p-3">
              <AlertCircle size={16} className="mt-0.5 shrink-0 text-red-400" />
              <div className="text-xs text-red-200">
                {erro.tipo === 'invalid' && erro.mensagem}
                {erro.tipo === 'wrong_portal' && (
                  <>
                    Esta conta é de paciente. <Link href={erro.go} className="underline text-[#00D9C0]">Entrar pelo portal do paciente →</Link>
                  </>
                )}
                {erro.tipo === 'connection' && 'Erro de conexão. Tente novamente.'}
              </div>
            </div>
          )}

          <form onSubmit={onSubmit} className="flex flex-col gap-5">
            <div>
              <label className="block font-mono text-[11px] tracking-[0.08em] uppercase text-[#00D9C0] mb-2">E-mail</label>
              <div className="relative">
                <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9AA8A8]/50" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="voce@clinica.com.br"
                  className="w-full bg-[#111818] border border-[#00D9C0]/[0.12] rounded-xl py-3.5 pl-11 pr-4 text-sm text-[#F5F7F7] placeholder:text-[#9AA8A8]/40 focus:outline-none focus:border-[#00D9C0]/40 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block font-mono text-[11px] tracking-[0.08em] uppercase text-[#00D9C0] mb-2">Senha</label>
              <div className="relative">
                <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9AA8A8]/50" />
                <input
                  type="password"
                  required
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[#111818] border border-[#00D9C0]/[0.12] rounded-xl py-3.5 pl-11 pr-4 text-sm text-[#F5F7F7] placeholder:text-[#9AA8A8]/40 focus:outline-none focus:border-[#00D9C0]/40 transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={carregando}
              className="w-full inline-flex items-center justify-center gap-2 bg-[#00D9C0] text-[#0A0E0E] py-3.5 rounded-xl font-semibold text-sm hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 mt-2"
              style={{ boxShadow: carregando ? 'none' : '0 0 40px rgba(0, 217, 192, 0.15)' }}
            >
              {carregando ? (
                <><Loader2 size={16} className="animate-spin" /> Entrando…</>
              ) : (
                <>Entrar →</>
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-[#00D9C0]/[0.08] text-center">
            <span className="text-sm text-[#9AA8A8]">Sou paciente — </span>
            <Link href="/p/entrar" className="text-sm text-[#00D9C0] hover:underline">
              entrar pelo portal
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
