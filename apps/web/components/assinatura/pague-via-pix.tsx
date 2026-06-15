"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { QrCode, Copy, Check } from "lucide-react"

/**
 * Painel "Pague via Pix" — modo bootstrap (ADR-055, enquanto o Asaas prod não está
 * no ar). Mostra a chave Pix da plataforma para o médico pagar manualmente; o admin
 * libera depois em /admin/financeiro (status='ativa').
 *
 * Renderiza SÓ se `NEXT_PUBLIC_MANUAL_PIX_CHAVE` estiver setada (build-time). Sem a
 * env → retorna null (volta ao self-checkout Asaas). A chave Pix é pública/compartilhável
 * por natureza, então pode ser NEXT_PUBLIC.
 */
const CHAVE = process.env.NEXT_PUBLIC_MANUAL_PIX_CHAVE
const NOME = process.env.NEXT_PUBLIC_MANUAL_PIX_NOME

export const MANUAL_PIX_ATIVO = !!CHAVE

const brl = (n?: number) =>
  n != null ? `R$ ${n.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}` : null

export function PagueViaPix({ valor }: { valor?: number }) {
  const [copiado, setCopiado] = useState(false)
  if (!CHAVE) return null

  async function copiar() {
    try {
      await navigator.clipboard.writeText(CHAVE!)
      setCopiado(true)
      setTimeout(() => setCopiado(false), 2000)
    } catch {
      /* clipboard indisponível — a chave segue visível para cópia manual */
    }
  }

  return (
    <div className="space-y-3 rounded-2xl border border-primary/30 bg-primary/5 p-5">
      <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
        <QrCode className="h-5 w-5 text-primary" /> Pague via Pix
      </div>
      <p className="text-xs text-muted-foreground">
        {valor != null ? (
          <>
            Valor: <span className="font-medium text-foreground">{brl(valor)}</span>/mês.{" "}
          </>
        ) : null}
        Pague na chave abaixo. Após o pagamento, seu acesso é liberado (em até algumas horas).
      </p>
      <div className="flex items-center gap-2 rounded-xl border border-border/60 bg-background/60 p-3">
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
            Chave Pix{NOME ? ` · ${NOME}` : ""}
          </p>
          <p className="truncate text-sm font-medium text-foreground">{CHAVE}</p>
        </div>
        <Button size="sm" variant="outline" className="h-8 shrink-0 gap-1.5" onClick={copiar}>
          {copiado ? (
            <>
              <Check className="h-3.5 w-3.5" /> copiado
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5" /> copiar
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
