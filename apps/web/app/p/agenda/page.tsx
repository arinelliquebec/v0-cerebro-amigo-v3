"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { CalendarClock, Loader2, AlertTriangle, Check, X, Video } from "lucide-react"

interface Consulta {
  id: string
  iniciaEm: string
  duracaoMin: number
  modalidade: string
  status: string
}

const STATUS: Record<string, { rotulo: string; cls: string }> = {
  agendada: { rotulo: "Aguardando confirmação", cls: "bg-warning/15 text-warning" },
  confirmada: { rotulo: "Confirmada", cls: "bg-success/15 text-success" },
  realizada: { rotulo: "Realizada", cls: "bg-primary/15 text-primary" },
  cancelada: { rotulo: "Cancelada", cls: "bg-destructive/15 text-destructive" },
}

function hojeYmd() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}
function quando(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  })
}
function horaLocal(iso: string) {
  return new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
}
// Janela de entrada na teleconsulta: de 10 min antes até o fim previsto + 30 min.
function podeEntrarVideo(c: Consulta): boolean {
  if (c.modalidade !== "teleconsulta" || c.status === "cancelada") return false
  const ini = new Date(c.iniciaEm).getTime()
  const fim = ini + (c.duracaoMin || 30) * 60000 + 30 * 60000
  const agora = Date.now()
  return agora >= ini - 10 * 60000 && agora <= fim
}

