"use client"

import { useEffect, useRef } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

// Banner exibido no /medico quando o médico chega pelo QR do PDF do Check-up
// (?src=checkup&rid=...). Dispara `qr_scanned` (atribuição, ADR-046) e leva ao
// cadastro carregando src/rid adiante. Isolamento: o evento vai pra API pública do
// checkup via BFF (/api/checkup-event); o web nunca escreve o schema checkup.
export function CheckupQrBanner({ rid }: { rid: string }) {
  const fired = useRef(false)

  useEffect(() => {
    if (fired.current) return
    fired.current = true
    fetch("/api/checkup-event", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event: "qr_scanned", rid }),
    }).catch(() => {})
  }, [rid])

  return (
    <div className="border-b border-border/40 bg-primary/10">
      <div className="container mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-6 py-3 sm:flex-row">
        <p className="text-sm text-foreground">
          Você recebeu um relatório do Check-up Mental. Crie sua conta para acompanhar os pacientes que chegam até você.
        </p>
        <Button asChild size="sm" className="shrink-0">
          <Link href={`/medicos/cadastro?src=checkup&rid=${encodeURIComponent(rid)}`}>
            Criar conta grátis
          </Link>
        </Button>
      </div>
    </div>
  )
}
