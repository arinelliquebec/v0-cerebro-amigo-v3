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

// ── Helpers ──
function iniciais(nome: string | null): string {
  if (!nome) return "?"
  const p = nome.trim().split(/\s+/)
  return ((p[0]?.[0] ?? "") + (p.length > 1 ? p[p.length - 1][0] : "")).toUpperCase() || "?"
}
function ymd(d: Date): string {
  return d.toISOString().slice(0, 10)
}
function quando(iso: string): string {
  return new Date(iso).toLocaleString("pt-BR", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  })
}

const SEVERIDADE: Record<string, { label: string; cls: string }> = {
  info: { label: "Info", cls: "bg-muted text-muted-foreground" },
  baixa: { label: "Baixa", cls: "bg-primary/10 text-primary" },
  media: { label: "Média", cls: "bg-warning/15 text-warning" },
  alta: { label: "Alta", cls: "bg-destructive/15 text-destructive" },
  critica: { label: "Crítica", cls: "bg-destructive text-white" },
}
function SeveridadeBadge({ severidade }: { severidade: string }) {
  const s = SEVERIDADE[severidade] ?? SEVERIDADE.info
  return <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${s.cls}`}>{s.label}</span>
}

const JANELAS = [
  { dias: 1, label: "24h" },
  { dias: 2, label: "48h" },
  { dias: 7, label: "7 dias" },
]

export default function BriefingsPage() {
  const me = useMe()
  const { showUpsell } = useFeatureUpsell()
  // Gate (ADR-059): briefing IA está em todos os planos pagos; plano nulo/legado é
  // bloqueado. Trava proativa (me.features) + reativa (402 ao listar/gerar).
  const [bloqueado, setBloqueado] = useState(false)
  const semBriefing =
    (me?.features != null && !temFeature(me.features, FEATURE.briefingIa)) || bloqueado

  // useCallback p/ identidade estável: ProximasConsultas usa on402 dentro de um
  // useEffect; sem isso, cada render refazia o fetch.
  const on402 = useCallback(
    (gate: { feature: string } | null): boolean => {
      if (!gate) return false
      setBloqueado(true)
      showUpsell(gate.feature)
      return true
    },
    [showUpsell]
  )

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

// ─────────────────────────────────────────────────────────────────────────────
// Seção A — Hub de próximas consultas com status do briefing
// ─────────────────────────────────────────────────────────────────────────────
function ProximasConsultas({ on402 }: { on402: (g: { feature: string } | null) => boolean }) {
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
      .then(async (r) => {
        if (on402(await readFeatureGate(r))) return [] as ConsultaBriefing[]
        if (!r.ok) throw new Error()
        return r.json()
      })
      .then((d) => {
        if (vivo) setItens(Array.isArray(d) ? d : [])
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
        <div className="flex gap-1 rounded-lg bg-muted/50 p-1">
          {JANELAS.map((j) => (
            <button
              key={j.dias}
              type="button"
              onClick={() => setDias(j.dias)}
              className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                dias === j.dias
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {j.label}
            </button>
          ))}
        </div>
      </div>

      <Card className="border-border/50">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center p-10 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          ) : erro ? (
            <div className="p-8 text-center text-sm text-destructive">
              Não foi possível carregar as próximas consultas. Tente novamente.
            </div>
          ) : itens.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              Nenhuma consulta agendada nesta janela.
            </div>
          ) : (
            <div className="divide-y divide-border">
              {itens.map((c) => (
                <LinhaBriefing key={c.consultaId} consulta={c} on402={on402} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  )
}

function LinhaBriefing({
  consulta,
  on402,
}: {
  consulta: ConsultaBriefing
  on402: (g: { feature: string } | null) => boolean
}) {
  const [briefing, setBriefing] = useState<BriefingLite | null>(consulta.briefing)
  const [aberto, setAberto] = useState(false)
  const [full, setFull] = useState<ResumoFull | null>(null)
  const [carregando, setCarregando] = useState(false)
  const [gerando, setGerando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  async function abrir() {
    if (aberto) {
      setAberto(false)
      return
    }
    setAberto(true)
    if (full || !briefing) return
    setCarregando(true)
    setErro(null)
    try {
      const r = await fetch(`/api/pacientes/${consulta.pacienteId}/resumo-pre-consulta`)
      if (on402(await readFeatureGate(r))) return
      const data = await r.json().catch(() => null)
      setFull(data?.ultimo ?? null)
    } catch {
      setErro("Não foi possível carregar a síntese.")
    } finally {
      setCarregando(false)
    }
  }

  async function gerar() {
    setGerando(true)
    setErro(null)
    try {
      const r = await fetch(`/api/pacientes/${consulta.pacienteId}/resumo-pre-consulta`, {
        method: "POST",
      })
      if (on402(await readFeatureGate(r))) return
      if (!r.ok) {
        setErro("Não foi possível gerar a síntese agora. Tente novamente em instantes.")
        return
      }
      const data = await r.json().catch(() => null)
      const novo: ResumoFull | null = data?.resumo ?? data?.ultimo ?? null
      if (novo) {
        setFull(novo)
        setBriefing({ id: novo.id, severidade: novo.severidade, criadoEm: novo.criadoEm })
        setAberto(true)
      } else {
        setErro(
          data?.aviso ??
            "A síntese não foi gerada — pode faltar histórico recente deste paciente."
        )
      }
    } catch {
      setErro("Não foi possível gerar a síntese agora. Tente novamente em instantes.")
    } finally {
      setGerando(false)
    }
  }

  return (
    <div className="p-4">
      <div className="flex flex-wrap items-center gap-3">
        <Avatar className="h-10 w-10 border border-primary/20">
          <AvatarFallback className="bg-secondary text-sm font-semibold text-primary">
            {iniciais(consulta.pacienteNome)}
          </AvatarFallback>
        </Avatar>

        <div className="min-w-0 flex-1">
          <p className="truncate font-medium text-foreground">
            {consulta.pacienteNome ?? "Paciente"}
          </p>
          <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span className="capitalize">{quando(consulta.iniciaEm)}</span>
            {consulta.modalidade === "teleconsulta" && (
              <Video className="h-3 w-3 text-primary" />
            )}
          </div>
        </div>

        {briefing ? (
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="gap-1 text-[11px]">
              Gerado
            </Badge>
            <SeveridadeBadge severidade={briefing.severidade} />
          </div>
        ) : (
          <Badge className="border-0 bg-amber-500/10 text-[11px] text-amber-600">Pendente</Badge>
        )}

        <div className="flex items-center gap-1.5">
          <Button
            size="sm"
            variant="outline"
            onClick={gerar}
            disabled={gerando}
            className="gap-1.5 text-xs"
          >
            {gerando ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Sparkles className="h-3.5 w-3.5" />
            )}
            {briefing ? "Atualizar" : "Gerar"}
          </Button>
          {briefing && (
            <Button
              size="sm"
              variant="ghost"
              onClick={abrir}
              className="gap-1 text-xs text-muted-foreground"
            >
              {aberto ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              Ler
            </Button>
          )}
          <Button size="sm" variant="ghost" asChild className="text-xs text-muted-foreground">
            <Link href={`/dashboard/consultas/${consulta.consultaId}/briefing`}>Abrir</Link>
          </Button>
        </div>
      </div>

      {aberto && (
        <div className="mt-3 rounded-xl border border-primary/15 bg-primary/[0.04] p-4">
          {carregando ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Carregando síntese…
            </div>
          ) : full ? (
            <>
              {full.titulo && (
                <p className="mb-1 text-sm font-medium text-foreground">{full.titulo}</p>
              )}
              <p className="whitespace-pre-line text-sm leading-relaxed text-foreground">
                {full.conteudo}
              </p>
              <p className="mt-3 text-xs text-muted-foreground">
                Gerado em {new Date(full.criadoEm).toLocaleString("pt-BR")} · revisão do médico
                obrigatória
              </p>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">Sem síntese disponível.</p>
          )}
        </div>
      )}

      {erro && !gerando && <p className="mt-2 text-xs text-destructive">{erro}</p>}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Seção B — Gerar briefing avulso (qualquer paciente, sem consulta agendada)
// ─────────────────────────────────────────────────────────────────────────────
function GerarAvulso({ on402 }: { on402: (g: { feature: string } | null) => boolean }) {
  const [pacientes, setPacientes] = useState<PacienteLite[]>([])
  const [busca, setBusca] = useState("")
  const [selecionado, setSelecionado] = useState<PacienteLite | null>(null)
  const [gerando, setGerando] = useState(false)
  const [resultado, setResultado] = useState<ResumoFull | null>(null)
  const [erro, setErro] = useState<string | null>(null)

  useEffect(() => {
    fetch("/api/pacientes/")
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => setPacientes(Array.isArray(d) ? d : []))
      .catch(() => setPacientes([]))
  }, [])

  const filtrados = useMemo(() => {
    const q = busca.trim().toLowerCase()
    if (!q) return [] as PacienteLite[]
    return pacientes.filter((p) => p.nome.toLowerCase().includes(q)).slice(0, 8)
  }, [busca, pacientes])

  async function gerar(p: PacienteLite) {
    setSelecionado(p)
    setGerando(true)
    setErro(null)
    setResultado(null)
    try {
      const r = await fetch(`/api/pacientes/${p.id}/resumo-pre-consulta`, { method: "POST" })
      if (on402(await readFeatureGate(r))) return
      if (!r.ok) {
        setErro("Não foi possível gerar a síntese agora. Tente novamente em instantes.")
        return
      }
      const data = await r.json().catch(() => null)
      const novo: ResumoFull | null = data?.resumo ?? data?.ultimo ?? null
      if (novo) setResultado(novo)
      else
        setErro(
          data?.aviso ??
            "A síntese não foi gerada — pode faltar histórico recente deste paciente."
        )
    } catch {
      setErro("Não foi possível gerar a síntese agora. Tente novamente em instantes.")
    } finally {
      setGerando(false)
    }
  }

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
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Buscar paciente por nome…"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="bg-background pl-9"
            />
          </div>

          {filtrados.length > 0 && (
            <div className="divide-y divide-border rounded-lg border border-border/50">
              {filtrados.map((p) => (
                <div key={p.id} className="flex items-center gap-3 p-3">
                  <Avatar className="h-9 w-9 border border-primary/20">
                    <AvatarFallback className="bg-secondary text-xs font-semibold text-primary">
                      {iniciais(p.nome)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">{p.nome}</p>
                    {p.email && (
                      <p className="truncate text-xs text-muted-foreground">{p.email}</p>
                    )}
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => gerar(p)}
                    disabled={gerando && selecionado?.id === p.id}
                    className="gap-1.5 text-xs"
                  >
                    {gerando && selecionado?.id === p.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Sparkles className="h-3.5 w-3.5" />
                    )}
                    Gerar
                  </Button>
                </div>
              ))}
            </div>
          )}

          {busca.trim() && filtrados.length === 0 && (
            <p className="px-1 text-sm text-muted-foreground">Nenhum paciente encontrado.</p>
          )}

          {erro && !gerando && <p className="text-sm text-destructive">{erro}</p>}

          {resultado && selecionado && (
            <div className="rounded-xl border border-primary/15 bg-primary/[0.04] p-4">
              <div className="mb-2 flex items-center justify-between gap-2">
                <p className="text-sm font-semibold text-primary">{selecionado.nome}</p>
                <SeveridadeBadge severidade={resultado.severidade} />
              </div>
              {resultado.titulo && (
                <p className="mb-1 text-sm font-medium text-foreground">{resultado.titulo}</p>
              )}
              <p className="whitespace-pre-line text-sm leading-relaxed text-foreground">
                {resultado.conteudo}
              </p>
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs text-muted-foreground">
                  Gerado em {new Date(resultado.criadoEm).toLocaleString("pt-BR")} · revisão do
                  médico obrigatória
                </p>
                <Button size="sm" variant="ghost" asChild className="gap-1 text-xs">
                  <Link href={`/dashboard/prontuarios/${selecionado.id}`}>
                    Abrir prontuário <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  )
}
