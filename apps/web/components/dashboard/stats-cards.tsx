"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, Calendar, MessageSquare, TrendingUp, Clock, Heart } from "lucide-react"

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

export function StatsCards() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.title} className="border-border/50 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {stat.title}
            </CardTitle>
            <div className="h-9 w-9 rounded-lg bg-[#F0F9F8] flex items-center justify-center">
              <stat.icon className="h-5 w-5 text-[#0D9488]" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#0F2137]">{stat.value}</div>
            {stat.change && (
              <p
                className={`text-xs mt-1 ${
                  stat.changeType === "positive"
                    ? "text-[#10B981]"
                    : stat.changeType === "warning"
                    ? "text-[#F59E0B]"
                    : "text-muted-foreground"
                }`}
              >
                {stat.change}
                {stat.changeType === "positive" && " desde o mês passado"}
              </p>
            )}
            {stat.subtitle && (
              <p className="text-xs text-muted-foreground mt-1">{stat.subtitle}</p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
