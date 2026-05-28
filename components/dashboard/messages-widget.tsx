"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Send, Check, CheckCheck } from "lucide-react"

const messages = [
  {
    id: 1,
    patient: "Maria Santos",
    avatar: "",
    initials: "MS",
    lastMessage: "Dra., tive uma melhora significativa esta semana.",
    time: "10:32",
    unread: true,
    isFromPatient: true,
  },
  {
    id: 2,
    patient: "João Silva",
    avatar: "",
    initials: "JS",
    lastMessage: "Recebi o lembrete, obrigado!",
    time: "09:15",
    unread: false,
    isFromPatient: true,
  },
  {
    id: 3,
    patient: "Ana Costa",
    avatar: "",
    initials: "AC",
    lastMessage: "Como você está se sentindo hoje?",
    time: "Ontem",
    unread: false,
    isFromPatient: false,
  },
]

export function MessagesWidget() {
  return (
    <Card className="border-border/50 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold text-[#0F2137]">Mensagem Segura</CardTitle>
          <span className="text-xs bg-[#E57373] text-white px-2 py-0.5 rounded-full font-medium">
            2 novas
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-3 p-3 rounded-lg transition-colors cursor-pointer ${
              msg.unread ? "bg-[#F0F9F8]" : "hover:bg-muted/50"
            }`}
          >
            <Avatar className="h-10 w-10 border-2 border-[#0D9488]/20">
              <AvatarImage src={msg.avatar} />
              <AvatarFallback className="bg-[#0D9488] text-white text-xs font-medium">
                {msg.initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium text-foreground truncate">
                  {msg.isFromPatient ? "Paciente" : "Você"}
                </span>
                <span className="text-xs text-muted-foreground flex-shrink-0">
                  {msg.time}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mb-1">{msg.patient}</p>
              <div className="flex items-center gap-1">
                {!msg.isFromPatient && (
                  <CheckCheck className="h-3 w-3 text-[#0D9488] flex-shrink-0" />
                )}
                <p className="text-sm text-muted-foreground truncate">
                  {msg.lastMessage}
                </p>
              </div>
            </div>
            {msg.unread && (
              <span className="h-2.5 w-2.5 rounded-full bg-[#0D9488] flex-shrink-0 mt-1" />
            )}
          </div>
        ))}
        <Button variant="ghost" className="w-full text-[#0D9488] hover:text-[#0F766E] hover:bg-[#F0F9F8]">
          Ver todas as mensagens
        </Button>
      </CardContent>
    </Card>
  )
}
