'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, Loader2 } from 'lucide-react'

function generateId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

type Message = {
  id: string
  role: 'user' | 'agent'
  content: string
  nodes?: { name: string; status: string }[]
  isStreaming?: boolean
}

const NODE_LABELS: Record<string, string> = {
  load_context: 'analisando contexto',
  detect_crisis: 'verificando bem-estar',
  classify_medication: 'classificando intenção',
  extract_symptoms: 'identificando sintomas',
  generate_response: 'pensando',
  audit_response: 'revisando',
  escalate_to_human: 'escalando para o profissional',
}

export function ChatClient() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: 'smooth',
    })
  }, [messages])

  async function handleSend() {
    const text = input.trim()
    if (!text || isStreaming) return
    setInput('')

    const userMsg: Message = { id: generateId(), role: 'user', content: text }
    const agentMsg: Message = { id: generateId(), role: 'agent', content: '', nodes: [], isStreaming: true }
    setMessages((m) => [...m, userMsg, agentMsg])
    setIsStreaming(true)

    try {
      const res = await fetch('/api/paciente/conversation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mensagem: text, idempotencyKey: generateId() }),
      })

      if (!res.ok || !res.body) {
        setMessages((msgs) =>
          msgs.map((m) =>
            m.id === agentMsg.id
              ? { ...m, content: 'Não consegui conectar. Tenta de novo daqui a pouco.', isStreaming: false }
              : m,
          ),
        )
        return
      }

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      let currentEvent = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })

        let lineEnd: number
        while ((lineEnd = buffer.indexOf('\n')) !== -1) {
          const line = buffer.slice(0, lineEnd)
          buffer = buffer.slice(lineEnd + 1)

          const trimmed = line.trim()
          if (trimmed.startsWith('event: ')) {
            currentEvent = trimmed.slice(7).trim()
          } else if (trimmed.startsWith('data: ')) {
            const data = trimmed.slice(6).trim()
            try {
              const parsed = JSON.parse(data)
              if (currentEvent === 'node') {
                setMessages((msgs) =>
                  msgs.map((m) =>
                    m.id === agentMsg.id
                      ? {
                          ...m,
                          nodes: [
                            ...(m.nodes ?? []).filter((n) => n.name !== parsed.name),
                            { name: parsed.name, status: parsed.status },
                          ],
                        }
                      : m,
                  ),
                )
              } else if (currentEvent === 'token' && parsed.delta) {
                setMessages((msgs) =>
                  msgs.map((m) =>
                    m.id === agentMsg.id ? { ...m, content: m.content + parsed.delta } : m,
                  ),
                )
              }
            } catch {
              // ignora linhas malformadas
            }
          }
        }
      }

      setMessages((msgs) =>
        msgs.map((m) => (m.id === agentMsg.id ? { ...m, isStreaming: false } : m)),
      )
    } catch {
      setMessages((msgs) =>
        msgs.map((m) =>
          m.id === agentMsg.id
            ? { ...m, content: 'Erro de conexão. Tenta novamente.', isStreaming: false }
            : m,
        ),
      )
    } finally {
      setIsStreaming(false)
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-180px)]">
      <div className="flex items-center gap-2 mb-4">
        <span className="w-1.5 h-1.5 rounded-full bg-[#00D9C0]" />
        <span className="text-[13px] font-medium text-[#00D9C0]/70">
          Conversar
        </span>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-4 pr-1">
        {messages.length === 0 ? (
          <div className="text-center text-[#D0D5D5]/80 mt-12 leading-relaxed">
            <p className="text-[16px]">Conte como você está hoje.</p>
            <p className="mt-1 text-[13px] text-[#9AA8A8]">Estou aqui pra ouvir.</p>
          </div>
        ) : (
          messages.map((m) => <MessageBubble key={m.id} message={m} />)
        )}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault()
          handleSend()
        }}
        className="flex gap-2 pt-4 mt-4 border-t border-[#00D9C0]/[0.08]"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={isStreaming}
          placeholder="Escreva uma mensagem..."
          className="flex-1 rounded-xl border border-[#00D9C0]/[0.15] bg-[#111818] px-4 py-2.5 text-[15px] text-[#F5F7F7] placeholder:text-[#9AA8A8]/60 outline-none transition-all focus:border-[#00D9C0]/40 focus:shadow-[0_0_0_4px_rgba(0,217,192,0.08)] disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={isStreaming || !input.trim()}
          className="rounded-xl border border-[#00D9C0]/40 bg-[#00D9C0]/10 px-4 py-2.5 text-[#00D9C0] transition-all hover:border-[#00D9C0]/60 hover:bg-[#00D9C0]/20 disabled:opacity-30 disabled:cursor-not-allowed"
          aria-label="Enviar mensagem"
        >
          {isStreaming ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
        </button>
      </form>
    </div>
  )
}

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === 'user'
  const startedNodes = (message.nodes ?? []).filter((n) => n.status === 'started')
  const currentNode = startedNodes[startedNodes.length - 1]
  const showThinking = message.isStreaming && !message.content

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-[15px] leading-relaxed ${
          isUser
            ? 'bg-[#00D9C0]/15 text-[#F5F7F7] border border-[#00D9C0]/25'
            : 'bg-[#111818] border border-[#00D9C0]/[0.08] text-[#F5F7F7]'
        }`}
      >
        {showThinking ? (
          <div className="flex items-center gap-2 text-[#9AA8A8]">
            <Loader2 size={14} className="animate-spin text-[#00D9C0]" />
            <span className="text-[13px] italic">
              {currentNode ? (NODE_LABELS[currentNode.name] ?? currentNode.name) : 'iniciando...'}
            </span>
          </div>
        ) : (
          <p className="whitespace-pre-wrap">{message.content}</p>
        )}
      </div>
    </div>
  )
}
