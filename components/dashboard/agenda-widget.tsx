"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ChevronLeft, ChevronRight, Clock, User } from "lucide-react"
import { useState } from "react"

const appointments = [
  {
    id: 1,
    time: "09:00",
    patient: "Maria Santos",
    type: "Retorno",
    status: "confirmed",
  },
  {
    id: 2,
    time: "10:30",
    patient: "João Silva",
    type: "Primeira Consulta",
    status: "confirmed",
  },
  {
    id: 3,
    time: "14:00",
    patient: "Ana Costa",
    type: "Retorno",
    status: "pending",
  },
  {
    id: 4,
    time: "15:30",
    patient: "Carlos Oliveira",
    type: "Urgência",
    status: "confirmed",
  },
  {
    id: 5,
    time: "17:00",
    patient: "Lucia Ferreira",
    type: "Retorno",
    status: "pending",
  },
]

const weekDays = ["D", "S", "T", "Q", "Q", "S", "S"]

export function AgendaWidget() {
  const [currentDate] = useState(new Date())
  const today = currentDate.getDate()

  // Generate calendar days
  const getDaysInMonth = () => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    const firstDay = new Date(year, month, 1).getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    
    const days = []
    for (let i = 0; i < firstDay; i++) {
      days.push(null)
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i)
    }
    return days
  }

  const days = getDaysInMonth()

  return (
    <Card className="border-border/50 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold text-[#0F2137]">Agenda</CardTitle>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-7 w-7">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium text-muted-foreground px-2">
              {currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
            </span>
            <Button variant="ghost" size="icon" className="h-7 w-7">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Mini Calendar */}
        <div className="grid grid-cols-7 gap-1 text-center">
          {weekDays.map((day, i) => (
            <div key={i} className="text-xs font-medium text-muted-foreground py-1">
              {day}
            </div>
          ))}
          {days.map((day, i) => (
            <button
              key={i}
              className={`text-xs py-1.5 rounded-md transition-colors ${
                day === null
                  ? ""
                  : day === today
                  ? "bg-[#0D9488] text-white font-semibold"
                  : "hover:bg-muted text-foreground"
              }`}
              disabled={day === null}
            >
              {day}
            </button>
          ))}
        </div>

        {/* Today's Appointments */}
        <div className="space-y-3 pt-2 border-t border-border">
          <h4 className="text-sm font-medium text-[#0F2137]">Consultas de Hoje</h4>
          <div className="space-y-2 max-h-[200px] overflow-y-auto">
            {appointments.slice(0, 3).map((apt) => (
              <div
                key={apt.id}
                className="flex items-center gap-3 p-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
              >
                <div className="text-sm font-semibold text-[#0D9488] w-12">
                  {apt.time}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {apt.patient}
                  </p>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">{apt.type}</span>
                    <span className={`inline-block w-1.5 h-1.5 rounded-full ${
                      apt.status === "confirmed" ? "bg-[#10B981]" : "bg-[#F59E0B]"
                    }`} />
                  </div>
                </div>
              </div>
            ))}
          </div>
          <Button variant="ghost" className="w-full text-[#0D9488] hover:text-[#0F766E] hover:bg-[#F0F9F8]">
            Ver agenda completa
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
