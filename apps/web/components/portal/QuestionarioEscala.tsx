"use client"

import { useEffect, useState } from "react"
import { Loader2, Check, ShieldAlert, Phone } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface OpcaoEscala {
  label: string
  valor: number
}
interface EscalaDef {
  codigo: string
  nome: string
  instrucao: string
  opcoes: OpcaoEscala[]
  itens: string[]
}

interface Props {
  checkinId: string
  /** "phq9" | "gad7" */
  codigo: string
  onConcluido: (id: string) => void
}

type Fase = "carregando" | "form" | "enviando" | "enviado" | "crise" | "erro"

/**
 * Formulário de escala clínica (PHQ-9/GAD-7) no portal do paciente.
 * Busca o instrumento versionado do backend (front só renderiza, não inventa
 * texto), envia as respostas e trata o caso de crise: quando o item de ideação
 * (PHQ-9 item 9) > 0, o backend aciona o protocolo fixo e devolve o acolhimento
 * — exibido aqui literalmente (com fallback mínimo de emergência se vier vazio).
 */
export function QuestionarioEscala({ checkinId, codigo, onConcluido }: Props) {
  const [def, setDef] = useState<EscalaDef | null>(null)
  const [fase, setFase] = useState<Fase>("carregando")
  const [respostas, setRespostas] = useState<Record<string, number>>({})
  const [criseTexto, setCriseTexto] = useState<string | null>(null)

  useEffect(() => {
    fetch(`/api/paciente/escalas/${codigo}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d: EscalaDef) => {
        setDef(d)
        setFase("form")
      })
      .catch(() => setFase("erro"))
  }, [codigo])

  const total = def?.itens.length ?? 0
  const completo = total > 0 && Object.keys(respostas).length === total

  async function enviar() {
    if (!completo) return
    setFase("enviando")
    try {
      const r = await fetch(`/api/paciente/checkins/${checkinId}/responder`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resposta: { respostas } }),
      })
      // Crise (item de ideação): backend responde 200 com o acolhimento fixo.
      if (r.status === 200) {
        const data = await r.json().catch(() => null)
        if (data?.crise) {
          setCriseTexto(data.criseTexto ?? null)
          setFase("crise")
          return
        }
      }
      if (r.ok) {
        setFase("enviado")
        onConcluido(checkinId)
        return
      }
      setFase("erro")
    } catch {
      setFase("erro")
    }
  }

  if (fase === "carregando")
    return <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />

  if (fase === "erro")
    return (
      <p className="text-xs text-destructive">
        Não foi possível carregar agora. Tente novamente mais tarde.
      </p>
    )

  if (fase === "enviado")
    return (
      <p className="flex items-center gap-1 text-sm text-success">
        <Check className="h-4 w-4" /> Respostas enviadas
      </p>
    )

  if (fase === "crise")
    return (
      <div className="space-y-2 rounded-xl border border-destructive/30 bg-destructive/5 p-3">
        <p className="flex items-center gap-1.5 text-sm font-medium text-destructive">
          <ShieldAlert className="h-4 w-4" /> Sua psiquiatra foi avisada agora
        </p>
        <p className="whitespace-pre-line text-sm text-foreground">
          {criseTexto ??
            "Se você sente que pode se machucar ou está em risco agora, ligue para o CVV no 188 (24h, gratuito). Em risco imediato, vá ao pronto-socorro mais próximo ou ligue para o SAMU (192)."}
        </p>
        <a
          href="tel:188"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-destructive underline"
        >
          <Phone className="h-4 w-4" /> Ligar para o CVV (188)
        </a>
      </div>
    )

  // form
  return (
    <div className="space-y-4">
      {def && <p className="text-xs text-muted-foreground">{def.instrucao}</p>}
      <ol className="space-y-3">
        {def?.itens.map((texto, i) => {
          const chave = `q${i + 1}`
          return (
            <li key={chave} className="space-y-1.5">
              <p className="text-sm text-foreground">
                {i + 1}. {texto}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {def.opcoes.map((op) => (
                  <button
                    key={op.valor}
                    type="button"
                    onClick={() => setRespostas((r) => ({ ...r, [chave]: op.valor }))}
                    className={cn(
                      "rounded-full border px-2.5 py-1 text-xs transition-colors",
                      respostas[chave] === op.valor
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-background text-muted-foreground hover:border-primary/50",
                    )}
                  >
                    {op.label}
                  </button>
                ))}
              </div>
            </li>
          )
        })}
      </ol>
      <Button size="sm" onClick={enviar} disabled={!completo || fase === "enviando"} className="w-full">
        {fase === "enviando" ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : completo ? (
          "Enviar respostas"
        ) : (
          `Responda os ${total} itens`
        )}
      </Button>
    </div>
  )
}
