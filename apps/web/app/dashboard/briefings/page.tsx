"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Brain,
  Sparkles,
  Loader2,
  Search,
  ChevronDown,
  ChevronRight,
  Clock,
  Video,
  ArrowRight,
} from "lucide-react"
import { useMe } from "@/lib/use-me"
import { FEATURE, temFeature, readFeatureGate } from "@/lib/feature-gate"
import { UpsellFeature } from "@/components/assinatura/upsell-feature"
import { useFeatureUpsell } from "@/components/assinatura/feature-upsell"

// ── Tipos (espelham ConsultaBriefingItem / ResumoPreConsultaDto do gateway) ──
interface BriefingLite {
  id: string
  severidade: string
  criadoEm: string
}
interface ConsultaBriefing {
  consultaId: string
  pacienteId: string
  pacienteNome: string | null
  iniciaEm: string
  duracaoMin: number
  modalidade: string
  status: string
  briefing: BriefingLite | null
}
interface ResumoFull {
  id: string
  titulo: string
  conteudo: string
  severidade: string
  criadoEm: string
}
interface PacienteLite {
  id: string
  nome: string
  email: string | null
}
interface RespostaResumo {
  resumo?: ResumoFull | null
  ultimo?: ResumoFull | null
  aviso?: string
}
interface GerarResp {
  resumo: ResumoFull | null
  erro: string | null
}
type Gate = { feature: string } | null
type On402 = (gate: Gate) => boolean

// ── Constantes ──
const ERRO_GERAR = "Não foi possível gerar a síntese agora. Tente novamente em instantes."
const AVISO_VAZIO = "A síntese não foi gerada — pode faltar histórico recente deste paciente."

const SEVERIDADE: Record<string, { label: string; cls: string }> = {
  info: { label: "Info", cls: "bg-muted text-muted-foreground" },
  baixa: { label: "Baixa", cls: "bg-primary/10 text-primary" },
  media: { label: "Média", cls: "bg-warning/15 text-warning" },
  alta: { label: "Alta", cls: "bg-destructive/15 text-destructive" },
  critica: { label: "Crítica", cls: "bg-destructive text-white" },
}
const JANELAS = [
  { dias: 1, label: "24h" },
  { dias: 2, label: "48h" },
  { dias: 7, label: "7 dias" },
]

// ── Helpers puros ──
const iniciais = (nome: string | null): string => {
  if (!nome) return "?"
  const partes = nome.trim().split(/\s+/)
  const ini = (partes[0]?.[0] ?? "") + (partes.length > 1 ? partes[partes.length - 1][0] : "")
  return ini.toUpperCase() || "?"
}
const ymd = (data: Date): string => data.toISOString().slice(0, 10)
const quando = (iso: string): string =>
  new Date(iso).toLocaleString("pt-BR", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  })
const formatarDataHora = (iso: string): string => new Date(iso).toLocaleString("pt-BR")
const severidadeInfo = (severidade: string) => SEVERIDADE[severidade] ?? SEVERIDADE.info
const parseResumo = (data: RespostaResumo | null): ResumoFull | null =>
  data?.resumo ?? data?.ultimo ?? null
const avisoDe = (data: RespostaResumo | null): string => data?.aviso ?? AVISO_VAZIO

// ── Acesso de dados (compartilhado entre hub e avulso) ──
const gerarResumo = async (pacienteId: string, on402: On402): Promise<GerarResp> => {
  try {
    const resp = await fetch(`/api/pacientes/${pacienteId}/resumo-pre-consulta`, { method: "POST" })
    if (on402(await readFeatureGate(resp))) return { resumo: null, erro: null }
    if (!resp.ok) return { resumo: null, erro: ERRO_GERAR }
    const data = (await resp.json().catch(() => null)) as RespostaResumo | null
    const novo = parseResumo(data)
    return { resumo: novo, erro: novo ? null : avisoDe(data) }
  } catch {
    return { resumo: null, erro: ERRO_GERAR }
  }
}
const carregarUltimo = async (pacienteId: string, on402: On402): Promise<ResumoFull | null> => {
  try {
    const resp = await fetch(`/api/pacientes/${pacienteId}/resumo-pre-consulta`)
    if (on402(await readFeatureGate(resp))) return null
    const data = (await resp.json().catch(() => null)) as RespostaResumo | null
    return data?.ultimo ?? null
  } catch {
    return null
  }
}

