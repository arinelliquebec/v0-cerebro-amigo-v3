'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import {
  AlertTriangle, AlertCircle, Bell, Info,
  Search, X, ChevronRight, Check, RotateCcw, User,
} from 'lucide-react'
import { cn } from '@/lib/utils'

export type Severidade =
  | 'info' | 'atencao' | 'urgente' | 'critico'
  | 'baixa' | 'media' | 'alta' | 'critica'

export type Notificacao = {
  id: string
  pacienteId: string
  nomePaciente: string | null
  severidade: Severidade
  tipo: string
  titulo: string
  mensagem: string
  lida: boolean
  criadaEm: string
}

type DateRange = 'hoje' | '7d' | '30d' | 'tudo'
const DATE_LABELS: Record<DateRange, string> = {
  hoje: 'Hoje', '7d': '7 dias', '30d': '30 dias', tudo: 'Tudo',
}

const SEVERIDADE_META: Record<Severidade, { icon: React.ReactNode; color: string }> = {
  critico: { icon: <AlertTriangle size={16} strokeWidth={2} />, color: 'text-red-300' },
  urgente: { icon: <AlertCircle size={16} strokeWidth={2} />, color: 'text-orange-300' },
  atencao: { icon: <Bell size={16} strokeWidth={2} />, color: 'text-amber-300' },
  info: { icon: <Info size={16} strokeWidth={2} />, color: 'text-[#00D9C0]' },
  critica: { icon: <AlertTriangle size={16} strokeWidth={2} />, color: 'text-red-300' },
  alta: { icon: <AlertCircle size={16} strokeWidth={2} />, color: 'text-orange-300' },
  media: { icon: <Bell size={16} strokeWidth={2} />, color: 'text-amber-300' },
  baixa: { icon: <Info size={16} strokeWidth={2} />, color: 'text-[#00D9C0]' },
}

const isCritica = (sev: Severidade) => sev === 'critico' || sev === 'critica'

function getGrupoData(criadaEm: string): 'hoje' | 'ontem' | 'semana' | 'antiga' {
  const agora = new Date()
  const data = new Date(criadaEm)
  const diff = (agora.getTime() - data.getTime()) / (1000 * 60 * 60 * 24)
  if (diff < 1) return 'hoje'
  if (diff < 2) return 'ontem'
  if (diff < 7) return 'semana'
  return 'antiga'
}

type Tab = 'inbox' | 'lidas'

export function NotificacoesClient({
  naoLidas: naoLidasInicial,
  lidas: lidasIniciais,
}: {
  naoLidas: Notificacao[]
  lidas: Notificacao[]
}) {
  const [tab, setTab] = useState<Tab>('inbox')
  const [naoLidas, setNaoLidas] = useState(naoLidasInicial)
  const [lidas, setLidas] = useState(lidasIniciais)

  async function marcarComoLida(n: Notificacao) {
    setNaoLidas((prev) => prev.filter((x) => x.id !== n.id))
    setLidas((prev) => [{ ...n, lida: true }, ...prev])
    try {
      await fetch(`/api/notificacoes/${n.id}/marcar-lida`, { method: 'POST' })
    } catch {
      setNaoLidas((prev) => [n, ...prev])
      setLidas((prev) => prev.filter((x) => x.id !== n.id))
    }
  }

  async function desmarcar(n: Notificacao) {
    setLidas((prev) => prev.filter((x) => x.id !== n.id))
    setNaoLidas((prev) => [{ ...n, lida: false }, ...prev])
    try {
      await fetch(`/api/notificacoes/${n.id}/marcar-nao-lida`, { method: 'POST' })
    } catch {
      setLidas((prev) => [n, ...prev])
      setNaoLidas((prev) => prev.filter((x) => x.id !== n.id))
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex gap-1 rounded-xl border border-[#00D9C0]/[0.08] bg-[#111818] p-1">
        <TabButton active={tab === 'inbox'} onClick={() => setTab('inbox')}>
          Inbox
          {naoLidas.length > 0 && (
            <span className="ml-2 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[#00D9C0]/20 px-1.5 text-[12px] font-semibold tabular-nums text-[#00D9C0]">
              {naoLidas.length}
            </span>
          )}
        </TabButton>
        <TabButton active={tab === 'lidas'} onClick={() => setTab('lidas')}>
          Marcadas como lidas
          {lidas.length > 0 && (
            <span className="ml-2 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-white/10 px-1.5 text-[12px] font-semibold tabular-nums text-[#9AA8A8]">
              {lidas.length}
            </span>
          )}
        </TabButton>
      </div>

      {tab === 'inbox' ? (
        <InboxView notificacoes={naoLidas} onMarcarLida={marcarComoLida} />
      ) : (
        <LidasView lidas={lidas} onDesmarcar={desmarcar} />
      )}
    </div>
  )
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg px-4 py-2.5 text-[14px] font-medium transition-all',
        active
          ? 'bg-[#00D9C0]/15 text-[#00D9C0]'
          : 'text-[#9AA8A8] hover:text-[#F5F7F7] hover:bg-white/5',
      )}
      style={active ? { boxShadow: '0 0 0 1px rgba(0, 217, 192, 0.25)' } : undefined}
    >
      {children}
    </button>
  )
}

