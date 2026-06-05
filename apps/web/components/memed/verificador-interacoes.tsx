"use client"

import { useCallback, useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ShieldAlert, ShieldCheck, Loader2, Search } from "lucide-react"

interface Alerta {
  tipo: string // "interacao" | "duplicidade"
  severidade: string // "grave" | "moderada"
  medicamentoA: string
  medicamentoB: string
  mecanismo: string
  recomendacao: string | null
  fonte: string | null
}

interface Resposta {
  alertas: Alerta[]
  disclaimer: string
  catalogoVersao: string | null
}

/**
 * Segunda barreira de interações/duplicidade (A5, ADR-032). Checagem
 * DETERMINÍSTICA contra base local versionada — NÃO é IA, NÃO substitui o MEMED
 * nem a bula. Ao abrir, avalia o conjunto de prescrições ATIVAS do paciente; o
 * médico pode testar um medicamento candidato antes de prescrever. A decisão é
 * sempre do médico.
 */
export function VerificadorInteracoes({ pacienteId }: { pacienteId: string }) {
  const [resp, setResp] = useState<Resposta | null>(null)
  const [loading, setLoading] = useState(true)
  const [candidato, setCandidato] = useState("")

  const checar = useCallback(
    async (medicamentos?: string[]) => {
      setLoading(true)
      try {
        const r = await fetch("/api/prescricoes/checar-interacoes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ pacienteId, medicamentos: medicamentos ?? [] }),
        })
        const d = await r.json().catch(() => null)
        setResp(r.ok && d ? d : null)
      } catch {
        setResp(null)
      } finally {
        setLoading(false)
      }
    },
    [pacienteId],
  )

  useEffect(() => {
    void checar()
  }, [checar])

  const alertas = resp?.alertas ?? []
  const temGrave = alertas.some((a) => a.severidade === "grave")

  return (
    <div className="rounded-xl border border-border/70 bg-card/50 p-4">
      <div className="mb-3 flex items-center gap-2">
        {alertas.length > 0 ? (
          <ShieldAlert className={`h-4 w-4 ${temGrave ? "text-coral" : "text-warning"}`} />
        ) : (
          <ShieldCheck className="h-4 w-4 text-primary" />
        )}
        <h4 className="text-sm font-semibold text-foreground">Interações (2ª barreira)</h4>
      </div>

      {/* Testar um medicamento candidato contra os ativos do paciente. */}
      <div className="mb-3 flex gap-2">
        <Input
          value={candidato}
          onChange={(e) => setCandidato(e.target.value)}
          placeholder="Avaliar medicamento (ex.: Tramadol)"
          className="h-9 text-sm"
          onKeyDown={(e) => {
            if (e.key === "Enter" && candidato.trim()) void checar([candidato.trim()])
          }}
        />
        <Button
          type="button"
          variant="secondary"
          className="h-9 gap-1.5"
          disabled={loading || !candidato.trim()}
          onClick={() => candidato.trim() && void checar([candidato.trim()])}
        >
          <Search className="h-4 w-4" /> Verificar
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-4 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      ) : alertas.length === 0 ? (
        <p className="py-2 text-sm text-muted-foreground">
          Nenhuma interação conhecida na base local.
        </p>
      ) : (
        <ul className="space-y-2">
          {alertas.map((a, i) => {
            const grave = a.severidade === "grave"
            return (
              <li
                key={i}
                className={`rounded-lg border-l-2 p-2.5 text-sm ${grave ? "border-coral bg-coral/5" : "border-warning bg-warning/5"}`}
              >
                <div className="mb-1 flex flex-wrap items-center gap-1.5">
                  <Badge variant={grave ? "destructive" : "secondary"} className="text-[0.65rem] uppercase">
                    {a.severidade}
                  </Badge>
                  <Badge variant="outline" className="text-[0.65rem]">
                    {a.tipo === "duplicidade" ? "duplicidade" : "interação"}
                  </Badge>
                  <span className="font-medium text-foreground">
                    {a.medicamentoA} × {a.medicamentoB}
                  </span>
                </div>
                <p className="text-muted-foreground">{a.mecanismo}</p>
                {a.recomendacao && <p className="mt-0.5 text-foreground/80">{a.recomendacao}</p>}
                {a.fonte && <p className="mt-0.5 text-[0.7rem] text-muted-foreground">Fonte: {a.fonte}</p>}
              </li>
            )
          })}
        </ul>
      )}

      {resp?.disclaimer && (
        <p className="mt-3 border-t border-border/60 pt-2 text-[0.7rem] leading-snug text-muted-foreground">
          {resp.disclaimer}
        </p>
      )}
    </div>
  )
}
