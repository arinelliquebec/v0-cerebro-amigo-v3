"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Hash } from "lucide-react"
import type { Comunidade } from "@/lib/rede"

export function ComunidadesList() {
  const [comunidades, setComunidades] = useState<Comunidade[]>([])

  useEffect(() => {
    fetch("/api/rede/comunidades")
      .then((r) => (r.ok ? r.json() : []))
      .then(setComunidades)
      .catch(() => setComunidades([]))
  }, [])

  if (comunidades.length === 0) return null

  return (
    <Card className="border-border/60">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm font-medium text-foreground">
          <Hash className="h-4 w-4 text-muted-foreground" />
          Comunidades
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {comunidades.map((c) => (
          <Link
            key={c.id}
            href={`/rede/comunidade/${c.slug}`}
            className="flex items-center justify-between rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-muted/50"
          >
            <span className="text-foreground">{c.nome}</span>
            {c.especialidade && (
              <Badge variant="secondary" className="text-[10px]">{c.especialidade}</Badge>
            )}
          </Link>
        ))}
      </CardContent>
    </Card>
  )
}
