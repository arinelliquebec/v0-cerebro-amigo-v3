"use client"

import dynamic from "next/dynamic"
import { Header } from "@/components/header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  TrendingUp,
  TrendingDown,
  Users,
  Calendar,
  Activity,
  Heart,
  Brain,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react"

const GrowthChart = dynamic(
  () => import("@/components/dashboard/growth-chart").then((m) => m.GrowthChart),
  { loading: () => <ChartSkeleton /> }
)

const MoodChart = dynamic(
  () => import("@/components/dashboard/mood-chart").then((m) => m.MoodChart),
  { loading: () => <ChartSkeleton /> }
)

function ChartSkeleton() {
  return <div className="h-[250px] animate-pulse bg-muted rounded-xl" />
}

const monthlyData = [
  { month: "Jan", pacientes: 180, checkins: 45, consultas: 120 },
  { month: "Fev", pacientes: 195, checkins: 52, consultas: 135 },
  { month: "Mar", pacientes: 210, checkins: 61, consultas: 145 },
  { month: "Abr", pacientes: 225, checkins: 58, consultas: 152 },
  { month: "Mai", pacientes: 235, checkins: 72, consultas: 160 },
  { month: "Jun", pacientes: 248, checkins: 68, consultas: 165 },
]

const weeklyMoodData = [
  { day: "Seg", muitoBem: 8, bem: 12, neutro: 3, mal: 1 },
  { day: "Ter", muitoBem: 10, bem: 10, neutro: 4, mal: 0 },
  { day: "Qua", muitoBem: 7, bem: 14, neutro: 2, mal: 2 },
  { day: "Qui", muitoBem: 12, bem: 8, neutro: 3, mal: 1 },
  { day: "Sex", muitoBem: 15, bem: 7, neutro: 1, mal: 1 },
  { day: "Sáb", muitoBem: 6, bem: 5, neutro: 2, mal: 0 },
  { day: "Dom", muitoBem: 4, bem: 4, neutro: 1, mal: 0 },
]

const patientProgress = [
  {
    id: 1,
    name: "Maria Santos",
    initials: "MS",
    diagnosis: "Ansiedade",
    improvement: 35,
    trend: "up",
    lastMonth: "Melhora significativa nos sintomas",
  },
  {
    id: 2,
    name: "João Silva",
    initials: "JS",
    diagnosis: "Depressão",
    improvement: 20,
    trend: "up",
    lastMonth: "Evolução positiva, mantendo tratamento",
  },
  {
    id: 3,
    name: "Ana Costa",
    initials: "AC",
    diagnosis: "TOC",
    improvement: -5,
    trend: "down",
    lastMonth: "Necessita reavaliação do tratamento",
  },
  {
    id: 4,
    name: "Carlos Oliveira",
    initials: "CO",
    diagnosis: "TDAH",
    improvement: 15,
    trend: "up",
    lastMonth: "Boa adesão ao tratamento",
  },
]

const stats = [
  {
    title: "Taxa de Adesão",
    value: "87%",
    change: "+5%",
    trend: "up",
    icon: Activity,
  },
  {
    title: "Média de Humor",
    value: "4.2",
    change: "+0.3",
    trend: "up",
    icon: Heart,
  },
  {
    title: "Pacientes Ativos",
    value: "248",
    change: "+12",
    trend: "up",
    icon: Users,
  },
  {
    title: "Consultas/Mês",
    value: "165",
    change: "+8%",
    trend: "up",
    icon: Calendar,
  },
]

export default function EvolucaoPage() {
  return (
    <div className="min-h-screen">
      <Header title="Evolução" subtitle="Acompanhe o progresso dos seus pacientes" />

      <div className="p-6 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((stat) => (
            <Card key={stat.title} className="border-border/50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="h-10 w-10 rounded-lg bg-secondary flex items-center justify-center">
                    <stat.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div className={`flex items-center gap-1 text-xs font-medium ${
                    stat.trend === "up" ? "text-success" : "text-coral"
                  }`}>
                    {stat.trend === "up" ? (
                      <ArrowUpRight className="h-3 w-3" />
                    ) : (
                      <ArrowDownRight className="h-3 w-3" />
                    )}
                    {stat.change}
                  </div>
                </div>
                <p className="text-2xl font-bold text-navy">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.title}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Growth Chart */}
          <Card className="border-border/50">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold text-navy">
                  Crescimento Mensal
                </CardTitle>
                <Select defaultValue="6m">
                  <SelectTrigger className="w-[100px] h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="3m">3 meses</SelectItem>
                    <SelectItem value="6m">6 meses</SelectItem>
                    <SelectItem value="1y">1 ano</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-[250px] w-full">
                <GrowthChart />
              </div>
              <div className="flex items-center justify-center gap-6 mt-2">
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-primary" />
                  <span className="text-xs text-muted-foreground">Pacientes</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-primary" />
                  <span className="text-xs text-muted-foreground">Consultas</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Mood Distribution */}
          <Card className="border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold text-navy">
                Distribuição de Humor (Semana)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[250px] w-full">
                <MoodChart />
              </div>
              <div className="flex items-center justify-center gap-4 mt-2 flex-wrap">
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-sm bg-success" />
                  <span className="text-xs text-muted-foreground">Muito bem</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-sm bg-primary" />
                  <span className="text-xs text-muted-foreground">Bem</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-sm bg-warning" />
                  <span className="text-xs text-muted-foreground">Neutro</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-sm bg-coral" />
                  <span className="text-xs text-muted-foreground">Mal</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Patient Progress */}
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold text-navy">
                Progresso dos Pacientes
              </CardTitle>
              <Button variant="ghost" className="text-primary hover:text-purple-dark">
                Ver todos
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {patientProgress.map((patient) => (
                <div
                  key={patient.id}
                  className="flex items-center gap-4 p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                >
                  <Avatar className="h-11 w-11 border-2 border-primary/20">
                    <AvatarFallback className="bg-secondary text-primary font-medium">
                      {patient.initials}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-navy">{patient.name}</h4>
                      <Badge variant="secondary" className="text-xs">
                        {patient.diagnosis}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground truncate">
                      {patient.lastMonth}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className={`flex items-center gap-1 px-3 py-1.5 rounded-full ${
                      patient.trend === "up" 
                        ? "bg-success/10 text-success" 
                        : "bg-coral/10 text-coral"
                    }`}>
                      {patient.trend === "up" ? (
                        <TrendingUp className="h-4 w-4" />
                      ) : (
                        <TrendingDown className="h-4 w-4" />
                      )}
                      <span className="text-sm font-semibold">
                        {patient.improvement > 0 ? "+" : ""}{patient.improvement}%
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
