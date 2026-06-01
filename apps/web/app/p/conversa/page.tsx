"use client"

import { useRef, useState, useEffect } from "react"
import { Send, Loader2, LifeBuoy, Phone } from "lucide-react"

type Papel = "user" | "assistant" | "crise" | "sistema"
interface Msg {
  papel: Papel
  texto: string
}

// Evento final do grafo (orchestrator) — front renderiza só o que vem daqui.
interface CompletePayload {
  conversa_status?: string
  resposta_final?: string | null
  enviado?: boolean
  crise?: { detectada?: boolean; nivel?: string } | null
}

const SAUDACAO =
  "Oi! Pode me contar como você está se sentindo. Vou organizar e, se precisar, sua psiquiatra é avisada."

export default function ConversaPage() {
  const [msgs, setMsgs] = useState<Msg[]>([{ papel: "assistant", texto: SAUDACAO }])
  const [input, setInput] = useState("")
  const [status, setStatus] = useState<"idle" | "pensando" | "digitando">("idle")
  const [pausado, setPausado] = useState(false) // após crise/escalada: automação pausada
  const fimRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fimRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [msgs, status])

  async function enviar(e: React.FormEvent) {
    e.preventDefault()
    const texto = input.trim()
    if (!texto || status !== "idle" || pausado) return

    setMsgs((m) => [...m, { papel: "user", texto }])
    setInput("")
    setStatus("pensando")

    try {
      const res = await fetch("/api/paciente/conversation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mensagem: texto, idempotencyKey: crypto.randomUUID() }),
      })

      if (!res.ok || !res.body) {
        finalizarSistema("Não consegui processar agora. Tente de novo em instantes.")
        return
      }

      // Lê o SSE. Por segurança clínica (auditoria antes do paciente ver), NÃO
      // revelamos os tokens em streaming — só mostramos "digitando" e revelamos
      // a mensagem final (já auditada) no evento `complete`.
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buf = ""
      let concluido = false

      while (!concluido) {
        const { done, value } = await reader.read()
        if (done) break
        buf += decoder.decode(value, { stream: true })
        let idx: number
        while ((idx = buf.indexOf("\n\n")) >= 0) {
          const bloco = buf.slice(0, idx)
          buf = buf.slice(idx + 2)
          concluido = tratarEvento(bloco) || concluido
        }
      }
      if (!concluido) finalizarSistema("Conexão interrompida. Tente novamente.")
    } catch {
      finalizarSistema("Erro de conexão. Tente novamente.")
    } finally {
      setStatus("idle")
    }
  }

  // Retorna true quando recebeu o evento final (complete/error).
  function tratarEvento(bloco: string): boolean {
    let evento = ""
    let data = ""
    for (const linha of bloco.split("\n")) {
      if (linha.startsWith("event:")) evento = linha.slice(6).trim()
      else if (linha.startsWith("data:")) data += linha.slice(5).trim()
    }

    if (evento === "node" || evento === "token") {
      setStatus("digitando")
      return false
    }
    if (evento === "error") {
      finalizarSistema("Tive um problema para responder. Sua psiquiatra pode ser acionada se necessário.")
      return true
    }
    if (evento === "complete") {
      let payload: CompletePayload = {}
      try {
        payload = JSON.parse(data)
      } catch {
        /* ignora */
      }
      revelarFinal(payload)
      return true
    }
    return false
  }

  // Mostra a mensagem AUTORITATIVA (texto vem do backend; front nunca inventa).
  function revelarFinal(p: CompletePayload) {
    if (p.crise?.detectada && p.resposta_final) {
      setMsgs((m) => [...m, { papel: "crise", texto: p.resposta_final as string }])
      setPausado(true)
      return
    }
    if (p.resposta_final) {
      setMsgs((m) => [...m, { papel: "assistant", texto: p.resposta_final as string }])
      return
    }
    // resposta_final nula → foi escalado/bloqueado para humano (rule #3).
    setMsgs((m) => [
      ...m,
      { papel: "sistema", texto: "Sua mensagem foi encaminhada à sua psiquiatra. Ela vai te responder." },
    ])
    if (p.conversa_status === "humano") setPausado(true)
  }

  function finalizarSistema(texto: string) {
    setMsgs((m) => [...m, { papel: "sistema", texto }])
  }

  return (
    <div className="flex flex-col h-[calc(100dvh-5rem)]">
      <header className="border-b border-border/60 px-4 py-3">
        <h1 className="text-base font-semibold text-navy">Conversa</h1>
        <p className="text-xs text-muted-foreground">
          Acompanhamento entre consultas · sua psiquiatra é avisada em caso de risco
        </p>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {msgs.map((m, i) => (
          <Bolha key={i} msg={m} />
        ))}
        {status !== "idle" && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            {status === "pensando" ? "lendo sua mensagem…" : "escrevendo…"}
          </div>
        )}
        <div ref={fimRef} />
      </div>

      {pausado ? (
        <div className="border-t border-border/60 bg-secondary/40 px-4 py-3 text-center text-sm text-muted-foreground">
          Conversa pausada — sua psiquiatra foi avisada e vai te acompanhar a partir daqui.
        </div>
      ) : (
        <form onSubmit={enviar} className="border-t border-border/60 p-3 flex items-end gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault()
                enviar(e)
              }
            }}
            rows={1}
            placeholder="Escreva como você está…"
            className="flex-1 resize-none rounded-xl border border-border bg-card px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 max-h-32"
          />
          <button
            type="submit"
            disabled={status !== "idle" || !input.trim()}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary text-white disabled:opacity-40"
            aria-label="Enviar"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
      )}
    </div>
  )
}

function Bolha({ msg }: { msg: Msg }) {
  if (msg.papel === "crise") {
    return (
      <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-4 space-y-3">
        <div className="flex items-center gap-2 text-destructive">
          <LifeBuoy className="h-4 w-4" />
          <span className="text-sm font-semibold">Apoio imediato</span>
        </div>
        <p className="whitespace-pre-line text-sm leading-relaxed text-navy">{msg.texto}</p>
        <div className="flex flex-wrap gap-2">
          <a
            href="tel:188"
            className="inline-flex items-center gap-1.5 rounded-full bg-destructive/10 px-3 py-1.5 text-xs font-semibold text-destructive"
          >
            <Phone className="h-3 w-3" /> CVV 188
          </a>
          <a
            href="tel:192"
            className="inline-flex items-center gap-1.5 rounded-full bg-destructive/10 px-3 py-1.5 text-xs font-semibold text-destructive"
          >
            <Phone className="h-3 w-3" /> SAMU 192
          </a>
        </div>
      </div>
    )
  }
  if (msg.papel === "sistema") {
    return (
      <p className="mx-auto max-w-[85%] rounded-lg bg-muted/60 px-3 py-2 text-center text-xs text-muted-foreground">
        {msg.texto}
      </p>
    )
  }
  const eUser = msg.papel === "user"
  return (
    <div className={`flex ${eUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed whitespace-pre-line ${
          eUser ? "bg-primary text-white" : "bg-secondary text-navy"
        }`}
      >
        {msg.texto}
      </div>
    </div>
  )
}
