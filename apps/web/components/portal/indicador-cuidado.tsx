"use client"

import { Check, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

/** Etapas honestas do pipeline clínico (orchestrator → auditoria → resposta). */
export type EtapaCuidado = "lendo" | "organizando" | "conferindo" | "finalizando"

const ORDEM: EtapaCuidado[] = ["lendo", "organizando", "conferindo", "finalizando"]

const PASSOS: { id: EtapaCuidado; titulo: string; descricao: string }[] = [
  { id: "lendo", titulo: "Lendo", descricao: "Lendo sua mensagem…" },
  { id: "organizando", titulo: "Organizando", descricao: "Organizando o que você compartilhou…" },
  { id: "conferindo", titulo: "Conferindo", descricao: "Conferindo com segurança…" },
]

const NODE_ETAPA: Record<string, EtapaCuidado> = {
  load_context: "lendo",
  detect_crisis: "lendo",
  degraded_response: "organizando",
  classify_medication: "organizando",
  update_medication_intake: "organizando",
  medication_acknowledgment: "organizando",
  extract_symptoms: "organizando",
  generate_response: "organizando",
  audit_response: "conferindo",
  escalate_to_human: "conferindo",
  finalize: "finalizando",
  crisis_protocol: "finalizando",
}

export function etapaDeNode(name: string, status: string): EtapaCuidado | null {
  if (status !== "started") return null
  return NODE_ETAPA[name] ?? null
}

export function avancarEtapa(
  atual: EtapaCuidado | null,
  nova: EtapaCuidado,
): EtapaCuidado {
  if (!atual) return nova
  return ORDEM.indexOf(nova) > ORDEM.indexOf(atual) ? nova : atual
}

interface IndicadorCuidadoProps {
  etapa: EtapaCuidado
}

/**
 * Progresso calmo e honesto durante a conversa — substitui "digitando…".
 * Reflete estágios reais do grafo (leitura → organização → auditoria).
 */
export function IndicadorCuidado({ etapa }: IndicadorCuidadoProps) {
  const idxAtual = ORDEM.indexOf(etapa)
  const passoVisivel = etapa === "finalizando" ? 2 : Math.min(idxAtual, PASSOS.length - 1)
  const descricao =
    etapa === "finalizando"
      ? "Quase pronto…"
      : PASSOS[passoVisivel]?.descricao ?? "Processando…"

  return (
    <div
      className="max-w-[85%] rounded-2xl border border-border/60 bg-card/80 px-4 py-3 space-y-3"
      role="status"
      aria-live="polite"
      aria-label={descricao}
    >
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 shrink-0 animate-spin text-primary" />
        <span>{descricao}</span>
      </div>

      <ol className="flex items-center gap-1.5" aria-hidden>
        {PASSOS.map((passo, i) => {
          const feito = i < passoVisivel
          const ativo = i === passoVisivel
          return (
            <li key={passo.id} className="flex flex-1 items-center gap-1.5 min-w-0">
              <span
                className={cn(
                  "grid h-6 w-6 shrink-0 place-items-center rounded-full border text-[10px] font-semibold transition-colors",
                  feito && "border-success/40 bg-success/10 text-success",
                  ativo && !feito && "border-primary bg-primary/10 text-primary",
                  !feito && !ativo && "border-border text-muted-foreground",
                )}
              >
                {feito ? <Check className="h-3 w-3" /> : i + 1}
              </span>
              <span
                className={cn(
                  "hidden truncate text-[10px] font-medium uppercase tracking-wide sm:inline",
                  ativo ? "text-foreground" : "text-muted-foreground",
                )}
              >
                {passo.titulo}
              </span>
              {i < PASSOS.length - 1 && (
                <span
                  className={cn(
                    "mx-0.5 h-px flex-1",
                    feito ? "bg-success/40" : "bg-border",
                  )}
                />
              )}
            </li>
          )
        })}
      </ol>
    </div>
  )
}
