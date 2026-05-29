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
  completed: {
    icon: CheckCircle2,
    color: "text-[#10B981]",
    bg: "bg-green-50",
  },
  pending: {
    icon: Clock,
    color: "text-[#F59E0B]",
    bg: "bg-amber-50",
  },
  scheduled: {
    icon: Clock,
    color: "text-[#0D9488]",
    bg: "bg-[#F0F9F8]",
  },
  overdue: {
    icon: AlertCircle,
    color: "text-[#E57373]",
    bg: "bg-red-50",
  },
}

export function RemindersWidget() {
  return (
    <Card className="border-border/50 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold text-[#0F2137]">Lembretes</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {reminders.map((reminder) => {
          const config = statusConfig[reminder.status as keyof typeof statusConfig]
          const Icon = config.icon
          return (
            <div
              key={reminder.id}
              className={`flex items-start gap-3 p-3 rounded-lg ${config.bg} transition-colors`}
            >
              <Icon className={`h-5 w-5 mt-0.5 ${config.color}`} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">{reminder.title}</p>
                <p className="text-xs text-muted-foreground">{reminder.patient}</p>
                <p className="text-xs text-muted-foreground mt-1">{reminder.time}</p>
              </div>
            </div>
          )
        })}
        <Button variant="ghost" className="w-full text-[#0D9488] hover:text-[#0F766E] hover:bg-[#F0F9F8]">
          Ver todos os lembretes
        </Button>
      </CardContent>
    </Card>
  )
}
