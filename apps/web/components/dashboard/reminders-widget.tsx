"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle2, Clock, AlertCircle } from "lucide-react"

const reminders = [
  {
    id: 1,
    title: "Check-in de humor enviado",
    patient: "Maria Santos",
    time: "Hoje, 09:00",
    status: "completed",
  },
  {
    id: 2,
    title: "Lembrete de medicação",
    patient: "João Silva",
    time: "Hoje, 14:00",
    status: "pending",
  },
  {
    id: 3,
    title: "Retorno agendado",
    patient: "Ana Costa",
    time: "Amanhã, 10:00",
    status: "scheduled",
  },
  {
    id: 4,
    title: "Questionário pendente",
    patient: "Carlos Oliveira",
    time: "Há 2 dias",
    status: "overdue",
  },
]

const statusConfig = {
  completed: { icon: CheckCircle2, color: "text-success", bg: "bg-success/7" },
  pending:   { icon: Clock,         color: "text-warning", bg: "bg-warning/7" },
  scheduled: { icon: Clock,         color: "text-primary", bg: "bg-primary/7" },
  overdue:   { icon: AlertCircle,   color: "text-coral", bg: "bg-coral/7" },
}

const delayClass = ["delay-100", "delay-200", "delay-300", "delay-400"]

export function RemindersWidget() {
  return (
    <Card className="border-border/80 hover:border-primary/25 hover:shadow-[0_4px_24px_rgba(94,75,139,0.07)] transition-all duration-200">
      <CardHeader className="pb-1 pt-5 px-5">
        <CardTitle className="text-[0.9375rem] font-semibold text-navy">Lembretes</CardTitle>
      </CardHeader>
      <CardContent className="px-3 pt-1 pb-3">
        <div className="space-y-1">
          {reminders.map((r, i) => {
            const cfg = statusConfig[r.status as keyof typeof statusConfig]
            const Icon = cfg.icon
            return (
              <div
                key={r.id}
                className={`flex items-start gap-3 px-3 py-2.5 rounded-xl ${cfg.bg} hover:brightness-[0.97] transition-all cursor-pointer animate-fade-left ${delayClass[i]}`}
              >
                <div className="flex-shrink-0 mt-0.5">
                  <Icon size={17} className={cfg.color} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">{r.title}</p>
                  <p className="text-xs text-muted-foreground">{r.patient} · {r.time}</p>
                </div>
              </div>
            )
          })}
        </div>
        <Button
          variant="ghost"
          className="w-full text-primary hover:text-purple-dark hover:bg-secondary mt-1 text-xs h-8"
        >
          Ver todos os lembretes
        </Button>
      </CardContent>
    </Card>
  )
}
