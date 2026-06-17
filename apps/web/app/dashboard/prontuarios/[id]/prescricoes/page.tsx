"use client"

import { useCallback, useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { BotaoReceitaMemed } from "@/components/memed/botao-receita-memed"
import { ReceitasMemedAConfirmar } from "@/components/memed/receitas-a-confirmar"
import { VerificadorInteracoes } from "@/components/memed/verificador-interacoes"
import { Pill, AlertTriangle, Loader2 } from "lucide-react"

interface Prescricao {
  id: string
  medicamentoNome: string
  posologia: string
  ativa: boolean
  inicioEm: string
}

export default function PrescricoesPage() {
  const { id } = useParams<{ id: string }>()
  const [prescricoes, setPrescricoes] = useState<Prescricao[]>([])
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState(false)
  // Sobe a cada receita MEMED espelhada → refaz a fila de confirmação.
  const [confirmacaoSignal, setConfirmacaoSignal] = useState(0)

  const fetchPrescricoes = useCallback((pid: string) => {
    setLoading(true)
    setErro(false)
    setPrescricoes([])
    fetch(`/api/pacientes/${pid}/prescricoes`)
      .then((r) => {
        if (!r.ok) throw new Error("falha ao carregar prescrições")
        return r.json()
      })
      .then(setPrescricoes)
      .catch(() => setErro(true))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (id) fetchPrescricoes(id)
  }, [id, fetchPrescricoes])

  return (
    <div className="space-y-3">
      <BotaoReceitaMemed
        pacienteId={id}
        onReceitaRegistrada={() => setConfirmacaoSignal((s) => s + 1)}
      />
      <ReceitasMemedAConfirmar
        pacienteId={id}
        refreshSignal={confirmacaoSignal}
        onConfirmado={() => fetchPrescricoes(id)}
      />
      <VerificadorInteracoes pacienteId={id} />

      {loading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : erro ? (
        <Card className="border-amber-500/40 bg-amber-500/5">
          <CardContent className="p-6 text-center py-8">
            <AlertTriangle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
            <p className="text-sm text-foreground font-medium">
              Não foi possível carregar as prescrições deste paciente.
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Recarregue antes de tomar decisões clínicas — a lista pode estar incompleta.
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-4"
              onClick={() => id && fetchPrescricoes(id)}
            >
              Tentar novamente
            </Button>
          </CardContent>
        </Card>
      ) : prescricoes.length === 0 ? (
        <Card className="border-border/50">
          <CardContent className="p-6 text-center py-8">
            <Pill className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-sm text-muted-foreground">Sem prescrições registradas.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {prescricoes.map((rx) => (
            <Card key={rx.id} className="border-border/50">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                  <Pill className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground">{rx.medicamentoNome}</p>
                  <p className="text-sm text-muted-foreground">{rx.posologia}</p>
                </div>
                <Badge
                  className={
                    rx.ativa
                      ? "bg-success/15 text-success"
                      : "bg-muted text-muted-foreground"
                  }
                >
                  {rx.ativa ? "Ativa" : "Inativa"}
                </Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
