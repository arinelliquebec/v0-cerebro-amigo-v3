"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle2, Clock, AlertCircle, Loader2 } from "lucide-react"
import { tempoRelativo } from "@/lib/tempo"

interface Insight {
  id: string
  pacienteId: string
  nomePaciente: string | null
  agente: string
  titulo: string
  severidade: string
  criadoEm: string
}

const sevConfig: Record<string, { icon: typeof Clock; color: string; bg: string }> = {
  critico: { icon: AlertCircle, color: "text-coral", bg: "bg-coral/7" },
  urgente: { icon: AlertCircle, color: "text-coral", bg: "bg-coral/7" },
  atencao: { icon: Clock, color: "text-warning", bg: "bg-warning/7" },
  info: { icon: CheckCircle2, color: "text-primary", bg: "bg-primary/7" },
}

const delayClass = ["delay-100", "delay-200", "delay-300", "delay-400"]

export function RemindersWidget() {
  const [insights, setInsights] = useState<Insight[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/insights")
      .then((r) => (r.ok ? r.json() : []))
      .then((rows) => setInsights(Array.isArray(rows) ? rows : []))
      .catch(() => setInsights([]))
      .finally(() => setLoading(false))
  }, [])

  return (
    <Card className="border-border/80 hover:border-primary/25 hover:shadow-[0_4px_24px_rgba(94,75,139,0.07)] transition-all duration-200">
      <CardHeader className="pb-1 pt-5 px-5">
        <CardTitle className="text-[0.9375rem] font-semibold text-navy">Alertas dos agentes</CardTitle>
      </CardHeader>
      <CardContent className="px-3 pt-1 pb-3">
        {loading ? (
          <div className="flex justify-center py-8 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        ) : insights.length === 0 ? (
          <p className="px-3 py-8 text-center text-xs text-muted-foreground">
            Nenhum alerta no momento.
          </p>
        ) : (
          <div className="space-y-1">
            {insights.slice(0, 4).map((r, i) => {
              const cfg = sevConfig[r.severidade] ?? sevConfig.info
              const Icon = cfg.icon
              return (
                <div
                  key={r.id}
                  className={`flex items-start gap-3 px-3 py-2.5 rounded-xl ${cfg.bg} animate-fade-left ${delayClass[i]}`}
                >
                  <div className="mt-0.5 flex-shrink-0">
                    <Icon size={17} className={cfg.color} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground">{r.titulo}</p>
                    <p className="text-xs text-muted-foreground">
                      {r.nomePaciente ?? "Paciente"} · {tempoRelativo(r.criadoEm)}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
        <Button
          variant="ghost"
          asChild
          className="mt-1 h-8 w-full text-xs text-primary hover:bg-secondary hover:text-purple-dark"
        >
          <Link href="/dashboard/pacientes">Ver pacientes</Link>
        </Button>
      </CardContent>
    </Card>
  )
}
