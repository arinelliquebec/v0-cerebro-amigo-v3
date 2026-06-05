"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { toast } from "sonner"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { BadgeCheck, UserPlus } from "lucide-react"
import type { Sugestao } from "@/lib/rede"
import { iniciais } from "@/lib/rede"

export function Sugestoes() {
  const [sugestoes, setSugestoes] = useState<Sugestao[]>([])
  const [seguindo, setSeguindo] = useState<Set<string>>(new Set())

  useEffect(() => {
    fetch("/api/rede/sugestoes")
      .then((r) => (r.ok ? r.json() : []))
      .then(setSugestoes)
      .catch(() => setSugestoes([]))
  }, [])

  async function seguir(medicoId: string) {
    setSeguindo((s) => new Set(s).add(medicoId))
    try {
      const res = await fetch(`/api/rede/seguir/${medicoId}`, { method: "POST" })
      if (res.status !== 204) {
        setSeguindo((s) => { const n = new Set(s); n.delete(medicoId); return n })
        toast.error("Não foi possível seguir.")
      }
    } catch {
      setSeguindo((s) => { const n = new Set(s); n.delete(medicoId); return n })
      toast.error("Erro de conexão.")
    }
  }

  if (sugestoes.length === 0) return null

  return (
    <Card className="border-border/60">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm font-medium text-foreground">
          <UserPlus className="h-4 w-4 text-muted-foreground" />
          Quem seguir
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {sugestoes.map((s) => (
          <div key={s.medicoId} className="flex items-center gap-3">
            <Link href={`/rede/perfil/${s.handle}`} className="shrink-0">
              <Avatar className="h-9 w-9">
                {s.fotoUrl ? <AvatarImage src={s.fotoUrl} alt={s.nome} /> : null}
                <AvatarFallback className="bg-primary/10 text-xs text-primary">{iniciais(s.nome)}</AvatarFallback>
              </Avatar>
            </Link>
            <div className="min-w-0 flex-1">
              <Link href={`/rede/perfil/${s.handle}`} className="flex items-center gap-1 truncate text-sm font-medium text-foreground hover:underline">
                {s.nome}
                {s.verificado && <BadgeCheck className="h-3.5 w-3.5 text-primary" />}
              </Link>
              {s.especialidade && (
                <p className="truncate text-xs capitalize text-muted-foreground">{s.especialidade}</p>
              )}
            </div>
            <Button
              size="sm"
              variant={seguindo.has(s.medicoId) ? "outline" : "default"}
              className="h-7 rounded-full px-3 text-xs"
              disabled={seguindo.has(s.medicoId)}
              onClick={() => seguir(s.medicoId)}
            >
              {seguindo.has(s.medicoId) ? "Seguindo" : "Seguir"}
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
