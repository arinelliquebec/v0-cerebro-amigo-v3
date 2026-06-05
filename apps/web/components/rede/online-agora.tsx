"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { iniciais } from "@/lib/rede"

interface Online {
  medicoId: string
  nome: string
  handle: string
  fotoUrl: string | null
}

// Widget "Online agora" (lateral direita da home). Atualiza a cada 30s.
export function OnlineAgora() {
  const [online, setOnline] = useState<Online[]>([])

  useEffect(() => {
    const carregar = () =>
      fetch("/api/rede/presenca/online")
        .then((r) => (r.ok ? r.json() : []))
        .then((d) => setOnline(Array.isArray(d) ? d : []))
        .catch(() => {})
    carregar()
    const id = setInterval(carregar, 30_000)
    return () => clearInterval(id)
  }, [])

  if (online.length === 0) return null

  return (
    <div className="rounded-2xl border border-border/60 bg-card p-4">
      <p className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-foreground">
        <span className="h-2 w-2 rounded-full bg-success" /> Online agora
      </p>
      <ul className="space-y-2.5">
        {online.map((m) => (
          <li key={m.medicoId}>
            <Link href={`/rede/perfil/${m.handle}`} className="flex items-center gap-2 hover:opacity-80">
              <div className="relative shrink-0">
                <Avatar className="h-8 w-8">
                  {m.fotoUrl ? <AvatarImage src={m.fotoUrl} alt={m.nome} /> : null}
                  <AvatarFallback className="bg-primary/10 text-xs text-primary">{iniciais(m.nome)}</AvatarFallback>
                </Avatar>
                <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-card bg-success" />
              </div>
              <span className="truncate text-sm text-foreground">{m.nome}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
