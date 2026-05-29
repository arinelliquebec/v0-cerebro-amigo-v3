'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import {
  Brain, FileText, Pill, BookOpen, AlertCircle, Sparkles,
  User, Search, X, ChevronRight, Calendar, ExternalLink,
} from 'lucide-react'
import { Markdown } from '@/components/Markdown'
import { cn } from '@/lib/utils'

export type Insight = {
  id: string
  pacienteId: string
  nomePaciente: string | null
  agente: string
  titulo: string
  conteudo: string
  severidade: 'info' | 'atencao' | 'urgente' | 'critico'
  criadoEm: string
}

const AGENTES: Record<string, { icon: React.ReactNode; label: string; iconClass: string }> = {
  resumidor_pre_consulta: { icon: <FileText size={16} strokeWidth={2} />, label: 'Resumo pré-consulta', iconClass: 'text-sky-300 bg-sky-500/15 border-sky-500/30' },
  detector_padroes: { icon: <Sparkles size={16} strokeWidth={2} />, label: 'Padrões detectados', iconClass: 'text-fuchsia-300 bg-fuchsia-500/15 border-fuchsia-500/30' },
  avaliador_adesao: { icon: <Pill size={16} strokeWidth={2} />, label: 'Adesão semanal', iconClass: 'text-emerald-300 bg-emerald-500/15 border-emerald-500/30' },
  sintetizador_diario: { icon: <BookOpen size={16} strokeWidth={2} />, label: 'Síntese de diário', iconClass: 'text-amber-300 bg-amber-500/15 border-amber-500/30' },
  alertador_risco_silencioso: { icon: <AlertCircle size={16} strokeWidth={2} />, label: 'Risco silencioso', iconClass: 'text-red-300 bg-red-500/15 border-red-500/30' },
}

const SEV_RANK: Record<Insight['severidade'], number> = { critico: 4, urgente: 3, atencao: 2, info: 1 }
const SEV_LABEL: Record<Insight['severidade'], string> = { critico: 'crítico', urgente: 'urgente', atencao: 'atenção', info: 'info' }
const SEV_BADGE: Record<Insight['severidade'], string> = {
  critico: 'border-red-500/50 bg-red-500/15 text-red-200',
  urgente: 'border-orange-500/50 bg-orange-500/15 text-orange-200',
  atencao: 'border-amber-500/40 bg-amber-500/12 text-amber-200',
  info: 'border-[#00D9C0]/30 bg-[#00D9C0]/10 text-[#00D9C0]',
}

type Tab = 'paciente' | 'data'

export function InsightsClient({ insights: inicial }: { insights: Insight[] }) {
  const [tab, setTab] = useState<Tab>('paciente')
  const [insights, setInsights] = useState(inicial)
  const [busca, setBusca] = useState('')

  async function visualizar(id: string) {
    setInsights((prev) => prev.filter((i) => i.id !== id))
    try {
      await fetch(`/api/insights/${id}/visualizar`, { method: 'POST' })
    } catch {}
  }

  async function descartar(id: string) {
    setInsights((prev) => prev.filter((i) => i.id !== id))
    try {
      await fetch(`/api/insights/${id}/descartar`, { method: 'POST' })
    } catch {}
  }

  const filtrados = useMemo(() => {
    const q = busca.trim().toLowerCase()
    if (!q) return insights
    return insights.filter(
      (i) =>
        i.titulo.toLowerCase().includes(q) ||
        i.conteudo.toLowerCase().includes(q) ||
        (i.nomePaciente?.toLowerCase().includes(q) ?? false),
    )
  }, [insights, busca])

  if (insights.length === 0) {
    return (
      <div className="rounded-2xl border border-[#00D9C0]/[0.08] bg-[#111818] p-12 text-center">
        <Brain size={36} className="mx-auto mb-4 text-[#00D9C0]/60" />
        <p className="text-[20px] font-semibold tracking-tight text-[#F5F7F7]">
          Sem insights pendentes
        </p>
        <p className="mx-auto mt-2 max-w-md text-[15px] text-[#D0D5D5]/80">
          Os agentes analíticos rodam diariamente, semanalmente ou antes de cada consulta.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* Tabs */}
      <div className="flex gap-1 rounded-xl border border-[#00D9C0]/[0.08] bg-[#111818] p-1">
        <TabBtn active={tab === 'paciente'} onClick={() => setTab('paciente')} icon={<User size={14} strokeWidth={2} />}>
          Por paciente
        </TabBtn>
        <TabBtn active={tab === 'data'} onClick={() => setTab('data')} icon={<Calendar size={14} strokeWidth={2} />}>
          Por data
        </TabBtn>
      </div>

      {/* Busca */}
      <div className="relative">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9AA8A8]" />
        <input
          type="text"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar paciente, título ou conteúdo…"
          className="w-full rounded-xl border border-[#00D9C0]/[0.12] bg-[#111818] py-2.5 pl-11 pr-9 text-[15px] text-[#F5F7F7] placeholder:text-[#9AA8A8]/60 outline-none transition-all focus:border-[#00D9C0]/40 focus:shadow-[0_0_0_4px_rgba(0,217,192,0.08)]"
        />
        {busca && (
          <button onClick={() => setBusca('')} className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-[#9AA8A8] hover:bg-[#00D9C0]/10 hover:text-[#F5F7F7]">
            <X size={14} />
          </button>
        )}
      </div>

      {tab === 'paciente' ? (
        <PorPaciente insights={filtrados} onVisualizar={visualizar} onDescartar={descartar} />
      ) : (
        <PorData insights={filtrados} onVisualizar={visualizar} onDescartar={descartar} />
      )}
    </div>
  )
}