// ── Componentes de apresentação ──
const SeveridadeBadge = ({ severidade }: { severidade: string }) => {
  const sev = severidadeInfo(severidade)
  return <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${sev.cls}`}>{sev.label}</span>
}

const BriefingTexto = ({ full }: { full: ResumoFull }) => (
  <>
    {full.titulo && <p className="mb-1 text-sm font-medium text-foreground">{full.titulo}</p>}
    <p className="whitespace-pre-line text-sm leading-relaxed text-foreground">{full.conteudo}</p>
    <p className="mt-3 text-xs text-muted-foreground">
      Gerado em {formatarDataHora(full.criadoEm)} · revisão do médico obrigatória
    </p>
  </>
)

const StatusBriefing = ({ briefing }: { briefing: BriefingLite | null }) =>
  briefing ? (
    <div className="flex items-center gap-2">
      <Badge variant="outline" className="text-[11px]">
        Gerado
      </Badge>
      <SeveridadeBadge severidade={briefing.severidade} />
    </div>
  ) : (
    <Badge className="border-0 bg-amber-500/10 text-[11px] text-amber-600">Pendente</Badge>
  )

const BriefingExpandido = ({
  carregando,
  full,
}: {
  carregando: boolean
  full: ResumoFull | null
}) => (
  <div className="mt-3 rounded-xl border border-primary/15 bg-primary/[0.04] p-4">
    {carregando ? (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Carregando síntese…
      </div>
    ) : full ? (
      <BriefingTexto full={full} />
    ) : (
      <p className="text-sm text-muted-foreground">Sem síntese disponível.</p>
    )}
  </div>
)

const CabecalhoLinha = ({ consulta }: { consulta: ConsultaBriefing }) => (
  <>
    <Avatar className="h-10 w-10 border border-primary/20">
      <AvatarFallback className="bg-secondary text-sm font-semibold text-primary">
        {iniciais(consulta.pacienteNome)}
      </AvatarFallback>
    </Avatar>
    <div className="min-w-0 flex-1">
      <p className="truncate font-medium text-foreground">{consulta.pacienteNome ?? "Paciente"}</p>
      <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
        <Clock className="h-3 w-3" />
        <span className="capitalize">{quando(consulta.iniciaEm)}</span>
        {consulta.modalidade === "teleconsulta" && <Video className="h-3 w-3 text-primary" />}
      </div>
    </div>
  </>
)

const AcoesLinha = ({
  consultaId,
  temBriefing,
  aberto,
  gerando,
  onGerar,
  onAbrir,
}: {
  consultaId: string
  temBriefing: boolean
  aberto: boolean
  gerando: boolean
  onGerar: () => void
  onAbrir: () => void
}) => (
  <div className="flex items-center gap-1.5">
    <Button size="sm" variant="outline" onClick={onGerar} disabled={gerando} className="gap-1.5 text-xs">
      {gerando ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
      {temBriefing ? "Atualizar" : "Gerar"}
    </Button>
    {temBriefing && (
      <Button size="sm" variant="ghost" onClick={onAbrir} className="gap-1 text-xs text-muted-foreground">
        {aberto ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        Ler
      </Button>
    )}
    <Button size="sm" variant="ghost" asChild className="text-xs text-muted-foreground">
      <Link href={`/dashboard/consultas/${consultaId}/briefing`}>Abrir</Link>
    </Button>
  </div>
)

const LinhaBriefing = ({ consulta, on402 }: { consulta: ConsultaBriefing; on402: On402 }) => {
  const [briefing, setBriefing] = useState<BriefingLite | null>(consulta.briefing)
  const [aberto, setAberto] = useState(false)
  const [full, setFull] = useState<ResumoFull | null>(null)
  const [carregando, setCarregando] = useState(false)
  const [gerando, setGerando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  const aoAbrir = async () => {
    if (aberto) {
      setAberto(false)
      return
    }
    setAberto(true)
    if (full || !briefing) return
    setCarregando(true)
    setFull(await carregarUltimo(consulta.pacienteId, on402))
    setCarregando(false)
  }

  const aoGerar = async () => {
    setGerando(true)
    setErro(null)
    const { resumo: novo, erro: msg } = await gerarResumo(consulta.pacienteId, on402)
    if (novo) {
      setFull(novo)
      setBriefing({ id: novo.id, severidade: novo.severidade, criadoEm: novo.criadoEm })
      setAberto(true)
    } else if (msg) {
      setErro(msg)
    }
    setGerando(false)
  }

  return (
    <div className="p-4">
      <div className="flex flex-wrap items-center gap-3">
        <CabecalhoLinha consulta={consulta} />
        <StatusBriefing briefing={briefing} />
        <AcoesLinha
          consultaId={consulta.consultaId}
          temBriefing={briefing !== null}
          aberto={aberto}
          gerando={gerando}
          onGerar={aoGerar}
          onAbrir={aoAbrir}
        />
      </div>
      {aberto && <BriefingExpandido carregando={carregando} full={full} />}
      {erro && !gerando && <p className="mt-2 text-xs text-destructive">{erro}</p>}
    </div>
  )
}

const JanelaSeletor = ({ dias, onSelect }: { dias: number; onSelect: (d: number) => void }) => (
  <div className="flex gap-1 rounded-lg bg-muted/50 p-1">
    {JANELAS.map((janela) => (
      <button
        key={janela.dias}
        type="button"
        onClick={() => onSelect(janela.dias)}
        className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
          dias === janela.dias
            ? "bg-primary text-primary-foreground"
            : "text-muted-foreground hover:text-foreground"
        }`}
      >
        {janela.label}
      </button>
    ))}
  </div>
)

