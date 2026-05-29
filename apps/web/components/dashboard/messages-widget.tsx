"use client"

import { motion } from "framer-motion"
import MuiCard from "@mui/material/Card"
import MuiCardContent from "@mui/material/CardContent"
import MuiCardHeader from "@mui/material/CardHeader"
import MuiList from "@mui/material/List"
import MuiListItem from "@mui/material/ListItem"
import MuiListItemAvatar from "@mui/material/ListItemAvatar"
import MuiListItemText from "@mui/material/ListItemText"
import MuiAvatar from "@mui/material/Avatar"
import MuiBadge from "@mui/material/Badge"
import MuiChip from "@mui/material/Chip"
import { Button } from "@/components/ui/button"
import { CheckCheck } from "lucide-react"

const messages = [
  {
    id: 1,
    patient: "Maria Santos",
    initials: "MS",
    lastMessage: "Dra., tive uma melhora significativa esta semana.",
    time: "10:32",
    unread: true,
    isFromPatient: true,
  },
  {
    id: 2,
    patient: "João Silva",
    initials: "JS",
    lastMessage: "Recebi o lembrete, obrigado!",
    time: "09:15",
    unread: false,
    isFromPatient: true,
  },
  {
    id: 3,
    patient: "Ana Costa",
    initials: "AC",
    lastMessage: "Como você está se sentindo hoje?",
    time: "Ontem",
    unread: false,
    isFromPatient: false,
  },
]

export function MessagesWidget() {
  const unreadCount = messages.filter((m) => m.unread).length

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
        title="Mensagem Segura"
        titleTypographyProps={{ fontSize: "0.9375rem", fontWeight: 600, color: "#0F2137" }}
        action={
          unreadCount > 0 ? (
            <MuiChip
              label={`${unreadCount} novas`}
              size="small"
              sx={{
                height: 22,
                fontSize: "0.7rem",
                fontWeight: 600,
                bgcolor: "#E57373",
                color: "#fff",
                mr: 1,
                mt: 0.5,
                "& .MuiChip-label": { px: 1 },
              }}
            />
          ) : null
        }
        sx={{ pb: 0.5, pt: 2, px: 2.5 }}
      />
      <MuiCardContent sx={{ px: 1, pt: 0.5, pb: "12px !important" }}>
        <MuiList disablePadding>
          {messages.map((msg, i) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07, duration: 0.25 }}
            >
              <MuiListItem
                alignItems="flex-start"
                sx={{
                  px: 1.5,
                  py: 1,
                  mx: 0.5,
                  mb: 0.25,
                  borderRadius: 2.5,
                  cursor: "pointer",
                  bgcolor: msg.unread ? "rgba(20,184,166,0.05)" : "transparent",
                  "&:hover": { bgcolor: "rgba(20,184,166,0.06)" },
                  transition: "background 0.18s",
                }}
              >
                <MuiListItemAvatar sx={{ minWidth: 50, mt: 0.5 }}>
                  <MuiBadge
                    variant="dot"
                    invisible={!msg.unread}
                    sx={{
                      "& .MuiBadge-badge": {
                        bgcolor: "#14B8A6",
                        width: 9,
                        height: 9,
                        borderRadius: "50%",
                        border: "2px solid white",
                        top: 4,
                        right: 4,
                      },
                    }}
                  >
                    <MuiAvatar
                      sx={{
                        width: 38,
                        height: 38,
                        bgcolor: msg.unread ? "#14B8A6" : "#F0F9F8",
                        color: msg.unread ? "#fff" : "#14B8A6",
                        fontSize: "0.75rem",
                        fontWeight: 700,
                        border: "2px solid rgba(20,184,166,0.18)",
                      }}
                    >
                      {msg.initials}
                    </MuiAvatar>
                  </MuiBadge>
                </MuiListItemAvatar>

                <MuiListItemText
                  primary={
                    <span className="flex items-center justify-between gap-2">
                      <span className="text-sm font-semibold text-[#0F2137] truncate">
                        {msg.patient}
                      </span>
                      <span className="text-[11px] text-muted-foreground flex-shrink-0">
                        {msg.time}
                      </span>
                    </span>
                  }
                  secondary={
                    <span className="flex items-center gap-1 mt-0.5">
                      {!msg.isFromPatient && (
                        <CheckCheck size={11} className="text-[#14B8A6] flex-shrink-0" />
                      )}
                      <span className="text-xs text-muted-foreground truncate">
                        {msg.lastMessage}
                      </span>
                    </span>
                  }
                />
              </MuiListItem>
            </motion.div>
          ))}
        </MuiList>
        <Button
          variant="ghost"
          className="w-full text-[#14B8A6] hover:text-[#0D9488] hover:bg-[#F0F9F8] mt-1 text-xs h-8"
        >
          Ver todas as mensagens
        </Button>
      </MuiCardContent>
    </MuiCard>
  )
}
