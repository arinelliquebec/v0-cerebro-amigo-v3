"use client"

import { motion } from "framer-motion"
import MuiCard from "@mui/material/Card"
import MuiCardContent from "@mui/material/CardContent"
import MuiCardHeader from "@mui/material/CardHeader"
import MuiList from "@mui/material/List"
import MuiListItem from "@mui/material/ListItem"
import MuiListItemIcon from "@mui/material/ListItemIcon"
import MuiListItemText from "@mui/material/ListItemText"
import { Button } from "@/components/ui/button"
import { CheckCircle2, Clock, AlertCircle } from "lucide-react"

const reminders = [
  {
    id: 1,
    title: "Check-in de humor enviado",
    patient: "Maria Santos",
    time: "Hoje, 09:00",
    status: "completed",
  },
  {
    id: 2,
    title: "Lembrete de medicação",
    patient: "João Silva",
    time: "Hoje, 14:00",
    status: "pending",
  },
  {
    id: 3,
    title: "Retorno agendado",
    patient: "Ana Costa",
    time: "Amanhã, 10:00",
    status: "scheduled",
  },
  {
    id: 4,
    title: "Questionário pendente",
    patient: "Carlos Oliveira",
    time: "Há 2 dias",
    status: "overdue",
  },
]

const statusConfig = {
  completed: { icon: CheckCircle2, color: "#10B981", bg: "rgba(16,185,129,0.07)" },
  pending:   { icon: Clock,         color: "#F59E0B", bg: "rgba(245,158,11,0.07)" },
  scheduled: { icon: Clock,         color: "#14B8A6", bg: "rgba(20,184,166,0.07)" },
  overdue:   { icon: AlertCircle,   color: "#E57373", bg: "rgba(229,115,115,0.07)" },
}

export function RemindersWidget() {
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
        title="Lembretes"
        titleTypographyProps={{ fontSize: "0.9375rem", fontWeight: 600, color: "#0F2137" }}
        sx={{ pb: 0.5, pt: 2, px: 2.5 }}
      />
      <MuiCardContent sx={{ px: 1.5, pt: 0.5, pb: "12px !important" }}>
        <MuiList disablePadding>
          {reminders.map((r, i) => {
            const cfg = statusConfig[r.status as keyof typeof statusConfig]
            const Icon = cfg.icon
            return (
              <motion.div
                key={r.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.07, duration: 0.26, ease: "easeOut" }}
              >
                <MuiListItem
                  sx={{
                    px: 1.5,
                    py: 1,
                    mb: 0.5,
                    borderRadius: 2.5,
                    bgcolor: cfg.bg,
                    alignItems: "flex-start",
                    gap: 1,
                    transition: "background 0.18s",
                    "&:hover": { filter: "brightness(0.97)" },
                  }}
                >
                  <MuiListItemIcon sx={{ minWidth: 32, mt: 0.25 }}>
                    <Icon size={17} style={{ color: cfg.color }} />
                  </MuiListItemIcon>
                  <MuiListItemText
                    primary={r.title}
                    secondary={`${r.patient} · ${r.time}`}
                  />
                </MuiListItem>
              </motion.div>
            )
          })}
        </MuiList>
        <Button
          variant="ghost"
          className="w-full text-[#14B8A6] hover:text-[#0D9488] hover:bg-[#F0F9F8] mt-1 text-xs h-8"
        >
          Ver todos os lembretes
        </Button>
      </MuiCardContent>
    </MuiCard>
  )
}
