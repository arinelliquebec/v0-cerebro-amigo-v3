"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import MuiCard from "@mui/material/Card"
import MuiCardContent from "@mui/material/CardContent"
import MuiCardHeader from "@mui/material/CardHeader"
import MuiChip from "@mui/material/Chip"
import MuiIconButton from "@mui/material/IconButton"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"

const appointments = [
  { id: 1, time: "09:00", patient: "Maria Santos", type: "Retorno", status: "confirmed" },
  { id: 2, time: "10:30", patient: "João Silva", type: "Primeira Consulta", status: "confirmed" },
  { id: 3, time: "14:00", patient: "Ana Costa", type: "Retorno", status: "pending" },
  { id: 4, time: "15:30", patient: "Carlos Oliveira", type: "Urgência", status: "confirmed" },
  { id: 5, time: "17:00", patient: "Lucia Ferreira", type: "Retorno", status: "pending" },
]

const weekDays = ["D", "S", "T", "Q", "Q", "S", "S"]

const typeColor: Record<string, string> = {
  "Retorno": "#14B8A6",
  "Primeira Consulta": "#0F2137",
  "Urgência": "#E57373",
}

export function AgendaWidget() {
  const [currentDate] = useState(new Date())
  const today = currentDate.getDate()

  const getDaysInMonth = () => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    const firstDay = new Date(year, month, 1).getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const days: (number | null)[] = []
    for (let i = 0; i < firstDay; i++) days.push(null)
    for (let i = 1; i <= daysInMonth; i++) days.push(i)
    return days
  }

  const days = getDaysInMonth()

  return (
    <MuiCard
      elevation={0}
      sx={{
        border: "1px solid rgba(226,232,240,0.8)",
        borderRadius: 3,
        transition: "all 0.22s ease",
        "&:hover": {
          borderColor: "rgba(20,184,166,0.25)",
          boxShadow: "0 4px 24px rgba(20,184,166,0.07)",
        },
      }}
    >
      <MuiCardHeader
        title="Agenda"
        titleTypographyProps={{ fontSize: "0.9375rem", fontWeight: 600, color: "#0F2137" }}
        action={
          <div className="flex items-center gap-0.5">
            <MuiIconButton size="small" sx={{ color: "#64748B" }}>
              <ChevronLeft size={16} />
            </MuiIconButton>
            <span className="text-xs font-medium text-muted-foreground px-1">
              {currentDate.toLocaleDateString("pt-BR", { month: "short", year: "numeric" })}
            </span>
            <MuiIconButton size="small" sx={{ color: "#64748B" }}>
              <ChevronRight size={16} />
            </MuiIconButton>
          </div>
        }
        sx={{ pb: 0, pt: 2, px: 2.5 }}
      />
      <MuiCardContent sx={{ px: 2.5, pt: 1.5, pb: "16px !important" }}>
        {/* Mini calendar */}
        <div className="grid grid-cols-7 gap-0.5 text-center mb-1">
          {weekDays.map((d, i) => (
            <div key={i} className="text-[10px] font-semibold text-muted-foreground py-1 uppercase tracking-wide">
              {d}
            </div>
          ))}
          {days.map((day, i) => (
            <button
              key={i}
              disabled={day === null}
              className={`text-xs py-1.5 rounded-lg font-medium transition-colors ${
                day === null
                  ? "cursor-default"
                  : day === today
                  ? "bg-[#14B8A6] text-white shadow-sm"
                  : "hover:bg-[#F0F9F8] text-foreground hover:text-[#14B8A6]"
              }`}
            >
              {day}
            </button>
          ))}
        </div>

        {/* Appointments */}
        <div className="pt-3 border-t border-border/50 space-y-2">
          <p className="text-xs font-semibold text-[#0F2137] mb-2">Consultas de Hoje</p>
          <div className="space-y-1.5 max-h-[180px] overflow-y-auto">
            {appointments.slice(0, 3).map((apt, i) => (
              <motion.div
                key={apt.id}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.07, duration: 0.24 }}
                className="flex items-center gap-3 p-2.5 rounded-xl bg-muted/40 hover:bg-[#F0F9F8] transition-colors cursor-pointer"
              >
                <span
                  className="text-sm font-bold tabular-nums w-12 flex-shrink-0"
                  style={{ color: typeColor[apt.type] ?? "#14B8A6" }}
                >
                  {apt.time}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#0F2137] truncate">{apt.patient}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <MuiChip
                      label={apt.type}
                      size="small"
                      sx={{
                        height: 16,
                        fontSize: "0.6rem",
                        fontWeight: 600,
                        bgcolor: `${typeColor[apt.type] ?? "#14B8A6"}14`,
                        color: typeColor[apt.type] ?? "#14B8A6",
                        border: "none",
                        "& .MuiChip-label": { px: 0.75 },
                      }}
                    />
                    <span
                      className="h-1.5 w-1.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: apt.status === "confirmed" ? "#10B981" : "#F59E0B" }}
                    />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
          <Button
            variant="ghost"
            className="w-full text-[#14B8A6] hover:text-[#0D9488] hover:bg-[#F0F9F8] mt-1 text-xs h-8"
          >
            Ver agenda completa
          </Button>
        </div>
      </MuiCardContent>
    </MuiCard>
  )
}
