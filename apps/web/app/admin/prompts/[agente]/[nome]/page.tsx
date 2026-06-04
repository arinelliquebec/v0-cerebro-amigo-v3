"use client"

import { useCallback, useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowLeft, Save, RotateCcw, AlertCircle, Lock } from "lucide-react"
import { promptTravado } from "@/lib/prompts-guard"

interface PromptVersao {
  id: string
  versao: number
  conteudo: string
  ativo: boolean
  metadata?: string
  criadoEm: string
  criadoPorNome?: string
}

export default function AdminPromptEditPage() {
  const params = useParams()
  const router = useRouter()
  const agente = decodeURIComponent(params.agente as string)
  const nome = decodeURIComponent(params.nome as string)
  const travado = promptTravado(agente, nome)

  const [versoes, setVersoes] = useState<PromptVersao[]>([])
  const [conteudo, setConteudo] = useState("")
  const [loading, setLoading] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState("")
  const [sucesso, setSucesso] = useState("")

  const recarregar = useCallback(() => {
    setLoading(true)
    fetch(`/api/prompts/${encodeURIComponent(agente)}/${encodeURIComponent(nome)}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((data: PromptVersao[]) => {
        setVersoes(data)
        const ativo = data.find((v) => v.ativo)
        if (ativo) setConteudo(ativo.conteudo)
      })
      .catch(() => setVersoes([]))
      .finally(() => setLoading(false))
  }, [agente, nome])

  useEffect(() => {
    recarregar()
  }, [recarregar])

  const salvar = async () => {
    if (travado) return
    setSalvando(true)
    setErro("")
    setSucesso("")
    try {
      const res = await fetch("/api/prompts/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agente, nome, conteudo }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || `Erro ${res.status}`)
      }
      const data = await res.json()
      setSucesso(`Nova versão v${data.versao} criada.`)
      recarregar()
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Falha ao salvar.")
    } finally {
      setSalvando(false)
    }
  }

  const ativar = async (id: string) => {
    if (travado) return
    setErro("")
    setSucesso("")
    try {
      const res = await fetch(`/api/prompts/ativar/${id}`, { method: "POST" })
      if (!res.ok) throw new Error(`Erro ${res.status}`)
      setSucesso("Versão ativada com sucesso.")
      recarregar()
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Falha ao ativar.")
    }
  }

  // Versão anterior à ativa (para o botão "Reverter para anterior").
  const versaoAnterior = (() => {
    const sorted = [...versoes].sort((a, b) => b.versao - a.versao)
    const aIdx = sorted.findIndex((v) => v.ativo)
    return aIdx !== -1 && aIdx + 1 < sorted.length ? sorted[aIdx + 1] : null
  })()

  return (
    <div className="p-8 space-y-6 max-w-4xl">
      <div className="space-y-3">
        <Button variant="ghost" size="sm" onClick={() => router.push("/admin/prompts")}>
          <ArrowLeft className="w-4 h-4 mr-1" />
          Voltar
        </Button>
        <h1 className="text-2xl font-semibold capitalize text-foreground">
          {nome.replace(/_/g, " ")} <span className="text-muted-foreground">— {agente.replace(/_/g, " ")}</span>
        </h1>
      </div>

      {travado && (
        <Alert className="border-warning/40 bg-warning/5">
          <Lock className="w-4 h-4 text-warning" />
          <AlertDescription className="text-foreground">
            <strong>Prompt de segurança clínica — somente leitura.</strong> Detecção de crise e auditoria da resposta
            ao paciente são salvaguardas (clinical-safety, regras 2 e 3). Alterá-las exige decisão clínica, validação
            em SHADOW_MODE e ADR — não é editável pelo painel.
          </AlertDescription>
        </Alert>
      )}

      {erro && (
        <Alert variant="destructive">
          <AlertCircle className="w-4 h-4" />
          <AlertDescription>{erro}</AlertDescription>
        </Alert>
      )}
      {sucesso && (
        <Alert>
          <AlertDescription>{sucesso}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">{travado ? "Prompt ativo (leitura)" : "Prompt ativo (edição)"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            value={conteudo}
            onChange={(e) => setConteudo(e.target.value)}
            rows={16}
            readOnly={travado}
            className="font-mono text-sm"
            placeholder="Cole o texto do prompt system aqui..."
          />
          {!travado && (
            <div className="flex flex-wrap gap-2">
              <Button onClick={salvar} disabled={salvando || !conteudo.trim()}>
                <Save className="w-4 h-4 mr-1" />
                {salvando ? "Salvando..." : "Salvar nova versão"}
              </Button>
              {versaoAnterior && (
                <Button
                  variant="outline"
                  onClick={() => ativar(versaoAnterior.id)}
                  title={`Reverter para v${versaoAnterior.versao}`}
                >
                  <RotateCcw className="w-4 h-4 mr-1" />
                  Reverter para v{versaoAnterior.versao}
                </Button>
              )}
              <Button variant="ghost" onClick={recarregar} disabled={loading}>
                Recarregar
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Histórico de versões</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          ) : versoes.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma versão editada. O prompt builtin está em uso.</p>
          ) : (
            <div className="divide-y">
              {versoes.map((v) => (
                <div key={v.id} className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-2">
                    <Badge variant={v.ativo ? "default" : "outline"}>v{v.versao}</Badge>
                    <span className="text-xs text-muted-foreground">
                      {new Date(v.criadoEm).toLocaleDateString("pt-BR")} por {v.criadoPorNome ?? "sistema"}
                    </span>
                  </div>
                  {!v.ativo && !travado && (
                    <Button size="sm" variant="ghost" onClick={() => ativar(v.id)}>
                      Ativar
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