function TabBtn({ active, onClick, icon, children }: { active: boolean; onClick: () => void; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'inline-flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-[14px] font-medium transition-all',
        active ? 'bg-[#00D9C0]/15 text-[#00D9C0]' : 'text-[#9AA8A8] hover:text-[#F5F7F7] hover:bg-white/5',
      )}
      style={active ? { boxShadow: '0 0 0 1px rgba(0, 217, 192, 0.25)' } : undefined}
    >
      {icon}
      {children}
    </button>
  )
}

/* ─── Por Paciente ─────────────────────────────────────── */
function PorPaciente({ insights, onVisualizar, onDescartar }: { insights: Insight[]; onVisualizar: (id: string) => void; onDescartar: (id: string) => void }) {
  const grupos = useMemo(() => {
    const map = new Map<string, { paciente: string; pacienteId: string; itens: Insight[]; maxSev: Insight['severidade'] }>()
    for (const i of insights) {
      const key = i.pacienteId
      const existing = map.get(key)
      if (!existing) {
        map.set(key, { paciente: i.nomePaciente ?? 'Paciente sem nome', pacienteId: i.pacienteId, itens: [i], maxSev: i.severidade })
      } else {
        existing.itens.push(i)
        if (SEV_RANK[i.severidade] > SEV_RANK[existing.maxSev]) existing.maxSev = i.severidade
      }
    }
    return Array.from(map.values())
      .map((g) => ({
        ...g,
        itens: [...g.itens].sort((a, b) => new Date(b.criadoEm).getTime() - new Date(a.criadoEm).getTime()),
      }))
      .sort((a, b) => SEV_RANK[b.maxSev] - SEV_RANK[a.maxSev] || a.paciente.localeCompare(b.paciente))
  }, [insights])

  if (grupos.length === 0) {
    return <p className="py-10 text-center text-[15px] text-[#D0D5D5]/80">Nenhum insight bate com a busca.</p>
  }

  return (
    <div className="space-y-3">
      {grupos.map((g) => (
        <details
          key={g.pacienteId}
          className="group rounded-xl border border-[#00D9C0]/[0.08] bg-[#111818] open:bg-[#0A0E0E]/60"
        >
          <summary className="flex cursor-pointer list-none items-center justify-between p-3.5 hover:bg-[#00D9C0]/[0.04]">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#00D9C0]/25 bg-[#00D9C0]/10 text-[#00D9C0]">
                <User size={14} strokeWidth={2} />
              </span>
              <span className="text-[15px] font-medium text-[#F5F7F7]">
                {g.paciente}
              </span>
              <Link
                href={`/dashboard/pacientes/${g.pacienteId}`}
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center gap-1 rounded-md border border-[#00D9C0]/25 px-2 py-0.5 text-[12px] font-medium text-[#9AA8A8] transition-colors hover:border-[#00D9C0]/40 hover:bg-[#00D9C0]/10 hover:text-[#00D9C0]"
                title="Abrir ficha do paciente"
              >
                <ExternalLink size={12} strokeWidth={2} />
                Ficha
              </Link>
              <span className="text-[13px] text-[#9AA8A8]">
                {g.itens.length} {g.itens.length === 1 ? 'insight' : 'insights'}
              </span>
              {g.maxSev !== 'info' && (
                <span className={cn('inline-flex shrink-0 items-center rounded-full border px-2 py-0.5 text-[11px] font-medium', SEV_BADGE[g.maxSev])}>
                  {SEV_LABEL[g.maxSev]}
                </span>
              )}
            </div>
            <ChevronRight size={16} className="text-[#9AA8A8] transition-transform group-open:rotate-90" />
          </summary>
          <div className="space-y-5 border-t border-[#00D9C0]/[0.05] p-3.5">
            {agrupaPorMes(g.itens).map((mes) => (
              <section key={mes.chave} className="space-y-2">
                <h4 className="text-[13px] font-semibold text-[#00D9C0]">
                  {mes.label} <span className="text-[#9AA8A8] font-medium">· {mes.itens.length}</span>
                </h4>
                <div className="space-y-1.5">
                  {mes.itens.map((i) => (
                    <InsightRow key={i.id} i={i} onVisualizar={onVisualizar} onDescartar={onDescartar} />
                  ))}
                </div>
              </section>
            ))}
          </div>
        </details>
      ))}
    </div>
  )
}

/* ─── Por Data (timeline) ──────────────────────────────── */
function PorData({ insights, onVisualizar, onDescartar }: { insights: Insight[]; onVisualizar: (id: string) => void; onDescartar: (id: string) => void }) {
  const grupos = useMemo(() => {
    const agora = Date.now()
    const buckets: Record<string, Insight[]> = { hoje: [], ontem: [], semana: [], antigos: [] }
    for (const i of [...insights].sort((a, b) => new Date(b.criadoEm).getTime() - new Date(a.criadoEm).getTime())) {
      const diff = (agora - new Date(i.criadoEm).getTime()) / (1000 * 60 * 60 * 24)
      if (diff < 1) buckets.hoje.push(i)
      else if (diff < 2) buckets.ontem.push(i)
      else if (diff < 7) buckets.semana.push(i)
      else buckets.antigos.push(i)
    }
    return buckets
  }, [insights])

  const labels: Record<string, string> = { hoje: 'Hoje', ontem: 'Ontem', semana: 'Esta semana', antigos: 'Mais antigos' }

  const total = grupos.hoje.length + grupos.ontem.length + grupos.semana.length + grupos.antigos.length
  if (total === 0) return <p className="py-10 text-center text-[15px] text-[#D0D5D5]/80">Nenhum insight bate com a busca.</p>

  return (
    <div className="space-y-6">
      {(['hoje', 'ontem', 'semana', 'antigos'] as const).map((bucket) => {
        const itens = grupos[bucket]
        if (itens.length === 0) return null
        return (
          <section key={bucket} className="space-y-3">
            <h3 className="text-[13px] font-semibold text-[#00D9C0]">
              {labels[bucket]} <span className="text-[#9AA8A8] font-medium">· {itens.length}</span>
            </h3>
            <div className="space-y-3">
              {itens.map((i) => (
                <InsightCard key={i.id} i={i} onVisualizar={onVisualizar} onDescartar={onDescartar} />
              ))}
            </div>
          </section>
        )
      })}
    </div>
  )
}

/* ─── Helper: agrupa por mês ───────────────────────────── */
function agrupaPorMes(itens: Insight[]) {
  const map = new Map<string, { chave: string; label: string; itens: Insight[] }>()
  for (const i of itens) {
    const d = new Date(i.criadoEm)
    const chave = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const label = d.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
    if (!map.has(chave)) map.set(chave, { chave, label: label.charAt(0).toUpperCase() + label.slice(1), itens: [] })
    map.get(chave)!.itens.push(i)
  }
  return Array.from(map.values()).sort((a, b) => b.chave.localeCompare(a.chave))
}

/* ─── InsightRow (collapsible compacto) ────────────────── */
function InsightRow({ i, onVisualizar, onDescartar }: { i: Insight; onVisualizar: (id: string) => void; onDescartar: (id: string) => void }) {
  const meta = AGENTES[i.agente] ?? { icon: <Brain size={14} strokeWidth={2} />, label: i.agente, iconClass: 'text-[#9AA8A8] bg-[#0A0E0E] border-[#00D9C0]/[0.15]' }
  const data = new Date(i.criadoEm).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })

  return (
    <details className="group rounded-lg border border-[#00D9C0]/[0.08] bg-[#0A0E0E]/40 open:border-[#00D9C0]/25 open:bg-[#0A0E0E]/70">
      <summary className="flex cursor-pointer list-none items-center gap-3 p-3 hover:bg-[#00D9C0]/[0.04]">
        <span className={cn('inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md border', meta.iconClass)}>
          {meta.icon}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate text-[15px] font-medium text-[#F5F7F7]">{i.titulo}</p>
            {i.severidade !== 'info' && (
              <span className={cn('inline-flex shrink-0 items-center rounded-full border px-2 py-0.5 text-[11px] font-medium', SEV_BADGE[i.severidade])}>
                {SEV_LABEL[i.severidade]}
              </span>
            )}
          </div>
          <p className="mt-0.5 text-[13px] text-[#9AA8A8]">
            <span className="font-medium">{meta.label}</span>
            <span className="mx-1.5">·</span>
            <span className="tabular-nums">{data}</span>
          </p>
        </div>
        <ChevronRight size={16} className="shrink-0 text-[#9AA8A8] transition-transform group-open:rotate-90" />
      </summary>
      <div className="border-t border-[#00D9C0]/[0.05] p-4">
        <Markdown source={i.conteudo} tituloHeader={i.titulo} />
        <div className="mt-4 flex gap-2 border-t border-[#00D9C0]/[0.05] pt-3">
          <button
            onClick={() => onVisualizar(i.id)}
            className="rounded-lg border border-[#00D9C0]/30 bg-[#00D9C0]/10 px-3.5 py-1.5 text-[13px] font-medium text-[#00D9C0] transition-all hover:border-[#00D9C0]/50 hover:bg-[#00D9C0]/15"
          >
            Marcar como visualizado
          </button>
          <button
            onClick={() => onDescartar(i.id)}
            className="rounded-lg px-3.5 py-1.5 text-[13px] font-medium text-[#9AA8A8] transition-colors hover:text-[#F5F7F7]"
          >
            Descartar
          </button>
        </div>
      </div>
    </details>
  )
}

