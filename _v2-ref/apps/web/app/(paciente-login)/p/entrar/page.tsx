'use client'

import { Suspense, useEffect, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { gsap } from 'gsap'
import { ArrowLeft, Mail, Lock, AlertCircle, Loader2, Stethoscope } from 'lucide-react'

type Erro =
  | { tipo: 'invalid'; mensagem: string }
  | { tipo: 'wrong_portal'; go: string }
  | { tipo: 'rate_limited' }
  | { tipo: 'connection' }

function EntrarForm() {
  const router = useRouter()
  const leftRef = useRef<HTMLDivElement>(null)
  const rightRef = useRef<HTMLDivElement>(null)
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState<Erro | null>(null)
  const [carregando, setCarregando] = useState(false)
  const searchParams = useSearchParams()

  // Auto-valida magic link via ?token= na URL
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    const token = searchParams.get('token')
    if (!token) return

    fetch('/api/paciente/magic-validar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    })
      .then((res) => {
        if (res.ok) {
          window.location.assign('/p')
        } else {
          window.history.replaceState({}, '', '/p/entrar')
        }
      })
      .catch(() => {
        window.history.replaceState({}, '', '/p/entrar')
      })
  }, [])

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
      const res = await fetch('/api/paciente/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, senha }),
      })
      if (res.status === 429) {
        setErro({ tipo: 'rate_limited' })
        return
      }
      if (res.status === 409) {
        const data = (await res.json().catch(() => ({}))) as { go?: string }
        setErro({ tipo: 'wrong_portal', go: data.go ?? '/login' })
        return
      }
      if (!res.ok) {
        setErro({ tipo: 'invalid', mensagem: 'E-mail ou senha incorretos.' })
        return
      }
      const data = (await res.json().catch(() => ({}))) as { senhaTemporaria?: boolean }
      router.push(data.senhaTemporaria ? '/p/trocar-senha' : '/p')
    } catch {
      setErro({ tipo: 'connection' })
    } finally {
      setCarregando(false)
    }
  }

  return (
    <div className="min-h-[100dvh] bg-[#0A0E0E] flex">
      {/* ─── LEFT ─── */}
      <div
        ref={leftRef}
        className="hidden lg:flex lg:w-1/2 relative items-center justify-center p-12 opacity-0"
        style={{
          background:
            'radial-gradient(ellipse 70% 60% at 30% 50%, rgba(0, 217, 192, 0.06) 0%, transparent 60%), linear-gradient(135deg, rgba(232, 213, 240, 0.05) 0%, rgba(213, 232, 240, 0.05) 100%), #0A0E0E',
        }}
      >
        <div className="relative z-10 max-w-[440px]">
          <Link href="/" className="inline-flex items-center gap-2 text-[#9AA8A8] hover:text-[#F5F7F7] transition-colors mb-12 group">
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
            <span className="text-sm font-medium">voltar</span>
          </Link>

          <div className="flex items-center gap-2 mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00D9C0]" />
            <span className="font-mono text-xs tracking-[0.08em] uppercase text-[#00D9C0]">
              PORTAL DO PACIENTE · V.2026
            </span>
          </div>

          <h1 className="text-4xl xl:text-5xl font-bold leading-[1.05] tracking-[-0.03em] mb-6">
            <span className="text-[#F5F7F7]">Seu cuidado,</span>
            <br />
            <span className="text-[#00D9C0]">sempre perto.</span>
          </h1>

          <p className="text-base text-[#9AA8A8] leading-relaxed mb-8 max-w-[380px]">
            Acompanhe seu humor, registre seu diário e veja suas medicações — tudo entre uma consulta
            e outra, com segurança e privacidade.
          </p>

          <span className="font-mono text-[11px] tracking-wide text-[#9AA8A8]/60">
            ↳ dados protegidos · LGPD categoria especial
          </span>

          <div
            className="mt-12 max-w-[280px] mx-auto rounded-3xl border border-[#00D9C0]/15 bg-[#0A0E0E] p-3 space-y-3 relative overflow-hidden"
            style={{ boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5), 0 0 40px rgba(0, 217, 192, 0.08)' }}
          >
            {/* Glow accents */}
            <div aria-hidden className="absolute -top-16 -right-16 w-32 h-32 rounded-full bg-[#00D9C0]/15 blur-2xl pointer-events-none" />
            <div aria-hidden className="absolute bottom-1/3 -left-16 w-32 h-32 rounded-full bg-purple-500/15 blur-2xl pointer-events-none" />

            {/* Card 1: Humor */}
            <div className="relative bg-[#111818] rounded-2xl p-4 border border-white/[0.05]">
              <h4 className="text-[13px] text-[#F5F7F7] mb-3 font-medium">Como você está hoje?</h4>
              <div className="flex justify-between items-center px-1">
                {[
                  { emoji: '😢', color: '#3B82F6', bg: 'rgba(59,130,246,0.15)' },
                  { emoji: '😐', color: '#FACC15', bg: 'rgba(250,204,21,0.15)' },
                  { emoji: '🙂', color: '#84CC16', bg: 'rgba(132,204,22,0.15)' },
                  { emoji: '😄', color: '#00D9C0', bg: 'rgba(0,217,192,0.25)', active: true },
                  { emoji: '🤩', color: '#A855F7', bg: 'rgba(168,85,247,0.15)' },
                ].map((m, i) => (
                  <div
                    key={i}
                    className="w-8 h-8 rounded-full flex items-center justify-center text-base transition-transform"
                    style={{
                      background: m.bg,
                      border: `1.5px solid ${m.color}`,
                      boxShadow: m.active ? `0 0 12px ${m.color}` : 'none',
                      transform: m.active ? 'scale(1.1)' : 'scale(1)',
                    }}
                  >
                    {m.emoji}
                  </div>
                ))}
              </div>
            </div>

            {/* Card 2: Diário */}
            <div className="relative bg-[#111818] rounded-2xl p-4 border border-white/[0.05]">
              <h4 className="text-[13px] text-[#F5F7F7] mb-2 font-medium">Entrada do diário</h4>
              <p className="text-[11px] text-[#9AA8A8] leading-relaxed">
                Hoje foi um bom dia. Me senti produtivo depois de uma caminhada matinal e me conectei com um amigo.
              </p>
            </div>

            {/* Card 3: Medicação */}
            <div className="relative bg-[#111818] rounded-2xl p-4 border border-white/[0.05]">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-[13px] text-[#F5F7F7] font-medium">Lembretes</h4>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-[#9AA8A8]">Definir</span>
                  <div className="w-7 h-3.5 bg-[#00D9C0] rounded-full relative">
                    <div className="absolute right-0.5 top-0.5 w-2.5 h-2.5 rounded-full bg-white" />
                  </div>
                </div>
              </div>

              {/* Adesão ring */}
              <div className="flex flex-col items-center pt-1">
                <svg width="80" height="80" viewBox="0 0 80 80">
                  {/* Dashed circle background */}
                  <circle cx="40" cy="40" r="28" fill="none" stroke="#00D9C0" strokeWidth="1" strokeDasharray="3 4" opacity="0.4" />
                  {/* 7 dots */}
                  {[...Array(7)].map((_, i) => {
                    const angle = (i / 7) * 2 * Math.PI - Math.PI / 2
                    const x = 40 + Math.cos(angle) * 28
                    const y = 40 + Math.sin(angle) * 28
                    const isActive = i < 6
                    return (
                      <circle
                        key={i}
                        cx={x}
                        cy={y}
                        r="4"
                        fill={isActive ? '#00D9C0' : '#A855F7'}
                        style={{ filter: isActive ? 'drop-shadow(0 0 4px #00D9C0)' : 'none' }}
                      />
                    )
                  })}
                </svg>
                <p className="text-[10px] text-[#9AA8A8] mt-2">Adesão semanal: 6/7 dias</p>
              </div>
            </div>
          </div>
        </div>

        <Link href="/privacidade" className="absolute bottom-8 right-8 font-mono text-[11px] text-[#9AA8A8]/50 hover:text-[#00D9C0] transition-colors">
          privacidade →
        </Link>
      </div>

      {/* ─── RIGHT ─── */}
      <div ref={rightRef} className="flex-1 flex items-center justify-center p-6 md:p-12 opacity-0">
        <div className="w-full max-w-[400px]">
          <div className="lg:hidden mb-8">
            <Link href="/" className="inline-flex items-center gap-2 text-[#9AA8A8] hover:text-[#F5F7F7] transition-colors">
              <ArrowLeft size={16} />
              <span className="text-sm">voltar</span>
            </Link>
          </div>

          <div className="flex items-center gap-2 mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00D9C0]" />
            <span className="font-mono text-xs tracking-[0.08em] uppercase text-[#00D9C0]">
              LOGIN · PACIENTE
            </span>
          </div>

          <h2 className="text-3xl md:text-4xl font-bold tracking-[-0.02em] mb-3">
            <span className="text-[#F5F7F7]">Acesse seu </span>
            <span className="text-[#00D9C0]">espaço.</span>
          </h2>

          <p className="text-sm text-[#9AA8A8] mb-8">
            Use o e-mail e a senha que sua clínica enviou. Recebeu um link mágico? Basta clicar nele.
          </p>

          {erro && (
            <div className="mb-4 flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-500/10 p-3">
              <AlertCircle size={16} className="mt-0.5 shrink-0 text-red-400" />
              <div className="text-xs text-red-200">
                {erro.tipo === 'invalid' && erro.mensagem}
                {erro.tipo === 'rate_limited' && 'Muitas tentativas. Aguarde alguns minutos e tente novamente.'}
                {erro.tipo === 'wrong_portal' && (
                  <>
                    Esta conta é de médico. <Link href={erro.go} className="underline text-[#00D9C0]">Entrar pelo painel clínico →</Link>
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
                  placeholder="seu@email.com"
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

          <div className="mt-8 pt-6 border-t border-[#00D9C0]/[0.08] text-center flex items-center justify-center gap-2">
            <Stethoscope size={14} className="text-[#9AA8A8]" />
            <span className="text-sm text-[#9AA8A8]">Sou médico — </span>
            <Link href="/login" className="text-sm text-[#00D9C0] hover:underline">
              entrar pelo painel
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function PatientEntrarPage() {
  return (
    <Suspense fallback={<div className="min-h-[100dvh] bg-[#0A0E0E]" />}>
      <EntrarForm />
    </Suspense>
  )
}