/* ─── INBOX ─────────────────────────────────────────────── */

function InboxView({
  notificacoes,
  onMarcarLida,
}: {
  notificacoes: Notificacao[]
  onMarcarLida: (n: Notificacao) => void
}) {
  const [busca, setBusca] = useState('')
  const [range, setRange] = useState<DateRange>('tudo')

  const filtradas = useMemo(() => {
    const q = busca.trim().toLowerCase()
    return notificacoes.filter((n) => {
      if (q && !n.titulo.toLowerCase().includes(q) && !n.mensagem.toLowerCase().includes(q) && !(n.nomePaciente?.toLowerCase().includes(q))) return false
      if (range !== 'tudo') {
        const grupo = getGrupoData(n.criadaEm)
        const limites = (
          { hoje: ['hoje'], '7d': ['hoje', 'ontem', 'semana'], '30d': ['hoje', 'ontem', 'semana', 'antiga'] }
        )[range as Exclude<DateRange, 'tudo'>]
        if (!limites.includes(grupo)) return false
      }
      return true
    })
  }, [notificacoes, busca, range])

  const criticas = filtradas.filter((n) => isCritica(n.severidade))
  const restantes = filtradas.filter((n) => !isCritica(n.severidade))

  if (notificacoes.length === 0) {
    return <EmptyState titulo="Inbox limpa" texto="Nenhuma notificação pendente." />
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9AA8A8]" />
          <input
            type="text"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar título, mensagem ou paciente…"
            className="w-full rounded-xl border border-[#00D9C0]/[0.12] bg-[#111818] py-2.5 pl-11 pr-9 text-[15px] text-[#F5F7F7] placeholder:text-[#9AA8A8]/60 outline-none transition-all focus:border-[#00D9C0]/40 focus:shadow-[0_0_0_4px_rgba(0,217,192,0.08)]"
          />
          {busca && (
            <button onClick={() => setBusca('')} className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-[#9AA8A8] hover:bg-[#00D9C0]/10 hover:text-[#F5F7F7]">
              <X size={14} />
            </button>
          )}
        </div>
        <div className="flex gap-1 rounded-xl border border-[#00D9C0]/[0.08] bg-[#111818] p-1">
          {(Object.keys(DATE_LABELS) as DateRange[]).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={cn(
                'rounded-lg px-3 py-1.5 text-[13px] font-medium transition-all',
                range === r ? 'bg-[#00D9C0]/15 text-[#00D9C0]' : 'text-[#9AA8A8] hover:text-[#F5F7F7]',
              )}
            >
              {DATE_LABELS[r]}
            </button>
          ))}
        </div>
      </div>

      {criticas.length > 0 && (
        <section className="space-y-2">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle size={14} className="text-red-400" />
            <h3 className="text-[13px] font-semibold text-red-300">
              Críticas — atenção imediata
            </h3>
          </div>
          {criticas.map((n) => <NotifRow key={n.id} n={n} variant="critica" onAction={() => onMarcarLida(n)} />)}
        </section>
      )}

      {restantes.length > 0 && (
        <section className="space-y-2">
          {restantes.map((n) => <NotifRow key={n.id} n={n} onAction={() => onMarcarLida(n)} />)}
        </section>
      )}

      {filtradas.length === 0 && (busca || range !== 'tudo') && (
        <p className="py-10 text-center text-[15px] text-[#D0D5D5]/80">Nenhuma notificação bate com os filtros.</p>
      )}
    </div>
  )
}

