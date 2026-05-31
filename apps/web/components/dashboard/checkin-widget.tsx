"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Smile, Meh, Frown } from "lucide-react"

const moods = [
  { icon: Smile, label: "Muito bem", count: 12, total: 23, color: "text-success" as const, bar: "bg-success" as const, bg: "bg-success/10" as const },
  { icon: Smile, label: "Bem",       count: 8,  total: 23, color: "text-primary" as const, bar: "bg-primary" as const, bg: "bg-primary/10" as const },
  { icon: Meh,   label: "Neutro",    count: 2,  total: 23, color: "text-warning" as const, bar: "bg-warning" as const, bg: "bg-warning/10" as const },
  { icon: Frown, label: "Mal",       count: 1,  total: 23, color: "text-coral" as const, bar: "bg-coral" as const, bg: "bg-coral/10" as const },
]

const recentCheckins = [
  { id: 1, patient: "Maria Santos", mood: "Muito bem", moodIcon: Smile, moodColor: "text-success", moodBg: "bg-success/10", time: "Há 30 min" },
  { id: 2, patient: "João Silva",   mood: "Bem",       moodIcon: Smile, moodColor: "text-primary", moodBg: "bg-primary/10", time: "Há 2 horas" },
  { id: 3, patient: "Ana Costa",    mood: "Neutro",    moodIcon: Meh,   moodColor: "text-warning", moodBg: "bg-warning/10", time: "Há 3 horas" },
]

const delayClass = ["delay-100", "delay-200", "delay-300", "delay-400"]

export function CheckinWidget() {
  return (
    <Card className="border-border/80 hover:border-primary/25 hover:shadow-[0_4px_24px_rgba(94,75,139,0.07)] transition-all duration-200">
      <CardHeader className="pb-1 pt-5 px-5">
        <CardTitle className="text-[0.9375rem] font-semibold text-navy">Check-in de Hoje</CardTitle>
        <p className="text-xs text-muted-foreground mt-0.5">23 respostas recebidas</p>
      </CardHeader>
      <CardContent className="px-5 pt-1 pb-4">
        {/* Mood distribution bars */}
        <div className="space-y-2.5 mb-4">
          {moods.map((mood, i) => (
            <div
              key={mood.label}
              className={`flex items-center gap-3 animate-fade-in ${delayClass[i]}`}
            >
              <div className={`h-7 w-7 rounded-lg flex items-center justify-center flex-shrink-0 ${mood.bg}`}>
                <mood.icon size={14} className={mood.color} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between mb-1">
                  <span className="text-xs text-muted-foreground">{mood.label}</span>
                  <span className={`text-xs font-semibold ${mood.color}`}>
                    {mood.count}
                  </span>
                </div>
                <Progress
                  value={(mood.count / mood.total) * 100}
                  className="h-[5px] [&>div]:rounded-full"
                />
              </div>
            </div>
          ))}
        </div>

        {/* Recent check-ins */}
        <div className="pt-3 border-t border-border/50">
          <p className="text-xs font-semibold text-navy mb-2">Recentes</p>
          <div className="space-y-1.5">
            {recentCheckins.map((c, i) => (
              <div
                key={c.id}
                className={`flex items-center gap-3 p-2 rounded-xl hover:bg-muted/40 transition-colors cursor-pointer animate-fade-left delay-${(i + 3) * 100}`}
              >
                <div className={`h-7 w-7 rounded-full flex items-center justify-center flex-shrink-0 ${c.moodBg}`}>
                  <c.moodIcon size={13} className={c.moodColor} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-navy truncate">{c.patient}</p>
                  <p className="text-[11px] text-muted-foreground">{c.mood}</p>
                </div>
                <span className="text-[11px] text-muted-foreground flex-shrink-0">{c.time}</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
