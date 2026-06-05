"use client"

import { useCallback, useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Loader2, Check, X, ShieldCheck } from "lucide-react"
import { fotosDoPost } from "@/lib/rede"
import { tempoRelativo } from "@/lib/tempo"

interface Pendente {
  id: string
  corpo: string
  midias?: string | null
  criadoEm: string
  autorNome: string
  autorHandle: string
}

export default function ModeracaoPage() {
  const [itens, setItens] = useState<Pendente[]>([])
  const [loading, setLoading] = useState(true)
  const [agindo, setAgindo] = useState<string | null>(null)

  const carregar = useCallback(() => {
    setLoading(true)
    fetch("/api/rede/moderacao/posts-pendentes")
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => setItens(Array.isArray(d) ? d : []))
      .catch(() => setItens([]))
      .finally(() => setLoading(false))
  }, [])
  useEffect(() => carregar(), [carregar])

  async function agir(id: string, acao: "aprovar" | "rejeitar") {
    setAgindo(id)
    try {
      const r = await fetch(`/api/rede/moderacao/posts/${id}/${acao}`, { method: "POST" })
      if (r.ok) setItens((x) => x.filter((p) => p.id !== id))
    } finally {
      setAgindo(null)
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4 p-6">
      <h1 className="flex items-center gap-2 text-xl font-semibold text-foreground">
        <ShieldCheck className="h-5 w-5 text-primary" /> Moderação — posts com foto
      </h1>
      <p className="text-sm text-muted-foreground">Posts com foto aparecem no feed só após aprovação.</p>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      ) : itens.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border/60 p-10 text-center text-sm text-muted-foreground">
          Nada pendente. 🎉
        </p>
      ) : (
        itens.map((p) => {
          const fotos = fotosDoPost(p.midias)
          return (
            <Card key={p.id} className="border-border/60">
              <CardContent className="space-y-3 p-4">
                <p className="text-sm">
                  <span className="font-medium text-foreground">{p.autorNome}</span>{" "}
                  <span className="text-muted-foreground">@{p.autorHandle} · {tempoRelativo(p.criadoEm)}</span>
                </p>
                {p.corpo && <p className="whitespace-pre-wrap text-sm text-foreground/90">{p.corpo}</p>}
                {fotos.length > 0 && (
                  <div className="grid grid-cols-2 gap-1.5">
                    {fotos.map((s, i) => (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img key={i} src={s} alt="" className="max-h-72 w-full rounded-lg object-cover" />
                    ))}
                  </div>
                )}
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => agir(p.id, "aprovar")} disabled={agindo === p.id} className="gap-1.5">
                    <Check className="h-4 w-4" /> Aprovar
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => agir(p.id, "rejeitar")} disabled={agindo === p.id} className="gap-1.5 text-destructive">
                    <X className="h-4 w-4" /> Rejeitar
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        })
      )}
    </div>
  )
}
