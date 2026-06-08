"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ClipboardCheck, Loader2, Check, Smile } from "lucide-react"
import { Button } from "@/components/ui/button"
import { QuestionarioEscala } from "@/components/portal/QuestionarioEscala"

interface Checkin {
  id: string
  tipo: string
  payloadJson: string
  agendadoPara: string
}

const ROTULO: Record<string, string> = {
  medicacao: "Confirmação de medicação",
  humor_diario: "Check-in de humor",
  questionario_phq9: "Questionário PHQ-9",
  questionario_gad7: "Questionário GAD-7",
}

export default function CheckinsPage() {
  const [itens, setItens] = useState<Checkin[]>([])
  const [loading, setLoading] = useState(true)
  const [respondendo, setRespondendo] = useState<string | null>(null)
  const [feitos, setFeitos] = useState<Record<string, boolean>>({})
  const [erros, setErros] = useState<Record<string, string>>({})

  function carregar() {
    fetch("/api/paciente/checkins")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(setItens)
      .catch(() => setItens([]))
      .finally(() => setLoading(false))
  }
  useEffect(carregar, [])

  async function responder(c: Checkin, resposta: Record<string, unknown>) {
    setRespondendo(c.id)
    setErros((e) => {
      const { [c.id]: _, ...resto } = e
      return resto
    })
    try {
      const r = await fetch(`/api/paciente/checkins/${c.id}/responder`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resposta }),
      })
      if (r.ok) {
        setFeitos((f) => ({ ...f, [c.id]: true }))
      } else {
        setErros((e) => ({
          ...e,
          [c.id]: "Não conseguimos enviar sua resposta agora. Verifique sua conexão e tente de novo.",
        }))
      }
    } catch {
      setErros((e) => ({
        ...e,
        [c.id]: "Não conseguimos enviar sua resposta agora. Verifique sua conexão e tente de novo.",
      }))
    } finally {
      setRespondendo(null)
    }
  }

  function nomeMedicamento(c: Checkin): string {
    try {
      return JSON.parse(c.payloadJson)?.medicamento ?? ""
    } catch {
      return ""
    }
  }

  const pendentes = itens.filter((c) => !feitos[c.id])

  return (
    <div className="p-4 pt-8 space-y-5">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-semibold text-foreground">
          <ClipboardCheck className="h-6 w-6 text-primary" /> Check-ins
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">Perguntas rápidas da sua psiquiatra</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-12 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : pendentes.length === 0 ? (
        <p className="rounded-2xl border border-border/60 bg-card p-6 text-center text-sm text-muted-foreground">
          Nenhum check-in pendente. 🎉
        </p>
      ) : (
        <ul className="space-y-3">
          {pendentes.map((c) => (
            <li key={c.id} className="rounded-2xl border border-border/60 bg-card p-4 space-y-3">
              <p className="text-sm font-medium text-foreground">{ROTULO[c.tipo] ?? c.tipo}</p>

              {c.tipo === "medicacao" ? (
                <>
                  {nomeMedicamento(c) && (
                    <p className="text-sm text-muted-foreground">{nomeMedicamento(c)}</p>
                  )}
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      className="bg-primary hover:bg-purple-dark text-primary-foreground"
                      disabled={respondendo === c.id}
                      onClick={() => responder(c, { status: "tomada" })}
                    >
                      {respondendo === c.id ? <Loader2 className="h-4 w-4 animate-spin" /> : "Tomei ✓"}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={respondendo === c.id}
                      onClick={() => responder(c, { status: "esquecida" })}
                    >
                      Esqueci
                    </Button>
                  </div>
                </>
              ) : c.tipo === "humor_diario" ? (
                <Button asChild size="sm" className="bg-primary hover:bg-purple-dark text-primary-foreground gap-1.5">
                  <Link href="/p/humor">
                    <Smile className="h-4 w-4" /> Registrar humor
                  </Link>
                </Button>
              ) : c.tipo.startsWith("questionario_") ? (
                <QuestionarioEscala
                  checkinId={c.id}
                  codigo={c.tipo.replace("questionario_", "")}
                  onConcluido={(id) => setFeitos((f) => ({ ...f, [id]: true }))}
                />
              ) : (
                <p className="text-xs text-muted-foreground">
                  Responda este check-in com sua psiquiatra na próxima consulta.
                </p>
              )}

              {erros[c.id] && (
                <p className="text-sm text-destructive">{erros[c.id]}</p>
              )}
            </li>
          ))}
        </ul>
      )}

      {Object.keys(feitos).length > 0 && (
        <p className="flex items-center justify-center gap-1.5 text-sm text-success">
          <Check className="h-4 w-4" /> Respostas enviadas
        </p>
      )}
    </div>
  )
}
