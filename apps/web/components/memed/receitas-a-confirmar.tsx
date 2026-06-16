"use client"

import { useCallback, useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { FileClock, Plus, X, Loader2, AlertTriangle, Check } from "lucide-react"

interface Rascunho {
  id: string
  medicamento: string
  doseDescricao: string
  receitaTipo: string | null
  criadaEm: string
}

/**
 * Fila de confirmação de receita MEMED (Tier 1, ADR-056).
 *
 * O espelho de uma receita emitida no MEMED não conhece horários (lembrete) nem
 * validade (renovação) — entra como rascunho (ativa=false) e fica fora dos jobs.
 * Aqui o médico informa esses dados estruturados e ATIVA a prescrição. A IA não
 * infere posologia; quem decide horário/validade é o médico (clinical-safety #4).
 *
 * Só renderiza algo quando há rascunhos pendentes.
 */
export function ReceitasMemedAConfirmar({
  pacienteId,
  refreshSignal,
  onConfirmado,
}: {
  pacienteId: string
  refreshSignal?: number
  onConfirmado?: () => void
}) {
  const [itens, setItens] = useState<Rascunho[]>([])
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState(false)

  const carregar = useCallback(async () => {
    setLoading(true)
    setErro(false)
    try {
      const r = await fetch(`/api/pacientes/${pacienteId}/prescricoes-a-confirmar`)
      const d = await r.json().catch(() => null)
      if (r.ok && Array.isArray(d)) {
        setItens(
          d.map((x: any) => ({
            id: x.id,
            medicamento: x.medicamento,
            doseDescricao: x.doseDescricao ?? x.dose_descricao ?? "",
            receitaTipo: x.receitaTipo ?? x.receita_tipo ?? null,
            criadaEm: x.criadaEm ?? x.criada_em ?? "",
          })),
        )
      } else {
        setErro(true)
      }
    } catch {
      setErro(true)
    } finally {
      setLoading(false)
    }
  }, [pacienteId])

  useEffect(() => {
    carregar()
  }, [carregar, refreshSignal])

  const aoResolver = useCallback(
    (id: string) => {
      setItens((prev) => prev.filter((x) => x.id !== id))
      onConfirmado?.()
    },
    [onConfirmado],
  )

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
        <Loader2 className="h-4 w-4 animate-spin" /> Verificando receitas a confirmar…
      </div>
    )
  }

  // Falha na busca: avisa, mas não bloqueia o resto do prontuário.
  if (erro) {
    return (
      <p className="flex items-start gap-1.5 text-sm text-amber-600">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
        Não foi possível verificar receitas MEMED a confirmar. Recarregue para tentar de novo.
      </p>
    )
  }

  if (itens.length === 0) return null

  return (
    <Card className="border-primary/40 bg-primary/5">
      <CardContent className="p-4 space-y-4">
        <div className="flex items-center gap-2">
          <FileClock className="h-4 w-4 text-primary" />
          <p className="text-sm font-medium text-foreground">
            Receita(s) MEMED a confirmar ({itens.length})
          </p>
        </div>
        <p className="text-xs text-muted-foreground -mt-2">
          Informe os horários para ligar o lembrete de adesão e a validade para
          entrar na fila de renovação. Sem confirmar, a receita não gera lembrete
          nem renovação.
        </p>
        {itens.map((item) => (
          <LinhaRascunho key={item.id} item={item} onResolvido={() => aoResolver(item.id)} />
        ))}
      </CardContent>
    </Card>
  )
}

function LinhaRascunho({ item, onResolvido }: { item: Rascunho; onResolvido: () => void }) {
  const [horarios, setHorarios] = useState<string[]>(["08:00"])
  const [validade, setValidade] = useState("")
  const [inicio, setInicio] = useState("")
  const [fim, setFim] = useState("")
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  const horariosValidos = horarios.filter((h) => h.trim() !== "")
  // Confirmar só faz sentido se ligar pelo menos uma automação (lembrete ou renovação).
  const podeAtivar = horariosValidos.length > 0 || validade !== ""

  const setHorario = (i: number, v: string) =>
    setHorarios((prev) => prev.map((h, idx) => (idx === i ? v : h)))
  const addHorario = () => setHorarios((prev) => [...prev, ""])
  const removeHorario = (i: number) =>
    setHorarios((prev) => (prev.length > 1 ? prev.filter((_, idx) => idx !== i) : prev))

  const confirmar = async () => {
    setErro(null)
    setSalvando(true)
    try {
      const r = await fetch(`/api/prescricoes/${item.id}/confirmar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          horarios: horariosValidos,
          receitaValidade: validade || null,
          inicioEm: inicio || null,
          fimEm: fim || null,
        }),
      })
      if (r.ok) {
        onResolvido()
      } else {
        setErro("Não foi possível confirmar. Tente novamente.")
      }
    } catch {
      setErro("Não foi possível confirmar. Verifique a conexão e tente novamente.")
    } finally {
      setSalvando(false)
    }
  }

  const descartar = async () => {
    setErro(null)
    setSalvando(true)
    try {
      const r = await fetch(`/api/prescricoes/${item.id}/descartar`, { method: "POST" })
      if (r.ok) {
        onResolvido()
      } else {
        setErro("Não foi possível descartar. Tente novamente.")
      }
    } catch {
      setErro("Não foi possível descartar. Verifique a conexão e tente novamente.")
    } finally {
      setSalvando(false)
    }
  }

  return (
    <div className="rounded-lg border border-border bg-background p-3 space-y-3">
      <div>
        <p className="text-sm font-medium text-foreground">{item.medicamento}</p>
        {item.doseDescricao && (
          <p className="text-xs text-muted-foreground">Posologia MEMED: {item.doseDescricao}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <p className="text-xs font-medium text-muted-foreground">Horários do lembrete</p>
        <div className="flex flex-wrap items-center gap-2">
          {horarios.map((h, i) => (
            <div key={i} className="flex items-center gap-1">
              <Input
                type="time"
                value={h}
                onChange={(e) => setHorario(i, e.target.value)}
                className="h-8 w-28"
              />
              {horarios.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeHorario(i)}
                  className="text-muted-foreground hover:text-destructive"
                  aria-label="Remover horário"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}
          <Button type="button" variant="outline" size="sm" className="h-8 gap-1" onClick={addHorario}>
            <Plus className="h-3.5 w-3.5" /> Horário
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <label className="space-y-1">
          <span className="text-xs font-medium text-muted-foreground">Validade da receita</span>
          <Input type="date" value={validade} onChange={(e) => setValidade(e.target.value)} className="h-8" />
        </label>
        <label className="space-y-1">
          <span className="text-xs font-medium text-muted-foreground">Início (opcional)</span>
          <Input type="date" value={inicio} onChange={(e) => setInicio(e.target.value)} className="h-8" />
        </label>
        <label className="space-y-1">
          <span className="text-xs font-medium text-muted-foreground">Fim (opcional)</span>
          <Input type="date" value={fim} onChange={(e) => setFim(e.target.value)} className="h-8" />
        </label>
      </div>

      {erro && (
        <p className="flex items-start gap-1.5 text-sm text-destructive">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /> {erro}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <Button onClick={confirmar} disabled={salvando || !podeAtivar} size="sm" className="gap-1.5">
          {salvando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
          Ativar lembrete + renovação
        </Button>
        <Button onClick={descartar} disabled={salvando} variant="ghost" size="sm" className="text-muted-foreground">
          Descartar
        </Button>
        {!podeAtivar && (
          <span className="text-xs text-muted-foreground">
            Informe ao menos um horário ou a validade.
          </span>
        )}
      </div>
    </div>
  )
}
