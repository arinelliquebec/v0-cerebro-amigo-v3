"use client"

import { useEffect, useState } from "react"
import { Pill, Clock, Check, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"

interface Medicacao {
  id: string
  medicamento: string
  doseDescricao: string
  horarios: string[] // TimeOnly[] serializado "HH:mm:ss"
  inicioEm: string
  observacoes: string | null
}

function horaCurta(t: string) {
  return t.slice(0, 5) // "HH:mm:ss" → "HH:mm"
}

export default function MedicacoesPage() {
  const [meds, setMeds] = useState<Medicacao[]>([])
  const [loading, setLoading] = useState(true)
  const [confirmando, setConfirmando] = useState<string | null>(null)
  const [feito, setFeito] = useState<Record<string, boolean>>({})

  useEffect(() => {
    fetch("/api/paciente/medicacoes")
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then(setMeds)
      .catch(() => setMeds([]))
      .finally(() => setLoading(false))
  }, [])

  // Confirma a tomada de uma medicação (cria/atualiza a tomada de hoje no backend).
  async function confirmar(id: string) {
    setConfirmando(id)
    try {
      const r = await fetch(`/api/paciente/medicacoes/confirmar/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "tomada" }),
      })
      if (r.ok) setFeito((f) => ({ ...f, [id]: true }))
    } finally {
      setConfirmando(null)
    }
  }

  return (
    <div className="p-4 pt-8 space-y-5">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-semibold text-navy">
          <Pill className="h-6 w-6 text-primary" /> Medicações
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">Suas prescrições ativas</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-12 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : meds.length === 0 ? (
        <p className="rounded-2xl border border-border/60 bg-card p-6 text-center text-sm text-muted-foreground">
          Nenhuma medicação ativa no momento.
        </p>
      ) : (
        <ul className="space-y-3">
          {meds.map((m) => (
            <li key={m.id} className="rounded-2xl border border-border/60 bg-card p-4 space-y-2">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-navy">{m.medicamento}</p>
                  <p className="text-sm text-muted-foreground">{m.doseDescricao}</p>
                </div>
                <Button
                  size="sm"
                  variant={feito[m.id] ? "outline" : "default"}
                  className={feito[m.id] ? "text-success border-success/40" : "bg-primary hover:bg-purple-dark text-white"}
                  disabled={confirmando === m.id || feito[m.id]}
                  onClick={() => confirmar(m.id)}
                >
                  {confirmando === m.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : feito[m.id] ? (
                    <>
                      <Check className="mr-1 h-4 w-4" /> Tomada
                    </>
                  ) : (
                    "Confirmar"
                  )}
                </Button>
              </div>
              {m.horarios?.length > 0 && (
                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  {m.horarios.map((h, i) => (
                    <span key={i} className="rounded-full bg-secondary px-2 py-0.5 text-primary">
                      {horaCurta(h)}
                    </span>
                  ))}
                </div>
              )}
              {m.observacoes && (
                <p className="text-xs text-muted-foreground">{m.observacoes}</p>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