/* ─── LIDAS (agrupadas por paciente) ─────────────────────── */

function LidasView({
  lidas,
  onDesmarcar,
}: {
  lidas: Notificacao[]
  onDesmarcar: (n: Notificacao) => void
}) {
  const [busca, setBusca] = useState('')

  const grupos = useMemo(() => {
    const q = busca.trim().toLowerCase()
    const filtradas = q
      ? lidas.filter(
          (n) =>
            (n.nomePaciente?.toLowerCase().includes(q)) ||
            n.titulo.toLowerCase().includes(q) ||
            n.mensagem.toLowerCase().includes(q),
        )
      : lidas

    const map = new Map<string, { paciente: string; pacienteId: string; itens: Notificacao[] }>()
    for (const n of filtradas) {
      const key = n.pacienteId
      if (!map.has(key)) {
        map.set(key, {
          paciente: n.nomePaciente ?? 'Paciente sem nome',
          pacienteId: n.pacienteId,
          itens: [],
        })
      }
      map.get(key)!.itens.push(n)
    }
    return Array.from(map.values()).sort((a, b) => a.paciente.localeCompare(b.paciente))
  }, [lidas, busca])

  if (lidas.length === 0) {
    return <EmptyState titulo="Sem notificações lidas" texto="Quando você marcar como lida, elas aparecem aqui agrupadas por paciente." />
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9AA8A8]" />
        <input
          type="text"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar paciente, título ou mensagem…"
          className="w-full rounded-xl border border-[#00D9C0]/[0.12] bg-[#111818] py-2.5 pl-11 pr-9 text-[15px] text-[#F5F7F7] placeholder:text-[#9AA8A8]/60 outline-none transition-all focus:border-[#00D9C0]/40 focus:shadow-[0_0_0_4px_rgba(0,217,192,0.08)]"
        />
        {busca && (
          <button onClick={() => setBusca('')} className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-[#9AA8A8] hover:bg-[#00D9C0]/10 hover:text-[#F5F7F7]">
            <X size={14} />
          </button>
        )}
      </div>

      <div className="space-y-3">
        {grupos.map((g) => (
          <details key={g.pacienteId} className="group rounded-xl border border-[#00D9C0]/[0.08] bg-[#111818] open:bg-[#0A0E0E]/60">
            <summary className="flex cursor-pointer list-none items-center justify-between p-3.5 hover:bg-[#00D9C0]/[0.04]">
              <div className="flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#00D9C0]/25 bg-[#00D9C0]/10 text-[#00D9C0]">
                  <User size={14} strokeWidth={2} />
                </span>
                <Link
                  href={`/dashboard/pacientes/${g.pacienteId}`}
                  className="text-[15px] font-medium text-[#F5F7F7] hover:text-[#00D9C0] transition-colors"
                  onClick={(e) => e.stopPropagation()}
                >
                  {g.paciente}
                </Link>
                <span className="text-[13px] text-[#9AA8A8]">
                  {g.itens.length} {g.itens.length === 1 ? 'notificação' : 'notificações'}
                </span>
              </div>
              <ChevronRight size={16} className="text-[#9AA8A8] transition-transform group-open:rotate-90" />
            </summary>
            <div className="border-t border-[#00D9C0]/[0.05] p-2 space-y-1.5">
              {g.itens.map((n) => (
                <NotifRow key={n.id} n={n} variant="lida" onAction={() => onDesmarcar(n)} />
              ))}
            </div>
          </details>
        ))}
      </div>

      {grupos.length === 0 && busca && (
        <p className="py-10 text-center text-[15px] text-[#D0D5D5]/80">Nenhuma notificação bate com a busca.</p>
      )}
    </div>
  )
}

/* ─── Linha de notificação ──────────────────────────────── */

