"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  ShieldAlert,
  MessageSquare,
  AlertCircle,
  BellOff,
  Pill,
  Loader2,
  ChevronRight,
  CheckCircle2,
} from "lucide-react"
import { tempoRelativo } from "@/lib/tempo"

interface FilaItem {
  tipo: string
  pacienteId: string
  pacienteNome: string | null
  severidade: string
  titulo: string
  quando: string
}

const TIPO_CFG: Record<
  string,
  { icon: typeof ShieldAlert; rota: string; label: string }
> = {
  crise: { icon: ShieldAlert, rota: "/dashboard/prontuarios", label: "Crise" },
  escalacao: { icon: MessageSquare, rota: "/dashboard/mensagens", label: "Escalação" },
  insight: { icon: AlertCircle, rota: "/dashboard/prontuarios", label: "Alerta" },
  checkin_perdido: { icon: BellOff, rota: "/dashboard/checkins", label: "Check-in" },
  nao_adesao: { icon: Pill, rota: "/dashboard/prontuarios", label: "Adesão" },
}

const SEV_CFG: Record<string, { dot: string; chip: string }> = {
  critico: { dot: "bg-coral", chip: "text-coral bg-coral/10" },
  urgente: { dot: "bg-coral", chip: "text-coral bg-coral/10" },
  atencao: { dot: "bg-warning", chip: "text-warning bg-warning/10" },
  info: { dot: "bg-primary", chip: "text-primary bg-primary/10" },
}

export function FilaAtencao() {
  const [itens, setItens] = useState<FilaItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/fila")
      .then((r) => (r.ok ? r.json() : []))
      .then((rows) => setItens(Array.isArray(rows) ? rows : []))
      .catch(() => setItens([]))
      .finally(() => setLoading(false))
  }, [])

  return (
    <Card className="border-border/80">
      <CardHeader className="flex flex-row items-center justify-between pb-2 pt-5 px-5">
        <CardTitle className="text-[0.9375rem] font-semibold text-foreground">
          Fila de atenção
        </CardTitle>
        {!loading && itens.length > 0 && (
          <span className="rounded-full bg-coral/10 px-2.5 py-0.5 text-xs font-medium text-coral">
            {itens.length}
          </span>
        )}
      </CardHeader>
      <CardContent className="px-3 pb-4 pt-1">
        {loading ? (
          <div className="flex justify-center py-10 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        ) : itens.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-10 text-center">
            <CheckCircle2 className="h-8 w-8 text-success" />
            <p className="text-sm text-muted-foreground">
              Nada pendente — tudo em dia.
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            {itens.map((it, i) => {
              const cfg = TIPO_CFG[it.tipo] ?? TIPO_CFG.insight
              const sev = SEV_CFG[it.severidade] ?? SEV_CFG.info
              const Icon = cfg.icon
              return (
                <Link
                  key={`${it.tipo}-${it.pacienteId}-${i}`}
                  href={`${cfg.rota}?paciente=${it.pacienteId}`}
                  className="flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-secondary"
                >
                  <span className={`h-2 w-2 shrink-0 rounded-full ${sev.dot}`} />
                  <Icon size={17} className="shrink-0 text-muted-foreground" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">
                      {it.titulo}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {it.pacienteNome ?? "Paciente"} · {tempoRelativo(it.quando)}
                    </p>
                  </div>
                  <span
                    className={`hidden shrink-0 rounded-full px-2 py-0.5 text-[0.6875rem] font-medium sm:inline ${sev.chip}`}
                  >
                    {cfg.label}
                  </span>
                  <ChevronRight size={16} className="shrink-0 text-muted-foreground" />
                </Link>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
