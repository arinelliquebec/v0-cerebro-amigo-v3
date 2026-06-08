"use client"

import { useEffect } from "react"
import { RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"

/**
 * Error boundary do portal do paciente (/p/*). Captura erros não tratados
 * dos Server Components (ex.: gateway indisponível, timeout, 500) e mostra
 * uma tela acolhedora em pt-BR, no lugar da tela crua/em inglês do Next.
 *
 * IMPORTANTE (clinical-safety): isto é um erro técnico de carregamento, NÃO
 * um evento de crise. Não exibimos linha de crise (CVV/188) aqui — o rodapé
 * de crise é fixo e estático em outras telas do portal, nunca uma reação a
 * falha técnica. Também não expomos error.message/digest ao paciente fora de
 * desenvolvimento (pode conter detalhe interno/PII).
 */
export default function PortalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.error("Portal paciente error:", error)
  }, [error])

  return (
    <div className="p-4 pt-8">
      <div className="rounded-2xl border border-border/60 bg-card p-6 text-center space-y-4">
        <div className="flex justify-center">
          <div className="grid h-14 w-14 place-items-center rounded-2xl bg-primary/10 text-primary">
            <RefreshCw className="h-6 w-6" />
          </div>
        </div>
        <h2 className="text-lg font-semibold text-foreground">
          Não foi possível carregar agora
        </h2>
        <p className="text-sm text-muted-foreground">
          Não conseguimos carregar suas informações neste momento. Isso costuma
          ser temporário — toque em &quot;Tentar de novo&quot; ou volte daqui a
          alguns instantes.
        </p>
        <Button onClick={reset} className="w-full">
          Tentar de novo
        </Button>
        {process.env.NODE_ENV === "development" && (
          <pre className="text-left text-xs bg-muted p-3 rounded-lg overflow-auto max-h-48">
            {error.message}
            {error.digest && `\nDigest: ${error.digest}`}
          </pre>
        )}
      </div>
    </div>
  )
}
