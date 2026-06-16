"use client"

import { Header } from "@/components/header"
import { BannerCrise } from "@/components/crise/banner-crise"
import { CondutaEditor } from "@/components/conduta/conduta-editor"
import { BotaoReceitaMemed } from "@/components/memed/botao-receita-memed"
import { ReceitasMemedAConfirmar } from "@/components/memed/receitas-a-confirmar"
import { VerificadorInteracoes } from "@/components/memed/verificador-interacoes"
import { EvolucaoEscalasPanel } from "@/components/escalas/EvolucaoEscalasPanel"
import { ExamesPanel } from "@/components/exames/ExamesPanel"
import { BuscaSemantica } from "@/components/rag/BuscaSemantica"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Search,
  FileText,
  Calendar,
  User,
  Pill,
  Activity,
  ChevronRight,
  AlertTriangle,
  MessageSquare,
  Loader2,
} from "lucide-react"
import { useState, useEffect, useCallback } from "react"

interface Paciente {
  id: string
  numero: number
  nome: string
  email: string
  prescricoesAtivas: number
  ultimaMsg: string | null
  dataNascimento: string | null
}

interface TimelineItem {
  tipo: string
  quando: string
  titulo: string
  descricao: string
  intensidade: number | null
  origem: string
}

interface Prescricao {
  id: string
  medicamentoNome: string
  posologia: string
  ativa: boolean
  inicioEm: string
}

function initials(nome: string) {
  return nome
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join("")
}

function age(dataNascimento: string | null) {
  if (!dataNascimento) return null
  const diff = Date.now() - new Date(dataNascimento).getTime()
  return Math.floor(diff / (365.25 * 24 * 3600 * 1000))
}

function relativeDate(iso: string | null) {
  if (!iso) return "—"
  return new Date(iso).toLocaleDateString("pt-BR")
}

const TIPO_ICON: Record<string, React.ReactNode> = {
  mensagem: <MessageSquare className="h-4 w-4 text-primary" />,
  sintoma: <Activity className="h-4 w-4 text-blue-500" />,
  evento: <Calendar className="h-4 w-4 text-purple-500" />,
  crise: <AlertTriangle className="h-4 w-4 text-red-500" />,
}

const TIPO_LABEL: Record<string, string> = {
  mensagem: "Mensagem",
  sintoma: "Sintoma",
  evento: "Evento",
  crise: "Crise",
}

