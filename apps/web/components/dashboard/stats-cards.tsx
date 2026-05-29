"use client"

import { motion } from "framer-motion"
import MuiCard from "@mui/material/Card"
import MuiCardContent from "@mui/material/CardContent"
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

export function StatsCards() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat, i) => (
        <motion.div
          key={stat.title}
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.09, duration: 0.32, ease: "easeOut" }}
        >
          <MuiCard
            elevation={0}
            sx={{
              height: "100%",
              border: "1px solid",
              borderColor: "rgba(226,232,240,0.8)",
              borderRadius: 3,
              transition: "all 0.22s ease",
              "&:hover": {
                borderColor: "rgba(20,184,166,0.35)",
                boxShadow:
                  "0 0 0 1px rgba(20,184,166,0.12), 0 6px 28px rgba(20,184,166,0.09)",
                transform: "translateY(-2px)",
              },
            }}
          >
            <MuiCardContent sx={{ p: "1.25rem !important" }}>
              <div className="flex items-start justify-between mb-4">
                <p className="text-sm font-medium text-muted-foreground leading-tight">
                  {stat.title}
                </p>
                <div className="h-10 w-10 rounded-xl bg-[#F0F9F8] flex items-center justify-center flex-shrink-0 ml-2">
                  <stat.icon className="h-5 w-5 text-[#14B8A6]" />
                </div>
              </div>
              <p className="text-3xl font-bold text-[#0F2137] leading-none mb-2">
                {stat.value}
              </p>
              {stat.change && (
                <p
                  className={`text-xs font-medium ${
                    stat.changeType === "positive"
                      ? "text-[#10B981]"
                      : stat.changeType === "warning"
                      ? "text-[#F59E0B]"
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
            </MuiCardContent>
          </MuiCard>
        </motion.div>
      ))}
    </div>
  )
}
