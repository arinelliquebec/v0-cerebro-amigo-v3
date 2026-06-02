"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { AlertCircle, Plus } from "lucide-react"

interface PromptAtivo {
  id: string
  agente: string
  nome: string
  versao: number
  conteudo: string
  metadata?: string
  criadoEm: string
  criadoPorNome?: string
}

export default function PromptsPage() {
  const [prompts, setPrompts] = useState<PromptAtivo[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/prompts/")
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((data: PromptAtivo[]) => setPrompts(data))
      .catch(() => setPrompts([]))
      .finally(() => setLoading(false))
  }, [])

  const porAgente = prompts.reduce<Record<string, PromptAtivo[]>>((acc, p) => {
    acc[p.agente] = acc[p.agente] || []
    acc[p.agente].push(p)
    return acc
  }, {})

  return (
    <div className="min-h-screen">
      <Header title="Editor de Prompts" />

      <div className="p-8 space-y-6">
        <p className="text-sm text-muted-foreground">
          Gerencie os prompts system dos agentes de IA. Cada alteração cria uma
          nova versão; a anterior é preservada para audit. Apenas administradores
          podem editar.
        </p>

        {loading && (
          <div className="space-y-4">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        )}

        {!loading && prompts.length === 0 && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <AlertCircle className="w-4 h-4" />
            <span>Nenhum prompt cadastrado. Os prompts builtin (hardcoded) estão em uso.</span>
          </div>
        )}

        {Object.entries(porAgente).map(([agente, lista]) => (
          <Card key={agente}>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg capitalize">{agente.replace("_", " ")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {lista.map((p) => (
                <div
                  key={p.id}
                  className="flex items-start justify-between border-b last:border-0 pb-3 last:pb-0"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{p.nome.replace("_", " ")}</span>
                      <Badge variant="outline">v{p.versao}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-1 max-w-lg">
                      {p.conteudo.slice(0, 120)}...
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Editado por {p.criadoPorNome ?? "sistema"} em{" "}
                      {new Date(p.criadoEm).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                  <Link href={`/dashboard/prompts/${p.agente}/${p.nome}`}>
                    <Button size="sm" variant="ghost">
                      Ver / Editar
                    </Button>
                  </Link>
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
