'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'motion/react'
import {
  ArrowRight,
  Loader2,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  ShieldCheck,
  KeyRound,
} from 'lucide-react'

export default function TrocarSenhaPage() {
  const router = useRouter()
  const [senhaAtual, setSenhaAtual] = useState('')
  const [novaSenha, setNovaSenha] = useState('')
  const [confirmar, setConfirmar] = useState('')
  const [verAtual, setVerAtual] = useState(false)
  const [verNova, setVerNova] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErro(null)

    if (novaSenha.length < 8) {
      setErro('A nova senha precisa ter pelo menos 8 caracteres.')
      return
    }
    if (novaSenha !== confirmar) {
      setErro('A confirmação não bate com a nova senha.')
      return
    }
    if (novaSenha === senhaAtual) {
      setErro('A nova senha precisa ser diferente da atual.')
      return
    }

    setEnviando(true)
    try {
      const res = await fetch('/api/paciente/senha', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ senhaAtual, novaSenha }),
      })
      if (res.status === 401) {
        setErro('A senha atual não confere.')
        return
      }
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string }
        setErro(j.error ?? 'Não foi possível trocar a senha.')
        return
      }
      router.push('/p')
    } catch {
      setErro('Falha de conexão.')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <main className="relative min-h-screen bg-[#0A0E0E] text-[#F5F7F7] overflow-hidden">
      {/* halo decorativo */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 [background:radial-gradient(900px_600px_at_85%_-10%,rgba(0,217,192,0.12),transparent_65%),radial-gradient(700px_500px_at_-10%_110%,rgba(168,85,247,0.08),transparent_65%)]"
      />

      <div className="relative mx-auto flex min-h-screen max-w-2xl flex-col justify-center px-6 py-12 sm:px-10">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="flex items-center gap-3 mb-6"
        >
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#00D9C0]/30 bg-[#00D9C0]/10">
            <KeyRound size={16} strokeWidth={2} className="text-[#00D9C0]" />
          </span>
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00D9C0]" />
            <span className="text-[13px] font-medium text-[#00D9C0]/70">
              Primeiro acesso · troca obrigatória
            </span>
          </div>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 12, filter: 'blur(6px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0)' }}
          transition={{ duration: 0.8, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          className="text-[34px] font-bold tracking-tight leading-[1.05] sm:text-[44px]"
        >
          Crie uma senha{' '}
          <span className="italic text-[#00D9C0]">só sua</span>.
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.25 }}
          className="mt-4 max-w-md text-[15px] leading-relaxed text-[#D0D5D5]/80"
        >
          Sua clínica cadastrou uma senha provisória pra liberar seu acesso. Antes
          de continuar, defina uma senha pessoal — ela{' '}
          <em className="italic text-[#D0D5D5]">não fica visível</em> nem pra
          equipe médica.
        </motion.p>

        <motion.form
          onSubmit={onSubmit}
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="mt-10 space-y-5 rounded-3xl border border-[#00D9C0]/[0.08] bg-[#111818] p-6 sm:p-8"
        >
          <CampoSenha
            label="Senha provisória (a que sua clínica enviou)"
            value={senhaAtual}
            onChange={setSenhaAtual}
            visivel={verAtual}
            onToggle={() => setVerAtual((v) => !v)}
            autoComplete="current-password"
          />

          <div className="border-t border-[#00D9C0]/[0.08] pt-5">
            <CampoSenha
              label="Nova senha"
              value={novaSenha}
              onChange={setNovaSenha}
              visivel={verNova}
              onToggle={() => setVerNova((v) => !v)}
              autoComplete="new-password"
              hint="Mínimo 8 caracteres. Use letras, números e algo só seu."
            />
          </div>

          <CampoSenha
            label="Confirmar nova senha"
            value={confirmar}
            onChange={setConfirmar}
            visivel={verNova}
            onToggle={() => setVerNova((v) => !v)}
            autoComplete="new-password"
          />

          {erro && (
            <motion.div
              role="alert"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-start gap-2 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-[14px] leading-relaxed text-red-200"
            >
              <AlertCircle size={16} className="mt-0.5 shrink-0" />
              <span>{erro}</span>
            </motion.div>
          )}

          <button
            type="submit"
            disabled={enviando}
            className="group inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#00D9C0] px-6 py-3.5 text-[15px] font-semibold text-[#0A0E0E] transition-all duration-300 hover:bg-[#00D9C0]/90 disabled:opacity-50"
            style={{ boxShadow: enviando ? 'none' : '0 0 24px rgba(0, 217, 192, 0.2)' }}
          >
            {enviando ? (
              <>
                <Loader2 size={16} className="animate-spin" /> Trocando…
              </>
            ) : (
              <>
                Definir senha e entrar
                <ArrowRight
                  size={16}
                  className="transition-transform duration-300 group-hover:translate-x-1"
                />
              </>
            )}
          </button>

          <p className="flex items-start gap-2 text-[13px] leading-relaxed text-[#9AA8A8]">
            <ShieldCheck
              size={14}
              strokeWidth={2}
              className="mt-0.5 shrink-0 text-[#00D9C0]"
            />
            Sua senha é guardada com hash seguro. Nem a clínica, nem nós podemos
            ver o texto original.
          </p>
        </motion.form>
      </div>
    </main>
  )
}

function CampoSenha({
  label,
  value,
  onChange,
  visivel,
  onToggle,
  autoComplete,
  hint,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  visivel: boolean
  onToggle: () => void
  autoComplete: string
  hint?: string
}) {
  return (
    <label className="group block">
      <span className="mb-2 block text-[13px] font-medium text-[#D0D5D5]">{label}</span>
      <div className="relative">
        <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#9AA8A8] transition-colors group-focus-within:text-[#00D9C0]">
          <Lock size={15} strokeWidth={2} />
        </span>
        <input
          required
          type={visivel ? 'text' : 'password'}
          autoComplete={autoComplete}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="••••••••"
          className="h-12 w-full rounded-2xl border border-[#00D9C0]/[0.15] bg-[#0A0E0E] pl-11 pr-12 text-[15px] text-[#F5F7F7] placeholder:text-[#9AA8A8]/40 outline-none transition-[border-color,box-shadow] duration-300 focus:border-[#00D9C0]/40 focus:[box-shadow:0_0_0_4px_rgba(0,217,192,0.1)]"
        />
        <button
          type="button"
          onClick={onToggle}
          aria-label={visivel ? 'Ocultar senha' : 'Mostrar senha'}
          className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-[#9AA8A8] transition-colors hover:text-[#F5F7F7]"
        >
          {visivel ? <EyeOff size={15} /> : <Eye size={15} />}
        </button>
      </div>
      {hint && (
        <span className="mt-1.5 block text-[13px] leading-relaxed text-[#9AA8A8]">
          {hint}
        </span>
      )}
    </label>
  )
}
