import { cn } from "@/lib/utils"

/**
 * AuroraBackdrop — camada de fundo decorativa (aurora + grid neural).
 * Server-safe, `pointer-events-none`. Reusada em Hero, Security, CTA.
 */
export function AuroraBackdrop({
  className,
  grid = false,
}: {
  className?: string
  grid?: boolean
}) {
  return (
    <div className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)} aria-hidden>
      <div className="aurora absolute inset-0" />
      {grid && <div className="grid-noir absolute inset-0" />}
    </div>
  )
}
