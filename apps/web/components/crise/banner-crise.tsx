"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { ShieldAlert, Loader2 } from "lucide-react"
import { tempoRelativo } from "@/lib/tempo"

interface CriseDetalhe {
  pacienteId: string
  gatilho: string
  confianca: number
  origem: string
  respostaEnviada: string | null
  medicoNotificado: boolean
  medicoNotificadoEm: string | null
  acionadoEm: string
  automacaoPausada: boolean
}

const ORIGEM_LABEL: Record<string, string> = {
  conversa: "conversa",
  diario_audio: "diário (áudio)",
  diario_texto: "diário (texto)",
}

/**
 * Banner de crise para o médico. Some sozinho quando não há crise com automação
 * pausada. O texto de acolhimento (respostaEnviada) é fixo (crisis_copy) e
 * exibido somente para leitura — nunca editável. Retomar a automação é um ato
 * auditado no gateway.
 */
export function BannerCrise({
  pacienteId,
  onRetomado,
}: {
  pacienteId: string
  onRetomado?: () => void
}) {
  const [crise, setCrise] = useState<CriseDetalhe | null>(null)
  const [confirmando, setConfirmando] = useState(false)
  const [observacao, setObservacao] = useState("")
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    let vivo = true
    setCrise(null)
    setConfirmando(false)
    setObservacao("")
    fetch(`/api/crise/${pacienteId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (vivo) setCrise(d) })
      .catch(() => { if (vivo) setCrise(null) })
    return () => { vivo = false }
  }, [pacienteId])

  // Só aparece quando há crise registrada com automação ainda pausada.
  if (!crise || !crise.automacaoPausada) return null

  async function retomar() {
    setBusy(true)
    try {
      const r = await fetch(`/api/crise/${pacienteId}/retomar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ observacao }),
      })
      if (r.ok) {
        setCrise(null)
        onRetomado?.()
      }
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="rounded-2xl border border-coral/30 bg-coral/7 p-5">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-coral/15">
          <ShieldAlert className="h-5 w-5 text-coral" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <p className="text-sm font-semibold text-foreground">
              Automação pausada — protocolo de crise acionado
            </p>
            <span className="text-xs text-muted-foreground">
              {tempoRelativo(crise.acionadoEm)} · via {ORIGEM_LABEL[crise.origem] ?? crise.origem}
            </span>
          </div>

          <p className="mt-1 text-xs text-muted-foreground">
            O paciente recebeu o texto de acolhimento padrão e a automação foi
            pausada. Avalie o caso antes de retomar.
          </p>

          {crise.respostaEnviada && (
            <blockquote className="mt-3 rounded-xl border border-border/60 bg-background/60 p-3 text-xs leading-relaxed text-muted-foreground">
              {crise.respostaEnviada}
            </blockquote>
          )}

          {!confirmando ? (
            <Button
              onClick={() => setConfirmando(true)}
              className="mt-4 h-9 bg-coral text-white hover:bg-coral/90"
            >
              Retomar automação
            </Button>
          ) : (
            <div className="mt-4 space-y-2">
              <textarea
                value={observacao}
                onChange={(e) => setObservacao(e.target.value)}
                placeholder="Observação (opcional) — fica no registro de auditoria"
                rows={2}
                className="w-full resize-none rounded-xl border border-border/60 bg-background p-2.5 text-sm outline-none focus:border-primary"
              />
              <div className="flex items-center gap-2">
                <Button
                  onClick={retomar}
                  disabled={busy}
                  className="h-9 bg-coral text-white hover:bg-coral/90"
                >
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirmar retomada"}
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => setConfirmando(false)}
                  disabled={busy}
                  className="h-9"
                >
                  Cancelar
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
