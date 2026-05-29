"use client"

import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  User,
  Video,
  MapPin,
} from "lucide-react"
import { useState } from "react"

const appointments = [
  {
    id: 1,
    time: "08:00",
    endTime: "09:00",
    patient: "Fernanda Lima",
    initials: "FL",
    type: "Primeira Consulta",
    typeColor: "bg-[#14B8A6]",
    modality: "Presencial",
    status: "confirmed",
  },
  {
    id: 2,
    time: "09:00",
    endTime: "10:00",
    patient: "Maria Santos",
    initials: "MS",
    type: "Retorno",
    typeColor: "bg-[#14B8A6]",
    modality: "Presencial",
    status: "confirmed",
  },
  {
    id: 3,
    time: "10:30",
    endTime: "11:30",
    patient: "João Silva",
    initials: "JS",
    type: "Retorno",
    typeColor: "bg-[#14B8A6]",
    modality: "Online",
    status: "confirmed",
  },
  {
    id: 4,
    time: "14:00",
    endTime: "15:00",
    patient: "Ana Costa",
    initials: "AC",
    type: "Retorno",
    typeColor: "bg-[#14B8A6]",
    modality: "Presencial",
    status: "pending",
  },
  {
    id: 5,
    time: "15:30",
    endTime: "16:30",
    patient: "Carlos Oliveira",
    initials: "CO",
    type: "Urgência",
    typeColor: "bg-[#E57373]",
    modality: "Presencial",
    status: "confirmed",
  },
  {
    id: 6,
    time: "17:00",
    endTime: "18:00",
    patient: "Lucia Ferreira",
    initials: "LF",
    type: "Retorno",
    typeColor: "bg-[#14B8A6]",
    modality: "Online",
    status: "pending",
  },
]

const weekDays = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"]
const timeSlots = ["08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00"]

export default function AgendaPage() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState(new Date())

  const getWeekDays = () => {
    const start = new Date(currentDate)
    start.setDate(start.getDate() - start.getDay())
    
    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date(start)
      date.setDate(start.getDate() + i)
      return date
    })
  }

  const weekDates = getWeekDays()
  const today = new Date()

  const nextWeek = () => {
    const next = new Date(currentDate)
    next.setDate(next.getDate() + 7)
    setCurrentDate(next)
  }

  const prevWeek = () => {
    const prev = new Date(currentDate)
    prev.setDate(prev.getDate() - 7)
    setCurrentDate(prev)
  }

  return (
    <div className="min-h-screen">
      <Header title="Agenda" subtitle="Gerencie suas consultas" />

      <div className="p-6 space-y-6">
        {/* Week Navigation */}
        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-4">
              <Button variant="ghost" size="icon" onClick={prevWeek}>
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <h2 className="text-lg font-semibold text-[#0F2137]">
                {currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
              </h2>
              <Button variant="ghost" size="icon" onClick={nextWeek}>
                <ChevronRight className="h-5 w-5" />
              </Button>
            </div>

            <div className="grid grid-cols-7 gap-2">
              {weekDates.map((date, i) => {
                const isToday = date.toDateString() === today.toDateString()
                const isSelected = date.toDateString() === selectedDate.toDateString()
                
                return (
                  <button
                    key={i}
                    onClick={() => setSelectedDate(date)}
                    className={`flex flex-col items-center p-3 rounded-xl transition-all ${
                      isSelected
                        ? "bg-[#14B8A6] text-white"
                        : isToday
                        ? "bg-[#F0F9F8] text-[#14B8A6]"
                        : "hover:bg-muted"
                    }`}
                  >
                    <span className={`text-xs font-medium ${isSelected ? "text-white/80" : "text-muted-foreground"}`}>
                      {weekDays[i]}
                    </span>
                    <span className={`text-lg font-semibold mt-1 ${isSelected ? "text-white" : "text-foreground"}`}>
                      {date.getDate()}
                    </span>
                    {/* Appointment indicator */}
                    {i === 3 && (
                      <div className={`flex gap-0.5 mt-1 ${isSelected ? "opacity-80" : ""}`}>
                        <span className="h-1.5 w-1.5 rounded-full bg-[#14B8A6]" />
                        <span className="h-1.5 w-1.5 rounded-full bg-[#14B8A6]" />
                        <span className="h-1.5 w-1.5 rounded-full bg-[#E57373]" />
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          </CardContent>
        </Card>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Day Schedule */}
          <div className="lg:col-span-2">
            <Card className="border-border/50">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-semibold text-[#0F2137]">
                    {selectedDate.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
                  </CardTitle>
                  <Button className="bg-[#14B8A6] hover:bg-[#0D9488] text-white gap-2" size="sm">
                    <Plus className="h-4 w-4" />
                    Nova Consulta
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-border">
                  {appointments.map((apt) => (
                    <div
                      key={apt.id}
                      className="flex items-stretch hover:bg-muted/50 transition-colors cursor-pointer"
                    >
                      {/* Time Column */}
                      <div className="w-20 flex-shrink-0 p-4 border-r border-border">
                        <p className="text-sm font-semibold text-[#14B8A6]">{apt.time}</p>
                        <p className="text-xs text-muted-foreground">{apt.endTime}</p>
                      </div>

                      {/* Appointment Details */}
                      <div className="flex-1 p-4">
                        <div className="flex items-start gap-3">
                          <Avatar className="h-10 w-10 border-2 border-[#14B8A6]/20">
                            <AvatarFallback className="bg-[#F0F9F8] text-[#14B8A6] text-sm font-medium">
                              {apt.initials}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="font-medium text-[#0F2137]">{apt.patient}</h4>
                              <Badge className={`${apt.typeColor} text-white text-xs`}>
                                {apt.type}
                              </Badge>
                              <span className={`h-2 w-2 rounded-full ${
                                apt.status === "confirmed" ? "bg-[#10B981]" : "bg-[#F59E0B]"
                              }`} />
                            </div>
                            <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                1 hora
                              </span>
                              <span className="flex items-center gap-1">
                                {apt.modality === "Online" ? (
                                  <>
                                    <Video className="h-3 w-3" />
                                    Online
                                  </>
                                ) : (
                                  <>
                                    <MapPin className="h-3 w-3" />
                                    Presencial
                                  </>
                                )}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Summary */}
          <div className="space-y-6">
            <Card className="border-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold text-[#0F2137]">
                  Resumo do Dia
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <span className="text-sm text-muted-foreground">Total de consultas</span>
                  <span className="text-lg font-bold text-[#0F2137]">{appointments.length}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-[#F0F9F8]">
                  <span className="text-sm text-[#14B8A6]">Confirmadas</span>
                  <span className="text-lg font-bold text-[#14B8A6]">
                    {appointments.filter(a => a.status === "confirmed").length}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-amber-50">
                  <span className="text-sm text-[#F59E0B]">Pendentes</span>
                  <span className="text-lg font-bold text-[#F59E0B]">
                    {appointments.filter(a => a.status === "pending").length}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold text-[#0F2137]">
                  Próxima Consulta
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-[#F0F9F8]">
                  <Avatar className="h-12 w-12 border-2 border-[#14B8A6]/30">
                    <AvatarFallback className="bg-[#14B8A6] text-white font-medium">
                      FL
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-[#0F2137]">Fernanda Lima</p>
                    <p className="text-sm text-[#14B8A6] font-semibold">08:00 - 09:00</p>
                    <p className="text-xs text-muted-foreground">Primeira Consulta</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