const ListaConsultas = ({
  loading,
  erro,
  itens,
  on402,
}: {
  loading: boolean
  erro: boolean
  itens: ConsultaBriefing[]
  on402: On402
}) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center p-10 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    )
  }
  if (erro) {
    return (
      <div className="p-8 text-center text-sm text-destructive">
        Não foi possível carregar as próximas consultas. Tente novamente.
      </div>
    )
  }
  if (itens.length === 0) {
    return (
      <div className="p-8 text-center text-sm text-muted-foreground">
        Nenhuma consulta agendada nesta janela.
      </div>
    )
  }
  return (
    <div className="divide-y divide-border">
      {itens.map((consulta) => (
        <LinhaBriefing key={consulta.consultaId} consulta={consulta} on402={on402} />
      ))}
    </div>
  )
}

// ── Seção A — Hub de próximas consultas ──
const ProximasConsultas = ({ on402 }: { on402: On402 }) => {
  const [dias, setDias] = useState(2)
  const [itens, setItens] = useState<ConsultaBriefing[]>([])
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState(false)

  useEffect(() => {
    let vivo = true
    setLoading(true)
    setErro(false)
    const hoje = new Date()
    const ate = new Date()
    ate.setDate(hoje.getDate() + dias)
    fetch(`/api/briefings?de=${ymd(hoje)}&ate=${ymd(ate)}`)
      .then(async (resp) => {
        if (on402(await readFeatureGate(resp))) return []
        if (!resp.ok) throw new Error()
        return resp.json()
      })
      .then((lista) => {
        if (vivo) setItens(Array.isArray(lista) ? lista : [])
      })
      .catch(() => {
        if (vivo) setErro(true)
      })
      .finally(() => {
        if (vivo) setLoading(false)
      })
    return () => {
      vivo = false
    }
  }, [dias, on402])

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold text-foreground">Próximas consultas</h2>
        </div>
        <JanelaSeletor dias={dias} onSelect={setDias} />
      </div>
      <Card className="border-border/50">
        <CardContent className="p-0">
          <ListaConsultas loading={loading} erro={erro} itens={itens} on402={on402} />
        </CardContent>
      </Card>
    </section>
  )
}

// ── Seção B — Gerar avulso ──
const BuscaPaciente = ({ valor, onChange }: { valor: string; onChange: (v: string) => void }) => (
  <div className="relative">
    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
    <Input
      type="search"
      placeholder="Buscar paciente por nome…"
      value={valor}
      onChange={(evento) => onChange(evento.target.value)}
      className="bg-background pl-9"
    />
  </div>
)

