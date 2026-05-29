"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Smile, Meh, Frown, Heart, AlertCircle } from "lucide-react"

const moods = [
  { icon: Smile, label: "Muito bem", count: 12, color: "#10B981" },
  { icon: Smile, label: "Bem", count: 8, color: "#14B8A6" },
  { icon: Meh, label: "Neutro", count: 2, color: "#F59E0B" },
  { icon: Frown, label: "Mal", count: 1, color: "#E57373" },
]

const recentCheckins = [
  {
    id: 1,
    patient: "Maria Santos",
    mood: "Muito bem",
    moodIcon: Smile,
    moodColor: "#10B981",
    time: "Há 30 min",
  },
  {
    id: 2,
    patient: "João Silva",
    mood: "Bem",
    moodIcon: Smile,
    moodColor: "#14B8A6",
    time: "Há 2 horas",
  },
  {
    id: 3,
    patient: "Ana Costa",
    mood: "Neutro",
    moodIcon: Meh,
    moodColor: "#F59E0B",
    time: "Há 3 horas",
  },
]

export function CheckinWidget() {
  return (
    <Card className="border-border/50 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold text-[#0F2137]">
          Check-in de Hoje
        </CardTitle>
        <p className="text-sm text-muted-foreground">Como você está se sentindo?</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Mood Summary */}
        <div className="flex items-center justify-around py-2">
          {moods.map((mood) => (
            <div key={mood.label} className="flex flex-col items-center gap-1">
              <div
                className="h-10 w-10 rounded-full flex items-center justify-center"
                style={{ backgroundColor: `${mood.color}15` }}
              >
                <mood.icon className="h-5 w-5" style={{ color: mood.color }} />
              </div>
              <span className="text-xs font-medium text-foreground">{mood.count}</span>
            </div>
          ))}
        </div>

        {/* Recent Check-ins */}
        <div className="space-y-2 pt-2 border-t border-border">
          <h4 className="text-sm font-medium text-muted-foreground">Recentes</h4>
          {recentCheckins.map((checkin) => (
            <div
              key={checkin.id}
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
            >
              <div
                className="h-8 w-8 rounded-full flex items-center justify-center"
                style={{ backgroundColor: `${checkin.moodColor}15` }}
              >
                <checkin.moodIcon
                  className="h-4 w-4"
                  style={{ color: checkin.moodColor }}
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {checkin.patient}
                </p>
                <p className="text-xs text-muted-foreground">{checkin.mood}</p>
              </div>
              <span className="text-xs text-muted-foreground flex-shrink-0">
                {checkin.time}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
