"use client"

import { motion } from "framer-motion"
import MuiCard from "@mui/material/Card"
import MuiCardContent from "@mui/material/CardContent"
import MuiCardHeader from "@mui/material/CardHeader"
import MuiLinearProgress from "@mui/material/LinearProgress"
import { Smile, Meh, Frown } from "lucide-react"

const moods = [
  { icon: Smile, label: "Muito bem", count: 12, total: 23, color: "#10B981" },
  { icon: Smile, label: "Bem",       count: 8,  total: 23, color: "#14B8A6" },
  { icon: Meh,   label: "Neutro",    count: 2,  total: 23, color: "#F59E0B" },
  { icon: Frown, label: "Mal",       count: 1,  total: 23, color: "#E57373" },
]

const recentCheckins = [
  { id: 1, patient: "Maria Santos", mood: "Muito bem", moodIcon: Smile, moodColor: "#10B981", time: "Há 30 min" },
  { id: 2, patient: "João Silva",   mood: "Bem",       moodIcon: Smile, moodColor: "#14B8A6", time: "Há 2 horas" },
  { id: 3, patient: "Ana Costa",    mood: "Neutro",    moodIcon: Meh,   moodColor: "#F59E0B", time: "Há 3 horas" },
]

export function CheckinWidget() {
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
        title="Check-in de Hoje"
        subheader="23 respostas recebidas"
        titleTypographyProps={{ fontSize: "0.9375rem", fontWeight: 600, color: "#0F2137" }}
        subheaderTypographyProps={{ fontSize: "0.75rem", color: "#94a3b8", mt: 0.25 }}
        sx={{ pb: 0.5, pt: 2, px: 2.5 }}
      />
      <MuiCardContent sx={{ px: 2.5, pt: 1, pb: "16px !important" }}>
        {/* Mood distribution bars */}
        <div className="space-y-2.5 mb-4">
          {moods.map((mood, i) => (
            <motion.div
              key={mood.label}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 0.06 }}
              className="flex items-center gap-3"
            >
              <div
                className="h-7 w-7 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: `${mood.color}14` }}
              >
                <mood.icon size={14} style={{ color: mood.color }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between mb-1">
                  <span className="text-xs text-muted-foreground">{mood.label}</span>
                  <span className="text-xs font-semibold" style={{ color: mood.color }}>
                    {mood.count}
                  </span>
                </div>
                <MuiLinearProgress
                  variant="determinate"
                  value={(mood.count / mood.total) * 100}
                  sx={{
                    height: 5,
                    borderRadius: 3,
                    bgcolor: `${mood.color}14`,
                    "& .MuiLinearProgress-bar": {
                      bgcolor: mood.color,
                      borderRadius: 3,
                    },
                  }}
                />
              </div>
            </motion.div>
          ))}
        </div>

        {/* Recent check-ins */}
        <div className="pt-3 border-t border-border/50">
          <p className="text-xs font-semibold text-[#0F2137] mb-2">Recentes</p>
          <div className="space-y-1.5">
            {recentCheckins.map((c, i) => (
              <motion.div
                key={c.id}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.07, duration: 0.22 }}
                className="flex items-center gap-3 p-2 rounded-xl hover:bg-muted/40 transition-colors cursor-pointer"
              >
                <div
                  className="h-7 w-7 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: `${c.moodColor}14` }}
                >
                  <c.moodIcon size={13} style={{ color: c.moodColor }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-[#0F2137] truncate">{c.patient}</p>
                  <p className="text-[11px] text-muted-foreground">{c.mood}</p>
                </div>
                <span className="text-[11px] text-muted-foreground flex-shrink-0">{c.time}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </MuiCardContent>
    </MuiCard>
  )
}