export default function AgendaPacientePage() {
  const [consultas, setConsultas] = useState<Consulta[]>([])
  const [loading, setLoading] = useState(true)
  const [cancelando, setCancelando] = useState<string | null>(null)

  // agendamento
  const [data, setData] = useState(hojeYmd())
  const [slots, setSlots] = useState<string[]>([])
  const [slot, setSlot] = useState("")
  const [modalidade, setModalidade] = useState("teleconsulta")
  const [carregandoSlots, setCarregandoSlots] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [msg, setMsg] = useState<{ tipo: "erro" | "ok"; texto: string } | null>(null)

  const carregar = useCallback(() => {
    setLoading(true)
    fetch("/api/paciente/agenda")
      .then((r) => (r.ok ? r.json() : []))
      .then((rows) => setConsultas(Array.isArray(rows) ? rows : []))
      .catch(() => setConsultas([]))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => carregar(), [carregar])

  useEffect(() => {
    if (!data) return
    setCarregandoSlots(true)
    setSlot("")
    fetch(`/api/paciente/agenda/disponibilidade?data=${data}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setSlots(Array.isArray(d?.slots) ? d.slots : []))
      .catch(() => setSlots([]))
      .finally(() => setCarregandoSlots(false))
  }, [data])

  async function agendar() {
    setMsg(null)
    if (!slot) {
      setMsg({ tipo: "erro", texto: "Escolha um horário." })
      return
    }
    setEnviando(true)
    try {
      const r = await fetch("/api/paciente/agenda", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ iniciaEm: slot, modalidade }),
      })
      if (!r.ok) {
        const d = await r.json().catch(() => null)
        const erro = d?.erro ?? d?.error
        if (erro === "horario_ocupado" || erro === "horario_indisponivel") {
          setMsg({ tipo: "erro", texto: "Esse horário não está mais disponível. Escolha outro." })
        } else {
          setMsg({ tipo: "erro", texto: "Não foi possível agendar. Tente novamente." })
        }
        return
      }
      setMsg({ tipo: "ok", texto: "Consulta solicitada! Aguarde a confirmação do seu médico." })
      setSlot("")
      carregar()
      // recarrega slots do dia (o horário escolhido sai da lista)
      fetch(`/api/paciente/agenda/disponibilidade?data=${data}`)
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => setSlots(Array.isArray(d?.slots) ? d.slots : []))
        .catch(() => {})
    } catch {
      setMsg({ tipo: "erro", texto: "Erro de conexão. Tente novamente." })
    } finally {
      setEnviando(false)
    }
  }

  async function cancelar(id: string) {
    setCancelando(id)
    try {
      const r = await fetch(`/api/paciente/agenda/${id}/cancelar`, { method: "PATCH" })
      if (r.ok) {
        setConsultas((cs) => cs.map((c) => (c.id === id ? { ...c, status: "cancelada" } : c)))
      }
    } finally {
      setCancelando(null)
    }
  }

  const futuras = consultas.filter(
    (c) => new Date(c.iniciaEm) > new Date() && c.status !== "cancelada",
  )

  return (
    <div className="p-4 pt-8 space-y-6">
      <header className="space-y-1">
        <h1 className="flex items-center gap-2 text-xl font-semibold text-foreground">
          <CalendarClock className="h-5 w-5 text-primary" /> Minha agenda
        </h1>
        <p className="text-sm text-muted-foreground">Agende uma consulta com seu médico.</p>
      </header>

      {/* Agendar */}
      <section className="space-y-3 rounded-2xl border border-border/60 bg-card p-4">
        <h2 className="text-sm font-semibold text-foreground">Nova consulta</h2>

        {msg && (
          <div
            className={`flex items-start gap-2 rounded-lg px-3 py-2 text-sm ${
              msg.tipo === "ok" ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"
            }`}
          >
            {msg.tipo === "ok" ? <Check className="mt-0.5 h-4 w-4 shrink-0" /> : <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />}
            <span>{msg.texto}</span>
          </div>
        )}

        <div className="space-y-1.5">
          <label className="text-xs text-muted-foreground">Dia</label>
          <Input type="date" value={data} min={hojeYmd()} onChange={(e) => setData(e.target.value)} />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs text-muted-foreground">Horário</label>
          <Select value={slot} onValueChange={setSlot} disabled={carregandoSlots || slots.length === 0}>
            <SelectTrigger>
              <SelectValue
                placeholder={carregandoSlots ? "Carregando…" : slots.length === 0 ? "Sem horários neste dia" : "Escolha"}
              />
            </SelectTrigger>
            <SelectContent>
              {slots.map((s) => (
                <SelectItem key={s} value={s}>
                  {horaLocal(s)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs text-muted-foreground">Modalidade</label>
          <Select value={modalidade} onValueChange={setModalidade}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="teleconsulta">Teleconsulta</SelectItem>
              <SelectItem value="presencial">Presencial</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button onClick={agendar} disabled={enviando || !slot} className="w-full">
          {enviando ? <Loader2 className="h-4 w-4 animate-spin" /> : "Solicitar consulta"}
        </Button>
      </section>

      {/* Próximas */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-foreground">Próximas consultas</h2>
        {loading ? (
          <div className="flex justify-center py-8 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        ) : futuras.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border/60 px-4 py-8 text-center text-sm text-muted-foreground">
            Você não tem consultas futuras.
          </p>
        ) : (
          futuras.map((c) => {
            const st = STATUS[c.status] ?? STATUS.agendada
            return (
              <div key={c.id} className="rounded-2xl border border-border/60 bg-card p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium capitalize text-foreground">{quando(c.iniciaEm)}</p>
                    <p className="mt-0.5 text-xs capitalize text-muted-foreground">{c.modalidade}</p>
                    <span className={`mt-2 inline-block rounded-full px-2 py-0.5 text-[10px] font-medium ${st.cls}`}>
                      {st.rotulo}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-1 text-xs text-destructive"
                    disabled={cancelando === c.id}
                    onClick={() => cancelar(c.id)}
                  >
                    {cancelando === c.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <X className="h-3.5 w-3.5" />}
                    Cancelar
                  </Button>
                </div>
                {podeEntrarVideo(c) && (
                  <Button asChild size="sm" className="mt-3 w-full gap-1.5">
                    <Link href={`/p/consulta/${c.id}`}>
                      <Video className="h-4 w-4" /> Entrar na consulta
                    </Link>
                  </Button>
                )}
              </div>
            )
          })
        )}
      </section>
    </div>
  )
}
