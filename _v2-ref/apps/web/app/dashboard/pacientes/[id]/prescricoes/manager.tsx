'use client'

import { useMemo, useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence, LayoutGroup } from 'motion/react'
import {
  ChevronLeft,
  Search,
  Plus,
  X,
  Pill,
  Sparkles,
  Clock,
  AlertCircle,
  Trash2,
  Pencil,
  Calendar,
  StickyNote,
  ScrollText,
  Check,
  ChevronDown,
} from 'lucide-react'

import {
  useMedicamentos,
  type Medicamento,
  type CategoriaMedicamento,
  type ReceitaTipo,
} from '@/lib/catalogo-medicamentos'
import { MedicamentoDetalheCard, BotaoBulaAnvisa } from '@/components/MedicamentoDetalheCard'
import type { Prescricao } from './page'

type PacienteResumo = {
  numero: number
  id: string
  nome: string | null
  email: string | null
  waId: string | null
}

type Esboco = {
  medicamento: string
  apresentacao: string
  doseDescricao: string
  horarios: string[]
  inicioEm: string
  fimEm: string
  receitaTipo: ReceitaTipo
  receitaValidade: string
  observacoes: string
  motivo: string
  avisos: string[]
}

export function PrescricoesManager({
  pacienteId,
  paciente,
  prescricoesIniciais,
  embedded = false,
}: {
  pacienteId: string
  paciente: PacienteResumo
  prescricoesIniciais: Prescricao[]
  embedded?: boolean
}) {
  const router = useRouter()
  const [prescricoes, setPrescricoes] = useState(prescricoesIniciais)
  const [esboco, setEsboco] = useState<Esboco | null>(null)
  const [medSelecionado, setMedSelecionado] = useState<Medicamento | null>(null)
  const [busca, setBusca] = useState('')
  const [recolhidas, setRecolhidas] = useState<Set<CategoriaMedicamento>>(
    new Set(),
  )
  const [erro, setErro] = useState<string | null>(null)
  const [salvando, setSalvando] = useState(false)
  const [pendingDelete, setPendingDelete] = useState<string | null>(null)
  const [editandoId, setEditandoId] = useState<string | null>(null)
  const [, startTransition] = useTransition()

  const ativas = prescricoes.filter((p) => p.ativa)
  const encerradas = prescricoes.filter((p) => !p.ativa)

  const { grupos, loading: carregandoCatalogo } = useMedicamentos(busca)

  function abrirEsboco(med: Medicamento) {
    setErro(null)
    setEditandoId(null)
    setMedSelecionado(med)
    setEsboco({
      medicamento: `${med.nome} ${med.apresentacoes[0] ?? ''}`.trim(),
      apresentacao: med.apresentacoes[0] ?? '',
      doseDescricao: med.doseSugerida,
      horarios: [...med.horariosSugeridos],
      inicioEm: hojeIso(),
      fimEm: '',
      receitaTipo: med.receitaTipo,
      receitaValidade: '',
      observacoes: '',
      motivo: '',
      avisos: med.avisos ?? [],
    })
    if (typeof window !== 'undefined') {
      requestAnimationFrame(() => {
        document
          .getElementById('esboco-prescricao')
          ?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      })
    }
  }

  function abrirEdicao(p: Prescricao) {
    setErro(null)
    setMedSelecionado(null)
    setEditandoId(p.id)
    setEsboco({
      medicamento: p.medicamento,
      apresentacao: '',
      doseDescricao: p.doseDescricao,
      horarios: p.horarios.map((h) => h.slice(0, 5)),
      inicioEm: p.inicioEm.slice(0, 10),
      fimEm: p.fimEm ? p.fimEm.slice(0, 10) : '',
      receitaTipo: (p.receitaTipo as ReceitaTipo) ?? 'comum',
      receitaValidade: p.receitaValidade ? p.receitaValidade.slice(0, 10) : '',
      observacoes: p.observacoes ?? '',
      motivo: '',
      avisos: [],
    })
    if (typeof window !== 'undefined') {
      requestAnimationFrame(() => {
        document
          .getElementById('esboco-prescricao')
          ?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      })
    }
  }

  async function salvar() {
    if (!esboco) return
    if (!esboco.medicamento.trim() || !esboco.doseDescricao.trim()) {
      setErro('Medicamento e posologia são obrigatórios.')
      return
    }
    if (esboco.horarios.length === 0) {
      setErro('Adicione ao menos um horário.')
      return
    }

    setSalvando(true)
    setErro(null)
    try {
      const editando = editandoId !== null
      const res = await fetch(
        editando
          ? `/api/dashboard/prescricoes/${editandoId}`
          : '/api/dashboard/prescricoes',
        {
        method: editando ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pacienteId,
          medicamento: esboco.medicamento.trim(),
          doseDescricao: esboco.doseDescricao.trim(),
          horarios: esboco.horarios,
          inicioEm: esboco.inicioEm,
          fimEm: esboco.fimEm || null,
          receitaTipo: esboco.receitaTipo,
          receitaValidade: esboco.receitaValidade || null,
          observacoes: esboco.observacoes.trim() || null,
          motivo: esboco.motivo.trim() || null,
        }),
      })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        setErro((j as { message?: string; error?: string }).message ??
          (j as { error?: string }).error ?? 'Não foi possível salvar.')
        return
      }
      setEsboco(null)
      setEditandoId(null)
      // Optimistic: refetch via Server Action seria ideal; aqui aproveitamos
      // o RSC re-render via `router.refresh()`.
      startTransition(() => router.refresh())
      // Manual refresh local pra UX imediata
      const listaRes = await fetch(`/api/dashboard/prescricoes/paciente/${pacienteId}`)
      if (listaRes.ok) setPrescricoes(await listaRes.json())
    } catch {
      setErro('Falha de conexão.')
    } finally {
      setSalvando(false)
    }
  }

  async function desativar(id: string) {
    const motivo =
      typeof window !== 'undefined'
        ? window.prompt('Motivo do encerramento (fica registrado no histórico):') ?? ''
        : ''
    setPendingDelete(id)
    try {
      const res = await fetch(
        `/api/dashboard/prescricoes/${id}/desativar`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ motivo: motivo.trim() || null }),
        },
      )
      if (!res.ok) {
        setErro('Não foi possível encerrar a prescrição.')
        return
      }
      setPrescricoes((prev) =>
        prev.map((p) => (p.id === id ? { ...p, ativa: false } : p)),
      )
      startTransition(() => router.refresh())
    } finally {
      setPendingDelete(null)
    }
  }

  return (
    <div className={embedded ? '' : 'px-6 sm:px-10 py-10 max-w-7xl mx-auto animate-rise'}>
      {!embedded && (
        <Link
          href={`/dashboard/pacientes/${pacienteId}`}
          className="inline-flex items-center gap-1.5 text-[12px] font-medium tracking-wide text-[#9AA8A8] hover:text-[#F5F7F7] transition-colors"
        >
          <ChevronLeft size={14} strokeWidth={1.5} /> voltar ao prontuário
        </Link>
      )}

      {!embedded && (
      <header className="mt-6 mb-10 flex flex-col gap-6 border-b border-[#00D9C0]/[0.08] pb-8 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex items-end gap-6">
          <div>
            <p className="text-[12px] font-medium tracking-wide text-[#9AA8A8] mb-2">paciente</p>
            <div
              className="font-bold tracking-tight text-6xl lg:text-7xl leading-[0.85] text-[#F5F7F7] tracking-tight tabular-nums"
              aria-label={`Número de cadastro ${paciente.numero}`}
            >
              <span className="text-[#00D9C0]/30">#</span>
              <span>{String(paciente.numero).padStart(2, '0')}</span>
            </div>
          </div>
          <div className="pb-2">
            <h1 className="font-bold tracking-tight text-3xl lg:text-4xl text-[#F5F7F7] leading-[0.98]">
              Prescrições de{' '}
              <span className="italic text-[#00D9C0]">
                {primeiroNome(paciente.nome)}
              </span>
            </h1>
            <p className="mt-2 text-sm text-[#9AA8A8]">
              {ativas.length === 0 ? (
                <em className="italic">nenhuma prescrição ativa</em>
              ) : (
                <>
                  <span className="tabular-nums">
                    {String(ativas.length).padStart(2, '0')}
                  </span>{' '}
                  {ativas.length === 1 ? 'ativa' : 'ativas'}
                  {encerradas.length > 0 && (
                    <>
                      {' '}·{' '}
                      <span className="text-[#9AA8A8]/70 tabular-nums">
                        {String(encerradas.length).padStart(2, '0')}
                      </span>{' '}
                      no histórico
                    </>
                  )}
                </>
              )}
            </p>
          </div>
        </div>
      </header>
      )}

      {/* Aviso ANVISA */}
      <div
        className="mb-8 flex items-start gap-3 rounded-2xl border border-amber-500/30
                   bg-amber-500/10 px-5 py-4"
      >
        <ScrollText
          size={18}
          strokeWidth={1.5}
          className="shrink-0 mt-0.5 text-amber-300"
        />
        <p className="text-xs text-amber-200 leading-relaxed">
          Esta lista controla <strong>lembretes e adesão</strong> dentro do app.{' '}
          Não substitui receita formal — emita via Memed, prescrição eletrônica
          ICP-Brasil ou receita física.
        </p>
      </div>

      {/* ─── GRID PRINCIPAL ───────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* COLUNA ESQUERDA — ATIVAS + ESBOÇO */}
        <section className="lg:col-span-7 space-y-6">
          <LayoutGroup>
            <AnimatePresence>
              {esboco && (
                <EsbocoCard
                  esboco={esboco}
                  setEsboco={setEsboco}
                  modoEdicao={editandoId !== null}
                  onCancelar={() => {
                    setEsboco(null)
                    setMedSelecionado(null)
                    setEditandoId(null)
                    setErro(null)
                  }}
                  onSalvar={salvar}
                  salvando={salvando}
                  erro={erro}
                />
              )}
              {esboco && medSelecionado && (
                <MedicamentoDetalheCard med={medSelecionado} />
              )}
            </AnimatePresence>

            <div>
              <h2 className="text-[12px] font-medium tracking-wide text-[#9AA8A8] mb-4 flex items-center gap-2">
                <Pill size={12} strokeWidth={2} /> Prescrições ativas
              </h2>

              {ativas.length === 0 && !esboco && (
                <div
                  className="rounded-2xl border border-dashed border-[#00D9C0]/[0.12]
                             bg-[#111818] px-6 py-12 text-center"
                >
                  <Pill
                    size={28}
                    strokeWidth={1}
                    className="mx-auto mb-3 text-[#9AA8A8]/60"
                  />
                  <p className="italic text-xl text-[#9AA8A8]">
                    sem prescrições ativas
                  </p>
                  <p className="mt-2 text-xs text-[#9AA8A8]">
                    Escolha um medicamento no catálogo ao lado para começar.
                  </p>
                </div>
              )}

              <AnimatePresence>
                <ul className="space-y-3">
                  {ativas.map((p, i) => (
                    <PrescricaoCard
                      key={p.id}
                      prescricao={p}
                      index={i}
                      onModificar={() => abrirEdicao(p)}
                      onDesativar={() => desativar(p.id)}
                      desativando={pendingDelete === p.id}
                    />
                  ))}
                </ul>
              </AnimatePresence>
            </div>

            {/* Histórico (encerradas) */}
            {encerradas.length > 0 && (
              <HistoricoBloco prescricoes={encerradas} />
            )}
          </LayoutGroup>
        </section>

        {/* COLUNA DIREITA — CATÁLOGO */}
        <aside className="lg:col-span-5">
          <div
            className="sticky top-6 rounded-2xl border border-[#00D9C0]/[0.08]
                       bg-[#111818] backdrop-blur-sm  overflow-hidden"
          >
            <div className="border-b border-[#00D9C0]/[0.08] px-5 py-4">
              <p className="text-[12px] font-medium tracking-wide text-[#9AA8A8] flex items-center gap-2">
                <Sparkles size={12} strokeWidth={2} /> Catálogo
              </p>
              <h2 className="font-bold tracking-tight text-xl mt-1 text-[#F5F7F7] leading-tight">
                Escolha um{' '}
                <span className="italic text-[#00D9C0]">
                  medicamento
                </span>
              </h2>
            </div>

            <div className="px-5 py-4 border-b border-[#00D9C0]/[0.08]">
              <label className="relative block">
                <Search
                  size={14}
                  strokeWidth={1.5}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9AA8A8]"
                />
                <input
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  placeholder="buscar por nome ou princípio ativo…"
                  className="w-full pl-9 pr-3 py-2.5 bg-[#0A0E0E] border border-[#00D9C0]/[0.12]
                             rounded-lg text-sm text-[#F5F7F7] placeholder:text-[#9AA8A8]/60
                             focus:outline-none focus:border-[#00D9C0]/40
                             focus:ring-2 focus:ring-[#00D9C0]/30
                             transition-all"
                />
              </label>
            </div>

            <div className="max-h-[70vh] overflow-y-auto divide-y divide-[#00D9C0]/[0.05]">
              {grupos.length === 0 ? (
                <div className="px-5 py-8 text-center text-sm text-[#9AA8A8]">
                  Nenhum medicamento encontrado.
                </div>
              ) : (
                grupos.map((g) => (
                  <CategoriaBloco
                    key={g.categoria}
                    titulo={g.titulo}
                    descricao={g.descricao}
                    items={g.items}
                    recolhida={recolhidas.has(g.categoria) && !busca}
                    onToggleRecolher={() =>
                      setRecolhidas((prev) => {
                        const next = new Set(prev)
                        next.has(g.categoria)
                          ? next.delete(g.categoria)
                          : next.add(g.categoria)
                        return next
                      })
                    }
                    onSelecionar={abrirEsboco}
                  />
                ))
              )}
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}

// ═════════════════════════════════════════════════════════════════════════════
// Componentes
// ═════════════════════════════════════════════════════════════════════════════

function CategoriaBloco({
  titulo,
  descricao,
  items,
  recolhida,
  onToggleRecolher,
  onSelecionar,
}: {
  titulo: string
  descricao: string
  items: Medicamento[]
  recolhida: boolean
  onToggleRecolher: () => void
  onSelecionar: (m: Medicamento) => void
}) {
  if (items.length === 0) {
    return (
      <div className="px-5 py-3">
        <p className="text-[12px] font-medium tracking-wide text-[#9AA8A8] flex items-center justify-between">
          <span>{titulo}</span>
          <span className="text-[10px] text-[#9AA8A8]/60">vazio</span>
        </p>
        <p className="mt-1 text-xs text-[#9AA8A8]/60 leading-relaxed">
          Nenhum medicamento cadastrado nesta classe ainda.
        </p>
      </div>
    )
  }

  return (
    <div>
      <button
        type="button"
        onClick={onToggleRecolher}
        className="w-full text-left px-5 py-3 flex items-center justify-between gap-2
                   hover:bg-[#00D9C0]/10 transition-colors group"
      >
        <div>
          <p className="text-[12px] font-medium tracking-wide text-[#9AA8A8] group-hover:text-[#00D9C0] transition-colors">
            {titulo}
          </p>
          <p className="text-xs text-[#9AA8A8] mt-0.5">{descricao}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-[#9AA8A8] tabular-nums">
            {String(items.length).padStart(2, '0')}
          </span>
          <ChevronDown
            size={14}
            strokeWidth={1.5}
            className={`text-[#9AA8A8] transition-transform duration-300 ${
              recolhida ? '-rotate-90' : ''
            }`}
          />
        </div>
      </button>

      <AnimatePresence initial={false}>
        {!recolhida && (
          <motion.ul
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            {items.map((m) => (
              <li key={m.nome}>
                <button
                  type="button"
                  onClick={() => onSelecionar(m)}
                  className="group/item w-full text-left px-5 py-3 border-t border-[#00D9C0]/[0.08]
                             flex items-start gap-3 hover:bg-[#0A0E0E] transition-colors"
                >
                  <span
                    className="mt-1 inline-flex h-6 w-6 shrink-0 items-center justify-center
                               rounded-full border border-[#00D9C0]/[0.12] bg-[#0A0E0E]
                               text-[#9AA8A8] transition-all
                               group-hover/item:bg-[#00D9C0]/20 group-hover/item:text-[#0A0E0E]
                               group-hover/item:border-[#00D9C0] group-hover/item:scale-105"
                  >
                    <Plus size={12} strokeWidth={2} />
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-[#F5F7F7] leading-tight">
                      {m.nome}
                    </p>
                    {m.principioAtivo && (
                      <p className="text-[11px] text-[#9AA8A8] mt-0.5">
                        {m.principioAtivo}
                      </p>
                    )}
                    <p className="mt-1.5 text-xs text-[#9AA8A8] leading-relaxed">
                      {m.apresentacoes.join(' · ')}
                    </p>
                    {m.receitaTipo !== 'comum' && (
                      <span
                        className={`mt-2 inline-flex items-center gap-1 px-1.5 py-0.5 rounded
                                    text-[10px] tracking-wide
                                    ${receitaBadgeCls(m.receitaTipo)}`}
                      >
                        Receita {m.receitaTipo}
                      </span>
                    )}
                  </div>
                </button>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  )
}

function EsbocoCard({
  esboco,
  setEsboco,
  modoEdicao,
  onCancelar,
  onSalvar,
  salvando,
  erro,
}: {
  esboco: Esboco
  setEsboco: React.Dispatch<React.SetStateAction<Esboco | null>>
  modoEdicao: boolean
  onCancelar: () => void
  onSalvar: () => void
  salvando: boolean
  erro: string | null
}) {
  function patch<K extends keyof Esboco>(key: K, value: Esboco[K]) {
    setEsboco((prev) => (prev ? { ...prev, [key]: value } : prev))
  }

  return (
    <motion.div
      id="esboco-prescricao"
      layout
      initial={{ opacity: 0, y: -8, filter: 'blur(8px)' }}
      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      exit={{ opacity: 0, y: -8, filter: 'blur(8px)' }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="rounded-2xl border-2 border-[#00D9C0] bg-[#0A0E0E] 
                 overflow-hidden"
    >
      <div className="px-5 py-3 bg-[#00D9C0]/20 text-[#0A0E0E] flex items-center justify-between">
        <p className="text-[12px] font-medium tracking-wide text-[#9AA8A8] text-[#0A0E0E]/85 flex items-center gap-2">
          <Sparkles size={12} strokeWidth={2} /> {modoEdicao ? 'Editando prescrição' : 'Prescrição em rascunho'}
        </p>
        <button
          onClick={onCancelar}
          className="p-1 hover:bg-[#0A0E0E]/40 rounded transition-colors"
          aria-label="Descartar rascunho"
        >
          <X size={16} strokeWidth={1.5} />
        </button>
      </div>

      <div className="p-5 space-y-4">
        {esboco.avisos.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {esboco.avisos.map((a) => (
              <span
                key={a}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-full
                           bg-amber-500/10 border border-amber-500/30 text-amber-200
                           text-[11px]"
              >
                <AlertCircle size={11} strokeWidth={2} /> {a}
              </span>
            ))}
          </div>
        )}

        <CampoEsboco label="Medicamento + apresentação" htmlFor="esb-med">
          <input
            id="esb-med"
            value={esboco.medicamento}
            onChange={(e) => patch('medicamento', e.target.value)}
            className={inputEsbocoCls}
          />
        </CampoEsboco>

        <CampoEsboco label="Posologia" htmlFor="esb-dose">
          <input
            id="esb-dose"
            value={esboco.doseDescricao}
            onChange={(e) => patch('doseDescricao', e.target.value)}
            placeholder="ex: 1 comprimido pela manhã, em jejum"
            className={inputEsbocoCls}
          />
        </CampoEsboco>

        <div>
          <p className="text-[12px] font-medium tracking-wide text-[#9AA8A8] mb-2 flex items-center gap-1.5">
            <Clock size={11} strokeWidth={2} /> Horários
          </p>
          <div className="flex flex-wrap gap-2">
            {esboco.horarios.map((h, i) => (
              <div key={i} className="relative">
                <input
                  type="time"
                  value={h}
                  onChange={(e) =>
                    patch(
                      'horarios',
                      esboco.horarios.map((x, j) =>
                        j === i ? e.target.value : x,
                      ),
                    )
                  }
                  className="px-3 py-2 pr-8 bg-[#0A0E0E] border border-[#00D9C0]/[0.12] rounded-lg
                             text-sm focus:outline-none
                             focus:border-[#00D9C0]/40 focus:ring-2 focus:ring-[#00D9C0]/30"
                />
                {esboco.horarios.length > 1 && (
                  <button
                    type="button"
                    onClick={() =>
                      patch(
                        'horarios',
                        esboco.horarios.filter((_, j) => j !== i),
                      )
                    }
                    className="absolute right-1 top-1/2 -translate-y-1/2
                               p-1 text-[#9AA8A8] hover:text-red-300 transition-colors"
                    aria-label="Remover horário"
                  >
                    <X size={12} strokeWidth={2} />
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={() =>
                patch('horarios', [...esboco.horarios, '22:00'])
              }
              className="inline-flex items-center gap-1 px-3 py-2 rounded-lg
                         border border-dashed border-[#00D9C0]/20 text-xs text-[#9AA8A8]
                         hover:border-[#00D9C0]/40 hover:text-[#00D9C0]
                         transition-colors"
            >
              <Plus size={12} strokeWidth={2} /> horário
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <CampoEsboco label="Início" htmlFor="esb-inicio">
            <div className="relative">
              <Calendar
                size={13}
                strokeWidth={1.5}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9AA8A8] pointer-events-none"
              />
              <input
                id="esb-inicio"
                type="date"
                value={esboco.inicioEm}
                onChange={(e) => patch('inicioEm', e.target.value)}
                className={`${inputEsbocoCls} pl-9`}
              />
            </div>
          </CampoEsboco>
          <CampoEsboco label="Fim (opcional)" htmlFor="esb-fim">
            <input
              id="esb-fim"
              type="date"
              value={esboco.fimEm}
              onChange={(e) => patch('fimEm', e.target.value)}
              placeholder="contínuo"
              className={inputEsbocoCls}
            />
          </CampoEsboco>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <CampoEsboco label="Tipo de receita" htmlFor="esb-rtipo">
            <select
              id="esb-rtipo"
              value={esboco.receitaTipo}
              onChange={(e) =>
                patch('receitaTipo', e.target.value as ReceitaTipo)
              }
              className={inputEsbocoCls}
            >
              <option value="comum">Comum (branca)</option>
              <option value="C1">C1 (controlada)</option>
              <option value="B1">B1 (azul · psicotrópica)</option>
              <option value="B2">B2 (amarela · A3)</option>
            </select>
          </CampoEsboco>
          <CampoEsboco
            label="Validade da receita"
            htmlFor="esb-rvalid"
            hint="aviso 7 dias antes"
          >
            <input
              id="esb-rvalid"
              type="date"
              value={esboco.receitaValidade}
              onChange={(e) => patch('receitaValidade', e.target.value)}
              className={inputEsbocoCls}
            />
          </CampoEsboco>
        </div>

        <CampoEsboco
          label="Observações para o paciente"
          htmlFor="esb-obs"
          hint="aparece no app do paciente"
        >
          <textarea
            id="esb-obs"
            rows={2}
            value={esboco.observacoes}
            onChange={(e) => patch('observacoes', e.target.value)}
            placeholder="ex: tomar 30min antes de dormir; evitar com álcool"
            className={`${inputEsbocoCls} resize-y leading-relaxed`}
          />
        </CampoEsboco>

        <CampoEsboco
          label="Motivo (registrado no histórico)"
          htmlFor="esb-motivo"
          hint="por que está prescrevendo/ajustando — fica na timeline clínica"
        >
          <textarea
            id="esb-motivo"
            rows={2}
            value={esboco.motivo}
            onChange={(e) => patch('motivo', e.target.value)}
            placeholder="ex: quadro depressivo moderado, PHQ-9 = 16"
            className={`${inputEsbocoCls} resize-y leading-relaxed`}
          />
        </CampoEsboco>

        {erro && (
          <div className="flex gap-2 items-start text-sm text-red-300">
            <AlertCircle size={14} className="mt-0.5 shrink-0" />
            <span>{erro}</span>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t border-[#00D9C0]/[0.08]">
          <button
            onClick={onSalvar}
            disabled={salvando}
            className="group inline-flex justify-center items-center gap-2
                       px-5 py-2.5 rounded-xl bg-[#00D9C0] text-[#0A0E0E] text-sm font-medium
                       hover:bg-[#00D9C0]/20 transition-all
                       disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Check
              size={14}
              strokeWidth={2}
              className="transition-transform group-hover:scale-110"
            />
            {salvando ? 'Salvando…' : modoEdicao ? 'Salvar alterações' : 'Confirmar prescrição'}
          </button>
          <button
            type="button"
            onClick={onCancelar}
            className="inline-flex justify-center items-center px-5 py-2.5 rounded-xl
                       border border-[#00D9C0]/[0.12] text-sm text-[#9AA8A8]
                       hover:text-[#F5F7F7] hover:border-[#00D9C0]/30 transition-colors"
          >
            Cancelar
          </button>
        </div>
      </div>
    </motion.div>
  )
}

function PrescricaoCard({
  prescricao: p,
  index,
  onModificar,
  onDesativar,
  desativando,
}: {
  prescricao: Prescricao
  index: number
  onModificar: () => void
  onDesativar: () => void
  desativando: boolean
}) {
  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{
        opacity: 1,
        y: 0,
        transition: { delay: index * 0.05, duration: 0.4 },
      }}
      exit={{ opacity: 0, x: -20 }}
      className="relative rounded-2xl border border-[#00D9C0]/[0.08] bg-[#111818]
                 backdrop-blur-sm  overflow-hidden group"
    >
      {/* fio violeta lateral */}
      <span
        aria-hidden
        className="absolute left-0 top-0 bottom-0 w-1 bg-[#00D9C0]/20"
      />

      <div className="pl-5 pr-4 py-4 flex flex-col sm:flex-row sm:items-start gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-baseline gap-2 mb-1">
            <h3 className="font-bold tracking-tight text-xl text-[#F5F7F7] leading-tight">
              {p.medicamento}
            </h3>
            {p.receitaTipo && p.receitaTipo !== 'comum' && (
              <span
                className={`inline-flex items-center px-1.5 py-0.5 rounded
                            text-[10px] tracking-wide
                            ${receitaBadgeCls(p.receitaTipo as ReceitaTipo)}`}
              >
                {p.receitaTipo}
              </span>
            )}
            <BotaoBulaAnvisa nomeMedicamento={p.medicamento} />
          </div>

          <p className="text-sm text-[#D0D5D5]">{p.doseDescricao}</p>

          <dl className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 text-xs text-[#9AA8A8]">
            <Meta icon={<Clock size={11} strokeWidth={1.5} />}>
              {p.horarios.map((h) => formatHora(h)).join(' · ')}
            </Meta>
            <Meta icon={<Calendar size={11} strokeWidth={1.5} />}>
              início {formatData(p.inicioEm)}
              {p.fimEm ? ` · fim ${formatData(p.fimEm)}` : ' · contínuo'}
            </Meta>
            {p.receitaValidade && (
              <Meta icon={<ScrollText size={11} strokeWidth={1.5} />}>
                receita até {formatData(p.receitaValidade)}
              </Meta>
            )}
          </dl>

          {p.observacoes && (
            <div className="mt-3 pt-3 border-t border-[#00D9C0]/[0.08] flex gap-2">
              <StickyNote
                size={12}
                strokeWidth={1.5}
                className="shrink-0 mt-0.5 text-[#00D9C0]/70"
              />
              <p className="text-xs text-[#D0D5D5] leading-relaxed italic">
                {p.observacoes}
              </p>
            </div>
          )}
        </div>

        <div className="flex flex-row sm:flex-col gap-2 self-start">
        <button
          type="button"
          onClick={onModificar}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#00D9C0]/20 text-xs text-[#9AA8A8] hover:text-[#00D9C0] hover:border-[#00D9C0]/40 hover:bg-[#00D9C0]/10 transition-all"
        >
          <Pencil size={12} strokeWidth={1.5} />
          modificar
        </button>
        <button
          onClick={onDesativar}
          disabled={desativando}
          className="self-start inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg
                     border border-[#00D9C0]/[0.08] text-xs text-[#9AA8A8]
                     hover:text-red-300 hover:border-red-500/40 hover:bg-red-500/10
                     transition-all disabled:opacity-50"
        >
          <Trash2 size={12} strokeWidth={1.5} />
          {desativando ? 'encerrando…' : 'encerrar'}
        </button>
        </div>
      </div>
    </motion.li>
  )
}

function HistoricoBloco({ prescricoes }: { prescricoes: Prescricao[] }) {
  const [aberto, setAberto] = useState(false)
  return (
    <details
      onToggle={(e) => setAberto((e.target as HTMLDetailsElement).open)}
      className="rounded-2xl border border-[#00D9C0]/[0.08] bg-[#111818] overflow-hidden"
    >
      <summary
        className="cursor-pointer list-none px-5 py-4 flex items-center justify-between
                   hover:bg-[#111818] transition-colors"
      >
        <span className="text-[12px] font-medium tracking-wide text-[#9AA8A8] flex items-center gap-2">
          <ScrollText size={12} strokeWidth={2} /> Histórico de prescrições
        </span>
        <span className="flex items-center gap-2 text-[#9AA8A8]">
          <span className="text-xs tabular-nums">
            {String(prescricoes.length).padStart(2, '0')}
          </span>
          <ChevronDown
            size={14}
            strokeWidth={1.5}
            className={`transition-transform ${aberto ? 'rotate-180' : ''}`}
          />
        </span>
      </summary>
      <ul className="px-5 pb-5 space-y-2">
        {prescricoes.map((p) => (
          <li
            key={p.id}
            className="py-2 border-t border-[#00D9C0]/[0.08] text-sm text-[#D0D5D5]
                       flex flex-wrap items-baseline gap-2"
          >
            <span className="font-medium text-[#F5F7F7]">{p.medicamento}</span>
            <span className="text-xs text-[#9AA8A8]">·</span>
            <span className="text-xs text-[#9AA8A8]">{p.doseDescricao}</span>
            <span className="ml-auto text-[10px] tracking-wide text-[#9AA8A8]/70">
              de {formatData(p.inicioEm)}{p.fimEm ? ` a ${formatData(p.fimEm)}` : ''}
            </span>
          </li>
        ))}
      </ul>
    </details>
  )
}

// ═════════════════════════════════════════════════════════════════════════════
// Subcomponentes utilitários
// ═════════════════════════════════════════════════════════════════════════════

function CampoEsboco({
  label,
  htmlFor,
  hint,
  children,
}: {
  label: string
  htmlFor: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="block text-[12px] font-medium tracking-wide text-[#9AA8A8] mb-1.5">
        {label}
      </label>
      {children}
      {hint && (
        <p className="mt-1 text-[11px] text-[#9AA8A8] leading-relaxed">{hint}</p>
      )}
    </div>
  )
}

function Meta({
  icon,
  children,
}: {
  icon: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className="inline-flex items-center gap-1.5">
      <span className="opacity-70">{icon}</span>
      <span>{children}</span>
    </div>
  )
}

const inputEsbocoCls =
  'w-full px-3 py-2 bg-[#0A0E0E] border border-[#00D9C0]/[0.12] rounded-lg text-sm text-[#F5F7F7] ' +
  'placeholder:text-[#9AA8A8]/60 focus:outline-none focus:border-[#00D9C0]/40 ' +
  'focus:ring-2 focus:ring-[#00D9C0]/30 transition-all'

// ─── Helpers ──────────────────────────────────────────────────────────────

function hojeIso(): string {
  return new Date().toISOString().slice(0, 10)
}

function primeiroNome(nome: string | null): string {
  if (!nome) return 'paciente'
  return nome.trim().split(/\s+/)[0] ?? nome
}

function formatHora(raw: string): string {
  // backend devolve "HH:MM:SS" — exibir só HH:MM
  return raw.slice(0, 5)
}

function formatData(iso: string): string {
  // Aceita 'YYYY-MM-DD' ou ISO completo. Sem timezone-juggle.
  const d = iso.length === 10 ? new Date(`${iso}T00:00:00`) : new Date(iso)
  if (isNaN(d.getTime())) return iso
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
}

function receitaBadgeCls(tipo: ReceitaTipo): string {
  switch (tipo) {
    case 'B1':
      return 'bg-blue-500/10 border border-blue-500/30 text-blue-300'
    case 'B2':
      return 'bg-amber-500/10 border border-amber-500/30 text-amber-300'
    case 'C1':
      return 'bg-[#00D9C0]/10 border border-[#00D9C0]/30 text-[#00D9C0]'
    default:
      return 'bg-[#0A0E0E] border border-[#00D9C0]/[0.08] text-[#9AA8A8]'
  }
}
