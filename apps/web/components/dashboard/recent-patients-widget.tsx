"use client"

import { motion } from "framer-motion"
import MuiCard from "@mui/material/Card"
import MuiCardContent from "@mui/material/CardContent"
import MuiCardHeader from "@mui/material/CardHeader"
import MuiAvatar from "@mui/material/Avatar"
import MuiList from "@mui/material/List"
import MuiListItem from "@mui/material/ListItem"
import MuiListItemAvatar from "@mui/material/ListItemAvatar"
import MuiListItemText from "@mui/material/ListItemText"
import MuiIconButton from "@mui/material/IconButton"
import MuiTooltip from "@mui/material/Tooltip"
import { Button } from "@/components/ui/button"
import { Calendar, MessageSquare, MoreHorizontal } from "lucide-react"

const recentPatients = [
  {
    id: 1,
    name: "Maria Santos",
    initials: "MS",
    lastVisit: "Hoje, 09:00",
    nextVisit: "28/06/2026",
    status: "Em acompanhamento",
    statusColor: "#10B981",
  },
  {
    id: 2,
    name: "João Silva",
    initials: "JS",
    lastVisit: "Ontem, 14:30",
    nextVisit: "05/06/2026",
    status: "Novo paciente",
    statusColor: "#14B8A6",
  },
  {
    id: 3,
    name: "Ana Costa",
    initials: "AC",
    lastVisit: "25/05/2026",
    nextVisit: "Amanhã",
    status: "Em acompanhamento",
    statusColor: "#10B981",
  },
  {
    id: 4,
    name: "Carlos Oliveira",
    initials: "CO",
    lastVisit: "20/05/2026",
    nextVisit: "01/06/2026",
    status: "Atenção",
    statusColor: "#F59E0B",
  },
]

export function RecentPatientsWidget() {
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
        title="Pacientes Recentes"
        titleTypographyProps={{
          fontSize: "0.9375rem",
          fontWeight: 600,
          color: "#0F2137",
        }}
        action={
          <Button
            variant="ghost"
            size="sm"
            className="text-[#14B8A6] hover:text-[#0D9488] text-xs"
          >
            Ver todos
          </Button>
        }
        sx={{ pb: 0.5, pt: 2, px: 2.5 }}
      />
      <MuiCardContent sx={{ px: 1, pt: 0.5, pb: "12px !important" }}>
        <MuiList disablePadding>
          {recentPatients.map((patient, i) => (
            <motion.div
              key={patient.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.06, duration: 0.25, ease: "easeOut" }}
            >
              <MuiListItem
                alignItems="center"
                sx={{
                  px: 1.5,
                  py: 1,
                  borderRadius: 2,
                  mx: 0.5,
                  mb: 0.25,
                  cursor: "pointer",
                  "&:hover": { bgcolor: "rgba(20,184,166,0.04)" },
                  "&:hover .actions": { opacity: 1 },
                  transition: "background 0.18s ease",
                }}
              >
                <MuiListItemAvatar sx={{ minWidth: 48 }}>
                  <MuiAvatar
                    sx={{
                      width: 40,
                      height: 40,
                      bgcolor: "#F0F9F8",
                      color: "#14B8A6",
                      fontSize: "0.8rem",
                      fontWeight: 600,
                      border: "2px solid rgba(20,184,166,0.18)",
                    }}
                  >
                    {patient.initials}
                  </MuiAvatar>
                </MuiListItemAvatar>

                <MuiListItemText
                  primary={
                    <span className="flex items-center gap-1.5">
                      <span className="text-sm font-medium text-[#0F2137]">
                        {patient.name}
                      </span>
                      <span
                        className="h-2 w-2 rounded-full flex-shrink-0"
                        style={{ backgroundColor: patient.statusColor }}
                      />
                    </span>
                  }
                  secondary={
                    <span className="flex gap-3 mt-0.5">
                      <span className="text-xs text-muted-foreground">
                        Última: {patient.lastVisit}
                      </span>
                      <span className="text-xs text-[#14B8A6] font-medium">
                        Próxima: {patient.nextVisit}
                      </span>
                    </span>
                  }
                />

                <div className="actions flex items-center gap-0.5 opacity-0 transition-opacity duration-150">
                  <MuiTooltip title="Agendar" placement="top">
                    <MuiIconButton size="small" sx={{ color: "#94a3b8", "&:hover": { color: "#14B8A6" } }}>
                      <Calendar size={15} />
                    </MuiIconButton>
                  </MuiTooltip>
                  <MuiTooltip title="Mensagem" placement="top">
                    <MuiIconButton size="small" sx={{ color: "#94a3b8", "&:hover": { color: "#14B8A6" } }}>
                      <MessageSquare size={15} />
                    </MuiIconButton>
                  </MuiTooltip>
                  <MuiTooltip title="Mais opções" placement="top">
                    <MuiIconButton size="small" sx={{ color: "#94a3b8", "&:hover": { color: "#0F2137" } }}>
                      <MoreHorizontal size={15} />
                    </MuiIconButton>
                  </MuiTooltip>
                </div>
              </MuiListItem>
            </motion.div>
          ))}
        </MuiList>
      </MuiCardContent>
    </MuiCard>
  )
}