/* ─── InsightCard ──────────────────────────────────────── */
function InsightCard({ i, onVisualizar, onDescartar }: { i: Insight; onVisualizar: (id: string) => void; onDescartar: (id: string) => void }) {
  const meta = AGENTES[i.agente] ?? { icon: <Brain size={16} strokeWidth={2} />, label: i.agente, iconClass: 'text-[#9AA8A8] bg-[#0A0E0E] border-[#00D9C0]/[0.15]' }
  const sevClass = {
    critico: 'border-red-500/40 bg-red-500/10',
    urgente: 'border-orange-500/40 bg-orange-500/10',
    atencao: 'border-amber-500/30 bg-amber-500/8',
    info: 'border-[#00D9C0]/[0.08] bg-[#111818]',
  }[i.severidade]

  return (
    <article className={cn('rounded-2xl border p-6 transition-colors', sevClass)}>
      <header className="mb-4 flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <span className={cn('inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border', meta.iconClass)}>
            {meta.icon}
          </span>
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-[18px] font-semibold tracking-tight text-[#F5F7F7]">
              {i.titulo}
            </h3>
            <p className="mt-1 text-[13px] text-[#9AA8A8]">
              <span className="font-medium text-[#D0D5D5]">{meta.label}</span>
              {i.nomePaciente && (
                <>
                  <span className="mx-1.5">·</span>
                  <Link href={`/dashboard/pacientes/${i.pacienteId}`} className="font-medium text-[#D0D5D5] transition-colors hover:text-[#00D9C0]">
                    {i.nomePaciente}
                  </Link>
                </>
              )}
              <span className="mx-1.5">·</span>
              <span className="tabular-nums">
                {new Date(i.criadoEm).toLocaleString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
              </span>
            </p>
          </div>
        </div>
        {i.severidade !== 'info' && (
          <span className={cn('inline-flex shrink-0 items-center rounded-full border px-2.5 py-0.5 text-[12px] font-medium', SEV_BADGE[i.severidade])}>
            {SEV_LABEL[i.severidade]}
          </span>
        )}
      </header>

      <Markdown source={i.conteudo} tituloHeader={i.titulo} />

      <div className="mt-5 flex gap-2 border-t border-[#00D9C0]/[0.05] pt-4">
        <button
          onClick={() => onVisualizar(i.id)}
          className="rounded-lg border border-[#00D9C0]/30 bg-[#00D9C0]/10 px-3.5 py-1.5 text-[13px] font-medium text-[#00D9C0] transition-all hover:border-[#00D9C0]/50 hover:bg-[#00D9C0]/15"
        >
          Marcar como visualizado
        </button>
        <button
          onClick={() => onDescartar(i.id)}
          className="rounded-lg px-3.5 py-1.5 text-[13px] font-medium text-[#9AA8A8] transition-colors hover:text-[#F5F7F7]"
        >
          Descartar
        </button>
      </div>
    </article>
  )
}
