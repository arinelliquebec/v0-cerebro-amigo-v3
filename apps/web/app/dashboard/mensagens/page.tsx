"use client"

import { useEffect, useState } from "react"
import { Header } from "@/components/header"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Search, Loader2, ShieldCheck, MessageSquare, Bot, User } from "lucide-react"
import { tempoRelativo } from "@/lib/tempo"
import { EscalacaoInbox } from "@/components/escalacao/escalacao-inbox"
import { RascunhoAdmin } from "@/components/comunicacao/rascunho-admin"

interface ConversaInbox {
  pacienteId: string
  pacienteNome: string | null
  ultimaMensagem: string
  ultimaEm: string
  ultimoPapel: string
  total: number
}
interface Mensagem {
  id: string
  papel: string
  conteudo: string
  criadaEm: string
}

function iniciais(nome: string | null) {
  if (!nome) return "?"
  const p = nome.trim().split(/\s+/)
  return ((p[0]?.[0] ?? "") + (p.length > 1 ? p[p.length - 1][0] : "")).toUpperCase() || "?"
}
function horaMin(iso: string) {
  return new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
}

export default function MensagensPage() {
  const [inbox, setInbox] = useState<ConversaInbox[]>([])
  const [carregandoInbox, setCarregandoInbox] = useState(true)
  const [busca, setBusca] = useState("")

  const [sel, setSel] = useState<ConversaInbox | null>(null)
  const [thread, setThread] = useState<Mensagem[]>([])
  const [carregandoThread, setCarregandoThread] = useState(false)

  useEffect(() => {
    fetch("/api/mensagens")
      .then((r) => (r.ok ? r.json() : []))
      .then((rows) => {
        const lista = Array.isArray(rows) ? rows : []
        setInbox(lista)
        // Deep-link ?paciente=<id> → abre a conversa dele (se houver).
        const alvo = typeof window !== "undefined"
          ? new URLSearchParams(window.location.search).get("paciente")
          : null
        const c = alvo ? lista.find((x: ConversaInbox) => x.pacienteId === alvo) : null
        if (c) abrir(c)
      })
      .catch(() => setInbox([]))
      .finally(() => setCarregandoInbox(false))
  }, [])

  function abrir(c: ConversaInbox) {
    setSel(c)
    setCarregandoThread(true)
    setThread([])
    fetch(`/api/mensagens/${c.pacienteId}`)
      .then((r) => (r.ok ? r.json() : []))
      .then((rows) => setThread(Array.isArray(rows) ? rows : []))
      .catch(() => setThread([]))
      .finally(() => setCarregandoThread(false))
  }

  const filtrado = inbox.filter((c) =>
    (c.pacienteNome ?? "").toLowerCase().includes(busca.toLowerCase()),
  )

  return (
    // h-screen + flex-col em vez de min-h-screen + grid de altura fixa (100vh-4rem):
    // o número mágico (4rem) não batia com o Header (72px) e quebrava quando o banner
    // do PaywallGate (read-only/prazo, sticky) empurrava o conteúdo, expondo o fundo
    // claro do <body> (tema noir vive no wrapper, não no body). bg-background garante
    // que qualquer área pinte o token escuro. Scrolls internos (inbox/thread) preservados.
    <div className="flex h-screen flex-col overflow-hidden bg-background">
      <Header title="Mensagens" />

      <EscalacaoInbox />

      <div className="grid min-h-0 flex-1 grid-cols-1 md:grid-cols-[320px_1fr]">
        {/* Inbox */}
        <aside className="flex flex-col border-r border-border/60">
          <div className="border-b border-border/60 p-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar paciente"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {carregandoInbox ? (
              <div className="flex justify-center py-10 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" />
              </div>
            ) : filtrado.length === 0 ? (
              <p className="px-4 py-10 text-center text-sm text-muted-foreground">
                Nenhuma conversa ainda.
              </p>
            ) : (
              filtrado.map((c) => (
                <button
                  key={c.pacienteId}
                  onClick={() => abrir(c)}
                  className={`flex w-full items-start gap-3 border-b border-border/40 px-4 py-3 text-left transition-colors hover:bg-primary/[0.04] ${
                    sel?.pacienteId === c.pacienteId ? "bg-primary/[0.06]" : ""
                  }`}
                >
                  <Avatar className="h-10 w-10 border-2 border-primary/15">
                    <AvatarFallback className="bg-secondary text-xs font-semibold text-primary">
                      {iniciais(c.pacienteNome)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-sm font-medium text-foreground">
                        {c.pacienteNome ?? "Paciente"}
                      </span>
                      <span className="shrink-0 text-[10px] text-muted-foreground">
                        {tempoRelativo(c.ultimaEm)}
                      </span>
                    </div>
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">
                      {c.ultimoPapel === "assistant" ? "Assistente: " : ""}
                      {c.ultimaMensagem}
                    </p>
                  </div>
                </button>
              ))
            )}
          </div>
        </aside>

        {/* Thread */}
        <section className="flex flex-col bg-muted/20">
          {!sel ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-2 text-muted-foreground">
              <MessageSquare className="h-8 w-8 opacity-40" />
              <p className="text-sm">Selecione uma conversa para revisar.</p>
            </div>
          ) : (
            <>
              {/* Cabeçalho */}
              <div className="flex items-center gap-3 border-b border-border/60 bg-background px-5 py-3">
                <Avatar className="h-9 w-9 border-2 border-primary/15">
                  <AvatarFallback className="bg-secondary text-xs font-semibold text-primary">
                    {iniciais(sel.pacienteNome)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-foreground">{sel.pacienteNome ?? "Paciente"}</p>
                  <p className="text-xs text-muted-foreground">{sel.total} mensagens</p>
                </div>
                <Badge variant="outline" className="gap-1 text-xs">
                  <ShieldCheck className="h-3 w-3" /> Revisão
                </Badge>
              </div>

              {/* Mensagens */}
              <div className="flex-1 space-y-3 overflow-y-auto p-5">
                {carregandoThread ? (
                  <div className="flex justify-center py-10 text-muted-foreground">
                    <Loader2 className="h-5 w-5 animate-spin" />
                  </div>
                ) : thread.length === 0 ? (
                  <p className="py-10 text-center text-sm text-muted-foreground">Sem mensagens.</p>
                ) : (
                  thread.map((m) => {
                    const ehAssistente = m.papel === "assistant"
                    return (
                      <div key={m.id} className={`flex ${ehAssistente ? "justify-end" : "justify-start"}`}>
                        <div
                          className={`max-w-[78%] rounded-2xl px-4 py-2.5 ${
                            ehAssistente
                              ? "bg-primary text-primary-foreground"
                              : "border border-border/60 bg-background text-foreground"
                          }`}
                        >
                          <div className={`mb-1 flex items-center gap-1.5 text-[10px] font-medium ${ehAssistente ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                            {ehAssistente ? <Bot className="h-3 w-3" /> : <User className="h-3 w-3" />}
                            {ehAssistente ? "Assistente" : "Paciente"} · {horaMin(m.criadaEm)}
                          </div>
                          <p className="whitespace-pre-line text-sm leading-relaxed">{m.conteudo}</p>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>

              <RascunhoAdmin pacienteId={sel.pacienteId} pacienteNome={sel.pacienteNome} />

              {/* Aviso */}
              <div className="flex items-start gap-2 border-t border-border/60 bg-background px-5 py-3 text-xs text-muted-foreground">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <p>
                  Console de revisão. As respostas ao paciente são conduzidas pela automação e pelo
                  portal, com auditoria — a decisão clínica é sempre sua.
                </p>
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  )
}
