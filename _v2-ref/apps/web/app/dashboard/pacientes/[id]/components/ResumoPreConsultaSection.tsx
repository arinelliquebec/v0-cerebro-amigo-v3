'use client'

import { useState, useTransition } from 'react'
import { Activity, Sparkles, RefreshCw, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

type ResumoDto = {
  id: string
  titulo: string
  conteudo: string
  severidade: string
  criadoEm: string
  validoAte: string | null
  qualidadeDados: string | null
  periodoDias: number | null
}

const QUALIDADE_LABEL: Record<string, { label: string; color: string }> = {
  completa: { label: 'Dados completos', color: 'text-emerald-300 border-emerald-500/30 bg-emerald-500/10' },
  parcial: { label: 'Dados parciais', color: 'text-amber-300 border-amber-500/30 bg-amber-500/10' },
  minima: { label: 'Dados mínimos', color: 'text-orange-300 border-orange-500/30 bg-orange-500/10' },
}

export function ResumoPreConsultaSection({
  pacienteId,
  resumoInicial,
}: {
  pacienteId: string
  resumoInicial: ResumoDto | null
}) {
  const [resumo, setResumo] = useState<ResumoDto | null>(resumoInicial)
  const [aviso, setAviso] = useState<string | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [, startTransition] = useTransition()

  async function gerarResumo() {
    setLoading(true)
    setErro(null)
    setAviso(null)
    try {
      const resp = await fetch(`/api/dashboard/pacientes/${pacienteId}/resumo-pre-consulta`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
      if (!resp.ok) {
        const txt = await resp.text()
        setErro(`Falha (${resp.status}): ${txt.slice(0, 200)}`)
        return
      }
      const data = await resp.json()
      if (data.resumo) {
        startTransition(() => setResumo(data.resumo))
      } else {
        setAviso(data.aviso ?? 'Resumo não foi gerado.')
      }
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro desconhecido')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="rounded-2xl border border-[#00D9C0]/[0.08] bg-[#111818] p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Activity size={16} strokeWidth={2} className="text-[#00D9C0]" />
            <h2 className="text-[13px] font-medium text-[#00D9C0]/70">
              Resumo pré-consulta · IA
            </h2>
          </div>
          {resumo && (
            <p className="mt-2 text-[13px] text-[#9AA8A8]">
              Gerado em{' '}
              <span className="text-[#D0D5D5] tabular-nums">
                {new Date(resumo.criadoEm).toLocaleString('pt-BR', {
                  day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
                })}
              </span>
              {resumo.qualidadeDados && QUALIDADE_LABEL[resumo.qualidadeDados] && (
                <span className={cn(
                  'ml-3 inline-flex items-center rounded-full border px-2.5 py-0.5 text-[12px] font-medium',
                  QUALIDADE_LABEL[resumo.qualidadeDados].color,
                )}>
                  {QUALIDADE_LABEL[resumo.qualidadeDados].label}
                </span>
              )}
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={gerarResumo}
          disabled={loading}
          className={cn(
            'inline-flex shrink-0 items-center gap-2 rounded-xl border px-4 py-2.5 text-[14px] font-medium transition-all',
            'border-[#00D9C0]/30 bg-[#00D9C0]/10 text-[#00D9C0] hover:border-[#00D9C0]/50 hover:bg-[#00D9C0]/15',
            'disabled:cursor-wait disabled:opacity-60',
          )}
        >
          {loading ? (
            <>
              <RefreshCw size={15} strokeWidth={2} className="animate-spin" />
              Gerando…
            </>
          ) : resumo ? (
            <>
              <RefreshCw size={15} strokeWidth={2} />
              Regenerar
            </>
          ) : (
            <>
              <Sparkles size={15} strokeWidth={2} />
              Gerar resumo
            </>
          )}
        </button>
      </div>

      {erro && (
        <div className="mt-4 flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-[14px] text-red-200">
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          <span className="break-words">{erro}</span>
        </div>
      )}

      {aviso && !resumo && (
        <div className="mt-4 flex items-start gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-[14px] text-amber-200">
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          <span>{aviso}</span>
        </div>
      )}

      {resumo ? (
        <div className="mt-5 max-w-none">
          <MarkdownRender source={resumo.conteudo} />
        </div>
      ) : !loading && !erro && !aviso && (
        <p className="mt-4 text-[15px] leading-relaxed text-[#D0D5D5]/80">
          Briefing automático com base nos últimos 30 dias — humor, adesão,
          eventos do diário e pontos para a consulta. Clique em{' '}
          <span className="font-medium text-[#00D9C0]">Gerar resumo</span>{' '}
          pra criar agora.
        </p>
      )}
    </section>
  )
}

/* ─── Markdown renderer minimal ──────────────── */

function MarkdownRender({ source }: { source: string }) {
  const lines = source.split('\n').map((l) => l.replace(/\r$/, ''))
  const blocks: React.ReactNode[] = []
  let i = 0
  let key = 0

  while (i < lines.length) {
    const line = lines[i]

    if (line.startsWith('## ')) {
      blocks.push(
        <h3 key={key++} className="mt-7 first:mt-0 text-[22px] font-bold tracking-tight text-[#F5F7F7]">
          {line.slice(3)}
        </h3>,
      )
      i++
      continue
    }
    if (line.startsWith('### ')) {
      blocks.push(
        <h4 key={key++} className="mt-5 flex items-center gap-2 text-[14px] font-semibold text-[#00D9C0]">
          <span className="h-1.5 w-1.5 rounded-full bg-[#00D9C0]" />
          {line.slice(4)}
        </h4>,
      )
      i++
      continue
    }
    if (line.startsWith('- ')) {
      const items: string[] = []
      while (i < lines.length && lines[i].startsWith('- ')) {
        items.push(lines[i].slice(2))
        i++
      }
      blocks.push(
        <ul key={key++} className="mt-3 space-y-2 text-[15px] text-[#D0D5D5]">
          {items.map((it, idx) => (
            <li key={idx} className="flex gap-2.5">
              <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#00D9C0]" />
              <span dangerouslySetInnerHTML={{ __html: renderInline(it) }} />
            </li>
          ))}
        </ul>,
      )
      continue
    }
    if (line.trim() === '') {
      i++
      continue
    }
    // parágrafo (acumula até linha vazia)
    const para: string[] = [line]
    i++
    while (i < lines.length && lines[i].trim() !== '' && !lines[i].startsWith('#') && !lines[i].startsWith('- ')) {
      para.push(lines[i])
      i++
    }
    blocks.push(
      <p
        key={key++}
        className="mt-3 text-[15px] leading-relaxed text-[#D0D5D5]"
        dangerouslySetInnerHTML={{ __html: renderInline(para.join(' ')) }}
      />,
    )
  }

  return <div>{blocks}</div>
}

function renderInline(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong class="text-[#F5F7F7] font-semibold">$1</strong>')
    .replace(/⚠ ALERTA/g, '<span class="inline-flex items-center font-semibold text-red-400">⚠ ALERTA</span>')
}
