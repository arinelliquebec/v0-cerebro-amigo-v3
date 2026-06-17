"use client"

// Navegação entre as seções unitárias do prontuário. Cada seção é uma rota
// própria sob /dashboard/prontuarios/<id>/<secao>; a ativa vem do pathname.

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

const SECOES = [
  { slug: "timeline", label: "Timeline" },
  { slug: "prescricoes", label: "Prescrições" },
  { slug: "medicacoes", label: "Medicações em uso" },
  { slug: "escalas", label: "Escalas" },
  { slug: "busca", label: "Busca" },
  { slug: "conduta", label: "Conduta" },
  { slug: "exames", label: "Exames" },
] as const

export function ProntuarioNav({ pacienteId }: { pacienteId: string }) {
  const pathname = usePathname()
  return (
    <div className="flex flex-wrap gap-1 rounded-lg bg-muted/50 p-1">
      {SECOES.map((s) => {
        const href = `/dashboard/prontuarios/${pacienteId}/${s.slug}`
        const ativo = pathname === href
        return (
          <Link
            key={s.slug}
            href={href}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              ativo
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            {s.label}
          </Link>
        )
      })}
    </div>
  )
}