const ListaPacientes = ({
  pacientes,
  gerando,
  selecionadoId,
  onGerar,
}: {
  pacientes: PacienteLite[]
  gerando: boolean
  selecionadoId: string | null
  onGerar: (p: PacienteLite) => void
}) => (
  <div className="divide-y divide-border rounded-lg border border-border/50">
    {pacientes.map((paciente) => {
      const ocupado = gerando && selecionadoId === paciente.id
      return (
        <div key={paciente.id} className="flex items-center gap-3 p-3">
          <Avatar className="h-9 w-9 border border-primary/20">
            <AvatarFallback className="bg-secondary text-xs font-semibold text-primary">
              {iniciais(paciente.nome)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-foreground">{paciente.nome}</p>
            {paciente.email && <p className="truncate text-xs text-muted-foreground">{paciente.email}</p>}
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onGerar(paciente)}
            disabled={ocupado}
            className="gap-1.5 text-xs"
          >
            {ocupado ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
            Gerar
          </Button>
        </div>
      )
    })}
  </div>
)

const ResultadoAvulso = ({ paciente, resultado }: { paciente: PacienteLite; resultado: ResumoFull }) => (
  <div className="rounded-xl border border-primary/15 bg-primary/[0.04] p-4">
    <div className="mb-2 flex items-center justify-between gap-2">
      <p className="text-sm font-semibold text-primary">{paciente.nome}</p>
      <SeveridadeBadge severidade={resultado.severidade} />
    </div>
    <BriefingTexto full={resultado} />
    <div className="mt-3 flex justify-end">
      <Button size="sm" variant="ghost" asChild className="gap-1 text-xs">
        <Link href={`/dashboard/prontuarios/${paciente.id}`}>
          Abrir prontuário <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </Button>
    </div>
  </div>
)

const AvulsoFeedback = ({
  vazio,
  erro,
  paciente,
  resultado,
}: {
  vazio: boolean
  erro: string | null
  paciente: PacienteLite | null
  resultado: ResumoFull | null
}) => (
  <>
    {vazio && <p className="px-1 text-sm text-muted-foreground">Nenhum paciente encontrado.</p>}
    {erro && <p className="text-sm text-destructive">{erro}</p>}
    {paciente && resultado && <ResultadoAvulso paciente={paciente} resultado={resultado} />}
  </>
)

const GerarAvulso = ({ on402 }: { on402: On402 }) => {
  const [pacientes, setPacientes] = useState<PacienteLite[]>([])
  const [busca, setBusca] = useState("")
  const [selecionado, setSelecionado] = useState<PacienteLite | null>(null)
  const [gerando, setGerando] = useState(false)
  const [resultado, setResultado] = useState<ResumoFull | null>(null)
  const [erro, setErro] = useState<string | null>(null)

  useEffect(() => {
    fetch("/api/pacientes/")
      .then((resp) => (resp.ok ? resp.json() : []))
      .then((lista) => setPacientes(Array.isArray(lista) ? lista : []))
      .catch(() => setPacientes([]))
  }, [])

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLowerCase()
    if (!termo) return [] as PacienteLite[]
    return pacientes.filter((paciente) => paciente.nome.toLowerCase().includes(termo)).slice(0, 8)
  }, [busca, pacientes])

  const aoGerar = async (paciente: PacienteLite) => {
    setSelecionado(paciente)
    setGerando(true)
    setErro(null)
    setResultado(null)
    const { resumo: novo, erro: msg } = await gerarResumo(paciente.id, on402)
    if (novo) setResultado(novo)
    else if (msg) setErro(msg)
    setGerando(false)
  }

  const buscaAtiva = busca.trim().length > 0
  const vazio = buscaAtiva && filtrados.length === 0
  const erroVisivel = gerando ? null : erro

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-semibold text-foreground">Gerar avulso</h2>
        <span className="text-xs text-muted-foreground">
          qualquer paciente, sem precisar de consulta agendada
        </span>
      </div>
      <Card className="border-border/50">
        <CardContent className="space-y-3 p-4">
          <BuscaPaciente valor={busca} onChange={setBusca} />
          {filtrados.length > 0 && (
            <ListaPacientes
              pacientes={filtrados}
              gerando={gerando}
              selecionadoId={selecionado?.id ?? null}
              onGerar={aoGerar}
            />
          )}
          <AvulsoFeedback vazio={vazio} erro={erroVisivel} paciente={selecionado} resultado={resultado} />
        </CardContent>
      </Card>
    </section>
  )
}

const BriefingsPage = () => {
  const me = useMe()
  const { showUpsell } = useFeatureUpsell()
  // Gate (ADR-059): briefing IA está em todos os planos pagos; plano nulo/legado é
  // bloqueado. Trava proativa (me.features) + reativa (402 ao listar/gerar).
  const [bloqueado, setBloqueado] = useState(false)
  // useCallback p/ identidade estável: ProximasConsultas usa on402 dentro de um
  // useEffect; sem isso, cada render refazia o fetch.
  const on402 = useCallback(
    (gate: Gate): boolean => {
      if (!gate) return false
      setBloqueado(true)
      showUpsell(gate.feature)
      return true
    },
    [showUpsell]
  )
  const semBriefing = (me?.features != null && !temFeature(me.features, FEATURE.briefingIa)) || bloqueado

  return (
    <div className="min-h-screen">
      <Header title="Briefings" subtitle="Sínteses de IA pré-consulta" />
      <div className="mx-auto max-w-4xl space-y-8 p-6">
        {semBriefing ? (
          <UpsellFeature feature={FEATURE.briefingIa} />
        ) : (
          <>
            <ProximasConsultas on402={on402} />
            <GerarAvulso on402={on402} />
            <p className="border-t border-border/50 pt-4 text-xs text-muted-foreground">
              Cérebro Amigo organiza fatos do período entre consultas — a revisão e a decisão
              clínica são sempre suas.
            </p>
          </>
        )}
      </div>
    </div>
  )
}

export default BriefingsPage
