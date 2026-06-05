"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { toast } from "sonner"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { BadgeCheck, MessageCircle, Send } from "lucide-react"
import { iniciais } from "@/lib/rede"
import type { ConversaPreview, Mensagem, NovaMensagemPayload } from "@/lib/chat"
import { getChatConnection } from "@/lib/chat"

export function ChatView() {
  const [conversas, setConversas] = useState<ConversaPreview[]>([])
  const [ativa, setAtiva] = useState<string | null>(null)
  const [mensagens, setMensagens] = useState<Mensagem[]>([])
  const [carregando, setCarregando] = useState(true)
  const [corpo, setCorpo] = useState("")
  const [enviando, setEnviando] = useState(false)
  const [token, setToken] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  // Carrega conversas
  useEffect(() => {
    setCarregando(true)
    fetch("/api/rede/chat/conversas")
      .then((r) => (r.ok ? r.json() : []))
      .then(setConversas)
      .catch(() => setConversas([]))
      .finally(() => setCarregando(false))
  }, [])

  // Obtém token para SignalR (via BFF /api/rede/perfil/me que retorna token? Não — precisa do cookie raw)
  // Para SignalR client-side, precisamos do token JWT. O BFF não expõe isso ao client.
  // Alternativa: usar cookie-based auth no SignalR (não supported natively).
  // Para MVP: chat funciona via polling REST (SignalR em Onda 2.1 com auth config).
  // O hub está registrado; aqui usamos REST polling como fallback.

  const carregarMensagens = useCallback(async (conversaId: string) => {
    try {
      const res = await fetch(`/api/rede/chat/conversas/${conversaId}/mensagens`)
      if (res.ok) {
        const data: Mensagem[] = await res.json()
        setMensagens(data.reverse()) // API retorna DESC; renderizamos ASC
      }
    } catch { /* silencioso */ }
  }, [])

  useEffect(() => {
    if (!ativa) return
    carregarMensagens(ativa)
    // Marcar como lido
    fetch(`/api/rede/chat/conversas/${ativa}/leitura`, { method: "PATCH" }).catch(() => {})
  }, [ativa, carregarMensagens])

  // Auto-scroll ao receber mensagens
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" })
  }, [mensagens])

  async function enviar() {
    if (!ativa || !corpo.trim()) return
    setEnviando(true)
    try {
      const res = await fetch(`/api/rede/chat/conversas/${ativa}/mensagens`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ corpo: corpo.trim() }),
      })
      if (res.status === 201) {
        setCorpo("")
        await carregarMensagens(ativa)
      } else {
        const data = await res.json().catch(() => null)
        if (data?.error === "pii_bloqueada") toast.error("Mensagem contém dados de paciente.")
        else if (data?.error === "crm_nao_verificado") toast.error("CRM não verificado.")
        else toast.error("Erro ao enviar.")
      }
    } catch {
      toast.error("Erro de conexão.")
    } finally {
      setEnviando(false)
    }
  }

  function tempoRelativo(iso: string | null) {
    if (!iso) return ""
    const d = new Date(iso)
    const agora = Date.now()
    const diff = agora - d.getTime()
    if (diff < 60_000) return "agora"
    if (diff < 3600_000) return `${Math.floor(diff / 60_000)}min`
    if (diff < 86400_000) return `${Math.floor(diff / 3600_000)}h`
    return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })
  }

  return (
    <div className="mx-auto flex h-[calc(100vh-12rem)] max-w-5xl overflow-hidden rounded-xl border border-border/60">
      {/* Lista de conversas */}
      <div className="w-80 shrink-0 border-r border-border/40 bg-card/60">
        <div className="border-b border-border/40 p-4">
          <h3 className="text-sm font-semibold text-foreground">Conversas</h3>
        </div>
        <div className="overflow-y-auto" style={{ height: "calc(100% - 57px)" }}>
          {carregando ? (
            <div className="space-y-2 p-3">
              {[0, 1, 2].map((i) => <div key={i} className="h-14 animate-pulse rounded-lg bg-muted/40" />)}
            </div>
          ) : conversas.length === 0 ? (
            <div className="flex flex-col items-center gap-2 p-8 text-center">
              <MessageCircle className="h-8 w-8 text-muted-foreground/40" />
              <p className="text-xs text-muted-foreground">Nenhuma conversa ainda.</p>
            </div>
          ) : (
            conversas.map((c) => (
              <button
                key={c.id}
                onClick={() => setAtiva(c.id)}
                className={`flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/40 ${
                  ativa === c.id ? "bg-muted/60" : ""
                }`}
              >
                <Avatar className="h-10 w-10 shrink-0">
                  {c.fotoUrl ? <AvatarImage src={c.fotoUrl} /> : null}
                  <AvatarFallback className="bg-primary/10 text-xs text-primary">
                    {iniciais(c.nome)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <span className="truncate text-sm font-medium text-foreground">
                      {c.nome ?? "DM"}
                    </span>
                    <span className="shrink-0 text-[10px] text-muted-foreground">
                      {tempoRelativo(c.ultimaMensagemEm)}
                    </span>
                  </div>
                  <p className="truncate text-xs text-muted-foreground">
                    {c.ultimaMensagem ?? "Nenhuma mensagem"}
                  </p>
                </div>
                {c.naoLidas > 0 && (
                  <Badge className="ml-1 h-5 min-w-5 shrink-0 rounded-full px-1.5 text-[10px]">
                    {c.naoLidas}
                  </Badge>
                )}
              </button>
            ))
          )}
        </div>
      </div>

      {/* Thread de mensagens */}
      <div className="flex flex-1 flex-col bg-background">
        {!ativa ? (
          <div className="flex flex-1 items-center justify-center">
            <p className="text-sm text-muted-foreground">Selecione uma conversa para começar.</p>
          </div>
        ) : (
          <>
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
              {mensagens.map((m) => (
                <div
                  key={m.id}
                  className={`flex gap-2 ${m.minha ? "flex-row-reverse" : ""}`}
                >
                  {!m.minha && (
                    <Avatar className="h-7 w-7 shrink-0">
                      {m.autorFoto ? <AvatarImage src={m.autorFoto} /> : null}
                      <AvatarFallback className="bg-primary/10 text-[10px] text-primary">
                        {iniciais(m.autorNome)}
                      </AvatarFallback>
                    </Avatar>
                  )}
                  <div className={`max-w-[70%] rounded-2xl px-3.5 py-2 text-sm ${
                    m.minha
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted/60 text-foreground"
                  }`}>
                    {!m.minha && (
                      <p className="mb-0.5 flex items-center gap-1 text-[10px] font-medium opacity-70">
                        {m.autorNome}
                        {m.autorVerificado && <BadgeCheck className="h-3 w-3" />}
                      </p>
                    )}
                    <p className="whitespace-pre-wrap">{m.corpo}</p>
                    <p className={`mt-0.5 text-[10px] ${m.minha ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
                      {new Date(m.criadoEm).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <div className="border-t border-border/40 p-3">
              <form
                onSubmit={(e) => { e.preventDefault(); enviar() }}
                className="flex gap-2"
              >
                <Input
                  value={corpo}
                  onChange={(e) => setCorpo(e.target.value)}
                  placeholder="Digite sua mensagem…"
                  maxLength={5000}
                  className="flex-1"
                  disabled={enviando}
                />
                <Button type="submit" size="icon" disabled={enviando || !corpo.trim()}>
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
