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

const moodClasses: Record<string, { text: string; bg: string; ring: string }> = {
  "Muito bem": { text: "text-success", bg: "bg-success", ring: "ring-success/20" },
  "Bem": { text: "text-primary", bg: "bg-primary", ring: "ring-primary/20" },
  "Neutro": { text: "text-warning", bg: "bg-warning", ring: "ring-warning/20" },
  "Mal": { text: "text-coral", bg: "bg-coral", ring: "ring-coral/20" },
}

const checkins = [
  {
    id: 1,
    patient: "Maria Santos",
    initials: "MS",
    mood: "Muito bem",
    moodIcon: Smile,
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
    time: "Ontem",
    date: "27/05/2026",
    trend: "up",
    note: "Consegui fazer exercícios!",
    weekProgress: [3, 3, 4, 4, 4, 5, 5],
  },
]

const moodSummary = [
  { label: "Muito bem", count: 12, mood: "Muito bem", icon: Smile },
  { label: "Bem", count: 8, mood: "Bem", icon: Smile },
  { label: "Neutro", count: 2, mood: "Neutro", icon: Meh },
  { label: "Mal", count: 1, mood: "Mal", icon: Frown },
]

const getTrendIcon = (trend: string) => {
  switch (trend) {
    case "up":
      return <TrendingUp className="h-4 w-4 text-success" />
    case "down":
      return <TrendingDown className="h-4 w-4 text-coral" />
    default:
      return <Minus className="h-4 w-4 text-warning" />
  }
}

const moodValueBg: Record<number, string> = {
  1: "bg-coral",
  2: "bg-warning",
  3: "bg-warning",
  4: "bg-primary",
  5: "bg-success",
}

const getMoodBg = (value: number) => moodValueBg[value] ?? "bg-muted"

export default function CheckinsPage() {
  return (
    <div className="min-h-screen">
      <Header title="Check-ins de Humor" subtitle="Acompanhe como seus pacientes estão se sentindo" />

      <div className="p-6 space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {moodSummary.map((mood) => {
            const cfg = moodClasses[mood.mood]
            return (
              <Card key={mood.label} className="border-border/50">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">{mood.label}</p>
                      <p className={`text-2xl font-bold ${cfg.text}`}>
                        {mood.count}
                      </p>
                    </div>
                    <div
                      className={`h-12 w-12 rounded-xl flex items-center justify-center ${cfg.bg}/10`}
                    >
                      <mood.icon className={`h-6 w-6 ${cfg.text}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Filters */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-navy">Check-ins Recentes</h2>
          <Button variant="outline" className="gap-2">
            <Filter className="h-4 w-4" />
            Filtrar
          </Button>
        </div>

        {/* Check-ins List */}
        <div className="grid gap-4">
          {checkins.map((checkin) => {
            const cfg = moodClasses[checkin.mood]
            return (
              <Card key={checkin.id} className="border-border/50 hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    {/* Avatar and Basic Info */}
                    <Avatar className="h-12 w-12 border-2 border-primary/20">
                      <AvatarFallback className="bg-secondary text-primary font-medium">
                        {checkin.initials}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium text-navy">{checkin.patient}</h3>
                        {getTrendIcon(checkin.trend)}
                      </div>
                      <div className="flex items-center gap-2 mb-2">
                        <div
                          className={`h-8 w-8 rounded-full flex items-center justify-center ${cfg.bg}/10`}
                        >
                          <checkin.moodIcon className={`h-4 w-4 ${cfg.text}`} />
                        </div>
                        <Badge
                          className={`${cfg.bg}/10 ${cfg.text} border-0`}
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
                            className={`h-6 w-6 rounded flex items-center justify-center text-xs font-medium text-white ${getMoodBg(value)}`}
                          >
                            {value}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary">
                        <MessageSquare className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary">
                        <Calendar className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </div>
  )
}