function NotifRow({
  n,
  variant = 'normal',
  onAction,
}: {
  n: Notificacao
  variant?: 'normal' | 'critica' | 'lida'
  onAction: () => void
}) {
  const [open, setOpen] = useState(false)
  const sev = SEVERIDADE_META[n.severidade] ?? SEVERIDADE_META.info

  return (
    <div
      className={cn(
        'rounded-xl border transition-all',
        variant === 'critica' && 'border-red-500/30 bg-red-500/8',
        variant === 'lida' && 'border-[#00D9C0]/[0.08] bg-[#0A0E0E]/40 opacity-90 hover:opacity-100',
        variant === 'normal' && 'border-[#00D9C0]/[0.08] bg-[#111818] hover:bg-[#00D9C0]/[0.04]',
      )}
    >
      <div className="flex items-center gap-3 p-3">
        <span className={cn('shrink-0', sev.color)}>{sev.icon}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="truncate text-[15px] font-medium text-[#F5F7F7]">{n.titulo}</p>
            <SeveridadeBadge sev={n.severidade} />
          </div>
          {n.nomePaciente && variant !== 'lida' && (
            <p className="mt-0.5 text-[13px] text-[#9AA8A8]">
              {n.nomePaciente}
            </p>
          )}
        </div>
        <time className="shrink-0 text-[13px] tabular-nums text-[#9AA8A8]">
          {new Date(n.criadaEm).toLocaleString('pt-BR', {
            day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
          })}
        </time>
        <button
          onClick={() => setOpen((v) => !v)}
          className="rounded-md p-1 text-[#9AA8A8] hover:bg-white/5 hover:text-[#F5F7F7]"
          aria-label={open ? 'Recolher' : 'Expandir'}
        >
          <ChevronRight size={16} className={cn('transition-transform', open && 'rotate-90')} />
        </button>
      </div>
      {open && (
        <div className="space-y-3 border-t border-[#00D9C0]/[0.05] p-3.5">
          <p className="whitespace-pre-wrap text-[14px] leading-relaxed text-[#D0D5D5]">{n.mensagem}</p>
          <div className="flex justify-end gap-2 pt-1">
            <Link
              href={`/dashboard/pacientes/${n.pacienteId}`}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#00D9C0]/25 px-3 py-1.5 text-[13px] font-medium text-[#00D9C0] hover:bg-[#00D9C0]/10 transition-colors"
            >
              Ver paciente
            </Link>
            <button
              onClick={onAction}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[13px] font-medium transition-colors',
                variant === 'lida'
                  ? 'border-amber-500/30 text-amber-300 hover:bg-amber-500/10'
                  : 'border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/10',
              )}
            >
              {variant === 'lida' ? (
                <><RotateCcw size={13} strokeWidth={2} />Marcar não visualizada</>
              ) : (
                <><Check size={13} strokeWidth={2} />Marcar como visualizada</>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function SeveridadeBadge({ sev }: { sev: Severidade }) {
  const styles: Partial<Record<Severidade, string>> = {
    critico: 'border-red-500/50 bg-red-500/15 text-red-200',
    critica: 'border-red-500/50 bg-red-500/15 text-red-200',
    urgente: 'border-orange-500/50 bg-orange-500/15 text-orange-200',
    alta: 'border-orange-500/50 bg-orange-500/15 text-orange-200',
    atencao: 'border-amber-500/40 bg-amber-500/12 text-amber-200',
    media: 'border-amber-500/40 bg-amber-500/12 text-amber-200',
  }
  const labels: Partial<Record<Severidade, string>> = {
    critico: 'crítico', critica: 'crítico',
    urgente: 'urgente', alta: 'urgente',
    atencao: 'atenção', media: 'atenção',
  }
  const style = styles[sev]
  const label = labels[sev]
  if (!style || !label) return null
  return (
    <span className={cn('inline-flex shrink-0 items-center rounded-full border px-2.5 py-0.5 text-[12px] font-medium', style)}>
      {label}
    </span>
  )
}

function EmptyState({ titulo, texto }: { titulo: string; texto: string }) {
  return (
    <div className="rounded-2xl border border-[#00D9C0]/[0.08] bg-[#111818] p-12 text-center">
      <p className="text-[20px] font-semibold tracking-tight text-[#F5F7F7]">{titulo}</p>
      <p className="mt-2 text-[15px] text-[#D0D5D5]/80">{texto}</p>
    </div>
  )
}
