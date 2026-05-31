"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Users, Calendar, MessageSquare, Heart } from "lucide-react"

const stats = [
  {
    title: "Total de Pacientes",
    value: "248",
    change: "+12%",
    changeType: "positive" as const,
    icon: Users,
  },
  {
    title: "Consultas Hoje",
    value: "8",
    subtitle: "3 confirmadas",
    icon: Calendar,
  },
  {
    title: "Mensagens Pendentes",
    value: "5",
    change: "2 urgentes",
    changeType: "warning" as const,
    icon: MessageSquare,
  },
  {
    title: "Check-ins Recebidos",
    value: "23",
    change: "+18%",
    changeType: "positive" as const,
    icon: Heart,
  },
]

const delayClass = ["delay-100", "delay-200", "delay-300", "delay-400"]

export function StatsCards() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat, i) => (
        <div
          key={stat.title}
          className={`animate-fade-up ${delayClass[i]}`}
        >
          <Card className="h-full border-border/80 hover:border-primary/35 hover:shadow-[0_0_0_1px_rgba(94,75,139,0.12),0_6px_28px_rgba(94,75,139,0.09)] hover:-translate-y-0.5 transition-all duration-200">
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-4">
                <p className="text-sm font-medium text-muted-foreground leading-tight">
                  {stat.title}
                </p>
                <div className="h-10 w-10 rounded-xl bg-secondary flex items-center justify-center flex-shrink-0 ml-2">
                  <stat.icon className="h-5 w-5 text-primary" />
                </div>
              </div>
              <p className="text-3xl font-bold text-navy leading-none mb-2">
                {stat.value}
              </p>
              {stat.change && (
                <p
                  className={`text-xs font-medium ${
                    stat.changeType === "positive"
                      ? "text-success"
                      : stat.changeType === "warning"
                      ? "text-warning"
                      : "text-muted-foreground"
                  }`}
                >
                  {stat.changeType === "positive" && "↑ "}
                  {stat.change}
                  {stat.changeType === "positive" && " desde o mês passado"}
                </p>
              )}
              {stat.subtitle && (
                <p className="text-xs text-muted-foreground">{stat.subtitle}</p>
              )}
            </CardContent>
          </Card>
        </div>
      ))}
    </div>
  )
}