export default function ProntuariosPage() {
  const [pacientes, setPacientes] = useState<Paciente[]>([])
  const [selected, setSelected] = useState<Paciente | null>(null)
  const [timeline, setTimeline] = useState<TimelineItem[]>([])
  const [prescricoes, setPrescricoes] = useState<Prescricao[]>([])
  const [search, setSearch] = useState("")
  const [loadingList, setLoadingList] = useState(true)
  const [loadingTimeline, setLoadingTimeline] = useState(false)
  const [loadingPrescricoes, setLoadingPrescricoes] = useState(false)
  const [erroLista, setErroLista] = useState(false)
  const [erroTimeline, setErroTimeline] = useState(false)
  const [erroPrescricoes, setErroPrescricoes] = useState(false)
  // Sobe a cada receita MEMED espelhada → refaz a fila de confirmação.
  const [confirmacaoSignal, setConfirmacaoSignal] = useState(0)

  useEffect(() => {
    setErroLista(false)
    fetch("/api/pacientes")
      .then((r) => {
        if (!r.ok) throw new Error("falha ao carregar pacientes")
        return r.json()
      })
      .then((data: Paciente[]) => {
        setPacientes(data)
        // Deep-link ?paciente=<id> (lista de pacientes / fila de atenção) → seleciona aquele.
        const alvo = typeof window !== "undefined"
          ? new URLSearchParams(window.location.search).get("paciente")
          : null
        setSelected((alvo ? data.find((p) => p.id === alvo) : null) ?? data[0] ?? null)
      })
      .catch(() => setErroLista(true))
      .finally(() => setLoadingList(false))
  }, [])

  const fetchTimeline = useCallback((id: string) => {
    setLoadingTimeline(true)
    setErroTimeline(false)
    setTimeline([])
    fetch(`/api/pacientes/${id}/timeline?dias=60`)
      .then((r) => {
        if (!r.ok) throw new Error("falha ao carregar timeline")
        return r.json()
      })
      .then(setTimeline)
      .catch(() => setErroTimeline(true))
      .finally(() => setLoadingTimeline(false))
  }, [])

  const fetchPrescricoes = useCallback((id: string) => {
    setLoadingPrescricoes(true)
    setErroPrescricoes(false)
    setPrescricoes([])
    fetch(`/api/pacientes/${id}/prescricoes`)
      .then((r) => {
        if (!r.ok) throw new Error("falha ao carregar prescrições")
        return r.json()
      })
      .then(setPrescricoes)
      .catch(() => setErroPrescricoes(true))
      .finally(() => setLoadingPrescricoes(false))
  }, [])

  useEffect(() => {
    if (!selected) return
    fetchTimeline(selected.id)
    fetchPrescricoes(selected.id)
  }, [selected, fetchTimeline, fetchPrescricoes])

  const filtered = pacientes.filter((p) =>
    p.nome.toLowerCase().includes(search.toLowerCase()),
  )

  return (
    <div className="min-h-screen">
      <Header title="Prontuários" subtitle="Histórico clínico dos pacientes" />

      <div className="p-6">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Lista */}
          <Card className="border-border/50 lg:col-span-1">
            <CardHeader className="pb-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Buscar paciente..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 bg-muted/50 border-0 focus-visible:ring-primary"
                />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {loadingList ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : erroLista ? (
                <div className="text-center py-8 px-4">
                  <AlertTriangle className="h-8 w-8 text-amber-500 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">
                    Não foi possível carregar a lista de pacientes.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3"
                    onClick={() => {
                      setLoadingList(true)
                      setErroLista(false)
                      fetch("/api/pacientes")
                        .then((r) => {
                          if (!r.ok) throw new Error("falha ao carregar pacientes")
                          return r.json()
                        })
                        .then((data: Paciente[]) => {
                          setPacientes(data)
                          if (data.length > 0) setSelected(data[0])
                        })
                        .catch(() => setErroLista(true))
                        .finally(() => setLoadingList(false))
                    }}
                  >
                    Tentar novamente
                  </Button>
                </div>
              ) : filtered.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Nenhum paciente encontrado.
                </p>
              ) : (
                <div className="divide-y divide-border max-h-[calc(100vh-320px)] overflow-y-auto">
                  {filtered.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => setSelected(p)}
                      className={`w-full flex items-center gap-3 p-4 hover:bg-muted/50 transition-colors text-left ${
                        selected?.id === p.id ? "bg-secondary" : ""
                      }`}
                    >
                      <Avatar className="h-11 w-11 border-2 border-primary/20">
                        <AvatarFallback className="bg-secondary text-primary font-medium">
                          {initials(p.nome)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground truncate">{p.nome}</p>
                        <p className="text-xs text-muted-foreground">
                          {p.prescricoesAtivas} prescrição{p.prescricoesAtivas !== 1 ? "ões" : ""} ativa
                          {p.prescricoesAtivas !== 1 ? "s" : ""}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Última msg: {relativeDate(p.ultimaMsg)}
                        </p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Detalhe */}
          {selected && (
            <div className="lg:col-span-2 space-y-6">
              {/* Cabeçalho do paciente */}
              <Card className="border-border/50">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <Avatar className="h-16 w-16 border-2 border-primary/30">
                      <AvatarFallback className="bg-primary text-primary-foreground text-xl font-medium">
                        {initials(selected.nome)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h2 className="text-xl font-semibold text-foreground">{selected.nome}</h2>
                      <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                        {age(selected.dataNascimento) && (
                          <span className="flex items-center gap-1">
                            <User className="h-4 w-4" />
                            {age(selected.dataNascimento)} anos
                          </span>
                        )}
                        {selected.email && (
                          <span className="truncate">{selected.email}</span>
                        )}
                      </div>
                      <Badge className="mt-2 bg-secondary text-primary hover:bg-secondary">
                        Paciente #{selected.numero}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <BannerCrise
                pacienteId={selected.id}
                onRetomado={() => fetchTimeline(selected.id)}
              />

              <Tabs defaultValue="timeline" className="space-y-4">
                <TabsList className="bg-muted/50">
                  <TabsTrigger
                    value="timeline"
                    className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                  >
                    Timeline
                  </TabsTrigger>
                  <TabsTrigger
                    value="prescricoes"
                    className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                  >
                    Prescrições
                  </TabsTrigger>
                  <TabsTrigger
                    value="escalas"
                    className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                  >
                    Escalas
                  </TabsTrigger>
                  <TabsTrigger
                    value="busca"
                    className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                  >
                    Busca
                  </TabsTrigger>
                  <TabsTrigger
                    value="conduta"
                    className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                  >
                    Conduta
                  </TabsTrigger>
                  <TabsTrigger
                    value="exames"
                    className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                  >
                    Exames
                  </TabsTrigger>
                </TabsList>

                {/* Timeline */}
                <TabsContent value="timeline" className="space-y-3">
                  {loadingTimeline ? (
                    <div className="flex justify-center py-10">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    </div>
                  ) : erroTimeline ? (
                    <Card className="border-amber-500/40 bg-amber-500/5">
                      <CardContent className="p-6 text-center py-8">
                        <AlertTriangle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
                        <p className="text-sm text-foreground font-medium">
                          Não foi possível carregar o histórico deste paciente.
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Recarregue antes de tomar decisões clínicas — a lista abaixo pode estar incompleta.
                        </p>
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-4"
                          onClick={() => selected && fetchTimeline(selected.id)}
                        >
                          Tentar novamente
                        </Button>
                      </CardContent>
                    </Card>
                  ) : timeline.length === 0 ? (
                    <Card className="border-border/50">
                      <CardContent className="p-6 text-center py-8">
                        <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-sm text-muted-foreground">
                          Nenhum evento nos últimos 60 dias.
                        </p>
                      </CardContent>
                    </Card>
                  ) : (
                    timeline.map((item, i) => (
                      <Card key={i} className="border-border/50">
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3">
                            <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center shrink-0 mt-0.5">
                              {TIPO_ICON[item.tipo] ?? <FileText className="h-4 w-4" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <Badge variant="secondary" className="text-xs">
                                  {TIPO_LABEL[item.tipo] ?? item.tipo}
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                  {new Date(item.quando).toLocaleString("pt-BR")}
                                </span>
                              </div>
                              <p className="text-sm font-medium text-foreground">{item.titulo}</p>
                              {item.descricao && (
                                <p className="text-sm text-muted-foreground mt-0.5 line-clamp-3">
                                  {item.descricao}
                                </p>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </TabsContent>

                {/* Prescrições */}
                <TabsContent value="prescricoes" className="space-y-3">
                  <BotaoReceitaMemed
                    pacienteId={selected.id}
                    pacienteNome={selected.nome}
                    onReceitaRegistrada={() => setConfirmacaoSignal((s) => s + 1)}
                  />
                  <ReceitasMemedAConfirmar
                    pacienteId={selected.id}
                    refreshSignal={confirmacaoSignal}
                    onConfirmado={() => fetchPrescricoes(selected.id)}
                  />
                  <VerificadorInteracoes pacienteId={selected.id} />
                  {loadingPrescricoes ? (
                    <div className="flex justify-center py-10">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    </div>
                  ) : erroPrescricoes ? (
                    <Card className="border-amber-500/40 bg-amber-500/5">
                      <CardContent className="p-6 text-center py-8">
                        <AlertTriangle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
                        <p className="text-sm text-foreground font-medium">
                          Não foi possível carregar as prescrições deste paciente.
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Recarregue antes de tomar decisões clínicas — a lista pode estar incompleta.
                        </p>
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-4"
                          onClick={() => selected && fetchPrescricoes(selected.id)}
                        >
                          Tentar novamente
                        </Button>
                      </CardContent>
                    </Card>
                  ) : prescricoes.length === 0 ? (
                    <Card className="border-border/50">
                      <CardContent className="p-6 text-center py-8">
                        <Pill className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-sm text-muted-foreground">
                          Sem prescrições registradas.
                        </p>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="space-y-3">
                      {prescricoes.map((rx) => (
                        <Card key={rx.id} className="border-border/50">
                          <CardContent className="p-4 flex items-center gap-3">
                            <div className="h-9 w-9 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                              <Pill className="h-4 w-4 text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-foreground">{rx.medicamentoNome}</p>
                              <p className="text-sm text-muted-foreground">{rx.posologia}</p>
                            </div>
                            <Badge
                              className={
                                rx.ativa
                                  ? "bg-success/15 text-success"
                                  : "bg-muted text-muted-foreground"
                              }
                            >
                              {rx.ativa ? "Ativa" : "Inativa"}
                            </Badge>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="escalas">
                  <EvolucaoEscalasPanel pacienteId={selected.id} />
                </TabsContent>

                <TabsContent value="busca">
                  <BuscaSemantica pacienteId={selected.id} />
                </TabsContent>

                <TabsContent value="conduta">
                  <CondutaEditor pacienteId={selected.id} />
                </TabsContent>

                <TabsContent value="exames">
                  <ExamesPanel pacienteId={selected.id} />
                </TabsContent>
              </Tabs>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
