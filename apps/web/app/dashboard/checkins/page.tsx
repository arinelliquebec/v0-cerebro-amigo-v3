"use client"

import { Header } from "@/components/header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import {
  Smile,
  Meh,
  Frown,
  TrendingUp,
  TrendingDown,
  Minus,
  Calendar,
  MessageSquare,
  Filter,
} from "lucide-react"

const checkins = [
  {
    id: 1,
    patient: "Maria Santos",
    initials: "MS",
    mood: "Muito bem",
    moodIcon: Smile,
    moodColor: "#10B981",
    time: "Há 30 min",
    date: "28/05/2026",
    trend: "up",
    note: "Dormi bem e acordei disposta!",
    weekProgress: [4, 4, 3, 4, 5, 5, 5],
  },
  {
    id: 2,
    patient: "João Silva",
    initials: "JS",
    mood: "Bem",
    moodIcon: Smile,
    moodColor: "#14B8A6",
    time: "Há 2 horas",
    date: "28/05/2026",
    trend: "stable",
    note: "Dia normal, sem grandes mudanças.",
    weekProgress: [3, 3, 4, 3, 4, 4, 4],
  },
  {
    id: 3,
    patient: "Ana Costa",
    initials: "AC",
    mood: "Neutro",
    moodIcon: Meh,
    moodColor: "#F59E0B",
    time: "Há 3 horas",
    date: "28/05/2026",
    trend: "down",
    note: "Senti um pouco de ansiedade pela manhã.",
    weekProgress: [4, 4, 3, 3, 2, 3, 3],
  },
  {
    id: 4,
    patient: "Carlos Oliveira",
    initials: "CO",
    mood: "Mal",
    moodIcon: Frown,
    moodColor: "#E57373",
    time: "Há 5 horas",
    date: "28/05/2026",
    trend: "down",
    note: "Noite de insônia, muito cansado.",
    weekProgress: [3, 2, 2, 2, 1, 2, 2],
  },
  {
    id: 5,
    patient: "Lucia Ferreira",
    initials: "LF",
    mood: "Muito bem",
    moodIcon: Smile,
    moodColor: "#10B981",
    time: "Ontem",
    date: "27/05/2026",
    trend: "up",
    note: "Consegui fazer exercícios!",
    weekProgress: [3, 3, 4, 4, 4, 5, 5],
  },
]

const moodSummary = [
  { label: "Muito bem", count: 12, color: "#10B981", icon: Smile },
  { label: "Bem", count: 8, color: "#14B8A6", icon: Smile },
  { label: "Neutro", count: 2, color: "#F59E0B", icon: Meh },
  { label: "Mal", count: 1, color: "#E57373", icon: Frown },
]

const getTrendIcon = (trend: string) => {
  switch (trend) {
    case "up":
      return <TrendingUp className="h-4 w-4 text-[#10B981]" />
    case "down":
      return <TrendingDown className="h-4 w-4 text-[#E57373]" />
    default:
      return <Minus className="h-4 w-4 text-[#F59E0B]" />
  }
}

const getMoodValue = (value: number) => {
  const colors = ["#E57373", "#F59E0B", "#F59E0B", "#14B8A6", "#10B981"]
  return colors[value - 1] || "#E2E8F0"
}

export default function CheckinsPage() {
  return (
    <div className="min-h-screen">
      <Header title="Check-ins de Humor" subtitle="Acompanhe como seus pacientes estão se sentindo" />

      <div className="p-6 space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {moodSummary.map((mood) => (
            <Card key={mood.label} className="border-border/50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{mood.label}</p>
                    <p className="text-2xl font-bold" style={{ color: mood.color }}>
                      {mood.count}
                    </p>
                  </div>
                  <div
                    className="h-12 w-12 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: `${mood.color}15` }}
                  >
                    <mood.icon className="h-6 w-6" style={{ color: mood.color }} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filters */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-[#0F2137]">Check-ins Recentes</h2>
          <Button variant="outline" className="gap-2">
            <Filter className="h-4 w-4" />
            Filtrar
          </Button>
        </div>

        {/* Check-ins List */}
        <div className="grid gap-4">
          {checkins.map((checkin) => (
            <Card key={checkin.id} className="border-border/50 hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  {/* Avatar and Basic Info */}
                  <Avatar className="h-12 w-12 border-2 border-[#0D9488]/20">
                    <AvatarFallback className="bg-[#F0F9F8] text-[#0D9488] font-medium">
                      {checkin.initials}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium text-[#0F2137]">{checkin.patient}</h3>
                      {getTrendIcon(checkin.trend)}
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <div
                        className="h-8 w-8 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: `${checkin.moodColor}15` }}
                      >
                        <checkin.moodIcon
                          className="h-4 w-4"
                          style={{ color: checkin.moodColor }}
                        />
                      </div>
                      <Badge
                        style={{
                          backgroundColor: `${checkin.moodColor}15`,
                          color: checkin.moodColor,
                        }}
                      >
                        {checkin.mood}
                      </Badge>
                      <span className="text-xs text-muted-foreground">{checkin.time}</span>
                    </div>
                    {checkin.note && (
                      <p className="text-sm text-muted-foreground italic mb-3">
                        &quot;{checkin.note}&quot;
                      </p>
                    )}

                    {/* Week Progress */}
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-muted-foreground mr-2">Semana:</span>
                      {checkin.weekProgress.map((value, i) => (
                        <div
                          key={i}
                          className="h-6 w-6 rounded flex items-center justify-center text-xs font-medium text-white"
                          style={{ backgroundColor: getMoodValue(value) }}
                        >
                          {value}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-[#0D9488]">
                      <MessageSquare className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-[#0D9488]">
                      <Calendar className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
