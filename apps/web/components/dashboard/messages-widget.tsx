"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
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

const delayClass = ["delay-100", "delay-200", "delay-300"]

export function MessagesWidget() {
  const unreadCount = messages.filter((m) => m.unread).length

  return (
    <Card className="border-border/80 hover:border-primary/25 hover:shadow-[0_4px_24px_rgba(94,75,139,0.07)] transition-all duration-200">
      <CardHeader className="pb-1 pt-5 px-5">
        <div className="flex items-center justify-between">
          <CardTitle className="text-[0.9375rem] font-semibold text-navy">Mensagem Segura</CardTitle>
          {unreadCount > 0 && (
            <Badge className="h-[22px] px-2 text-[0.7rem] font-semibold bg-coral text-white border-0">
              {unreadCount} novas
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="px-3 pt-1 pb-3">
        <div className="space-y-0.5">
          {messages.map((msg, i) => (
            <div
              key={msg.id}
              className={`flex items-start gap-3 px-3 py-2.5 mx-1 rounded-xl cursor-pointer transition-colors animate-fade-in ${delayClass[i]} ${
                msg.unread ? "bg-primary/5" : "bg-transparent hover:bg-primary/[0.03]"
              }`}
            >
              <div className="relative flex-shrink-0 mt-0.5">
                <Avatar
                  className={`h-[38px] w-[38px] text-[0.75rem] font-bold border-2 ${
                    msg.unread
                      ? "bg-primary text-white border-primary/20"
                      : "bg-secondary text-primary border-primary/20"
                  }`}
                >
                  <AvatarFallback>{msg.initials}</AvatarFallback>
                </Avatar>
                {msg.unread && (
                  <span className="absolute top-0 right-0 h-2.5 w-2.5 rounded-full bg-primary border-2 border-white" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold text-navy truncate">
                    {msg.patient}
                  </span>
                  <span className="text-[11px] text-muted-foreground flex-shrink-0">
                    {msg.time}
                  </span>
                </div>
                <div className="flex items-center gap-1 mt-0.5">
                  {!msg.isFromPatient && (
                    <CheckCheck size={11} className="text-primary flex-shrink-0" />
                  )}
                  <span className="text-xs text-muted-foreground truncate">
                    {msg.lastMessage}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
        <Button
          variant="ghost"
          className="w-full text-primary hover:text-purple-dark hover:bg-secondary mt-1 text-xs h-8"
        >
          Ver todas as mensagens
        </Button>
      </CardContent>
    </Card>
  )
}
