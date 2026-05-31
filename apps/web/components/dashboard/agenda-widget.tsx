"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"

const appointments = [
  { id: 1, time: "09:00", patient: "Maria Santos", type: "Retorno", status: "confirmed" },
  { id: 2, time: "10:30", patient: "João Silva", type: "Primeira Consulta", status: "confirmed" },
  { id: 3, time: "14:00", patient: "Ana Costa", type: "Retorno", status: "pending" },
  { id: 4, time: "15:30", patient: "Carlos Oliveira", type: "Urgência", status: "confirmed" },
  { id: 5, time: "17:00", patient: "Lucia Ferreira", type: "Retorno", status: "pending" },
]

const weekDays = ["D", "S", "T", "Q", "Q", "S", "S"]

const typeColor: Record<string, string> = {
  "Retorno": "text-primary",
  "Primeira Consulta": "text-navy",
  "Urgência": "text-coral",
}

const typeBg: Record<string, string> = {
  "Retorno": "bg-primary/10",
  "Primeira Consulta": "bg-navy/10",
  "Urgência": "bg-coral/10",
}

const delayClass = ["delay-100", "delay-200", "delay-300"]

export function AgendaWidget() {
  const [currentDate] = useState(new Date())
  const today = currentDate.getDate()

  const getDaysInMonth = () => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    const firstDay = new Date(year, month, 1).getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const days: (number | null)[] = []
    for (let i = 0; i < firstDay; i++) days.push(null)
    for (let i = 1; i <= daysInMonth; i++) days.push(i)
    return days
  }

  const days = getDaysInMonth()

  return (
    <Card className="border-border/80 hover:border-primary/25 hover:shadow-[0_4px_24px_rgba(94,75,139,0.07)] transition-all duration-200">
      <CardHeader className="pb-2 pt-5 px-5">
        <div className="flex items-center justify-between">
          <CardTitle className="text-[0.9375rem] font-semibold text-navy">Agenda</CardTitle>
          <div className="flex items-center gap-0.5">
            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground">
              <ChevronLeft size={16} />
            </Button>
            <span className="text-xs font-medium text-muted-foreground px-1">
              {currentDate.toLocaleDateString("pt-BR", { month: "short", year: "numeric" })}
            </span>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground">
              <ChevronRight size={16} />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-5 pt-1.5 pb-4">
        {/* Mini calendar */}
        <div className="grid grid-cols-7 gap-0.5 text-center mb-1">
          {weekDays.map((d, i) => (
            <div key={i} className="text-[10px] font-semibold text-muted-foreground py-1 uppercase tracking-wide">
              {d}
            </div>
          ))}
          {days.map((day, i) => (
            <button
              key={i}
              disabled={day === null}
              className={`text-xs py-1.5 rounded-lg font-medium transition-colors ${
                day === null
                  ? "cursor-default"
                  : day === today
                  ? "bg-primary text-white shadow-sm"
                  : "hover:bg-secondary text-foreground hover:text-primary"
              }`}
            >
              {day}
            </button>
          ))}
        </div>

        {/* Appointments */}
        <div className="pt-3 border-t border-border/50 space-y-2">
          <p className="text-xs font-semibold text-navy mb-2">Consultas de Hoje</p>
          <div className="space-y-1.5 max-h-[180px] overflow-y-auto">
            {appointments.slice(0, 3).map((apt, i) => (
              <div
                key={apt.id}
                className={`flex items-center gap-3 p-2.5 rounded-xl bg-muted/40 hover:bg-secondary transition-colors cursor-pointer animate-fade-left ${delayClass[i]}`}
              >
                <span
                  className={`text-sm font-bold tabular-nums w-12 flex-shrink-0 ${typeColor[apt.type] ?? "text-primary"}`}
                >
                  {apt.time}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-navy truncate">{apt.patient}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <Badge
                      variant="secondary"
                      className={`text-[0.6rem] h-4 px-1.5 font-semibold border-0 ${typeBg[apt.type] ?? "bg-primary/10"} ${typeColor[apt.type] ?? "text-primary"}`}
                    >
                      {apt.type}
                    </Badge>
                    <span
                      className={`h-1.5 w-1.5 rounded-full flex-shrink-0 ${
                        apt.status === "confirmed" ? "bg-success" : "bg-warning"
                      }`}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
          <Button
            variant="ghost"
            className="w-full text-primary hover:text-purple-dark hover:bg-secondary mt-1 text-xs h-8"
          >
            Ver agenda completa
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
