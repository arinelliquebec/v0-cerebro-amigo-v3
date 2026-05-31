"use client"

import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  Search,
  Send,
  Paperclip,
  MoreVertical,
  Phone,
  Video,
  Check,
  CheckCheck,
  Smile,
} from "lucide-react"
import { useState } from "react"

const conversations = [
  {
    id: 1,
    patient: "Maria Santos",
    initials: "MS",
    lastMessage: "Dra., tive uma melhora significativa esta semana.",
    time: "10:32",
    unread: 2,
    online: true,
  },
  {
    id: 2,
    patient: "João Silva",
    initials: "JS",
    lastMessage: "Recebi o lembrete, obrigado!",
    time: "09:15",
    unread: 0,
    online: false,
  },
  {
    id: 3,
    patient: "Ana Costa",
    initials: "AC",
    lastMessage: "Vou seguir as orientações.",
    time: "Ontem",
    unread: 0,
    online: true,
  },
  {
    id: 4,
    patient: "Carlos Oliveira",
    initials: "CO",
    lastMessage: "Posso remarcar a consulta?",
    time: "Ontem",
    unread: 1,
    online: false,
  },
  {
    id: 5,
    patient: "Lucia Ferreira",
    initials: "LF",
    lastMessage: "Estou me sentindo muito melhor!",
    time: "23/05",
    unread: 0,
    online: false,
  },
]

const messages = [
  {
    id: 1,
    sender: "patient",
    content: "Bom dia, Dra. Ana!",
    time: "10:28",
    status: "read",
  },
  {
    id: 2,
    sender: "patient",
    content: "Queria compartilhar que esta semana foi muito melhor. Consegui dormir bem todas as noites e a ansiedade diminuiu bastante.",
    time: "10:29",
    status: "read",
  },
  {
    id: 3,
    sender: "doctor",
    content: "Bom dia, Maria! Que ótima notícia! Fico muito feliz em saber que você está progredindo. 😊",
    time: "10:30",
    status: "read",
  },
  {
    id: 4,
    sender: "doctor",
    content: "Continue seguindo as técnicas de respiração que praticamos. Na próxima consulta vamos avaliar se podemos começar a reduzir gradualmente a medicação.",
    time: "10:31",
    status: "read",
  },
  {
    id: 5,
    sender: "patient",
    content: "Dra., tive uma melhora significativa esta semana.",
    time: "10:32",
    status: "delivered",
  },
]

export default function MensagensPage() {
  const [selectedConversation, setSelectedConversation] = useState(conversations[0])
  const [messageInput, setMessageInput] = useState("")

  return (
    <div className="min-h-screen">
      <Header title="Mensagens" subtitle="Comunicação segura com pacientes" />

      <div className="p-6">
        <div className="grid lg:grid-cols-3 gap-6 h-[calc(100vh-180px)]">
          {/* Conversations List */}
          <Card className="border-border/50 lg:col-span-1 flex flex-col">
            <div className="p-4 border-b border-border">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Buscar conversa..."
                  className="pl-9 bg-muted/50 border-0 focus-visible:ring-primary"
                />
              </div>
            </div>
            <CardContent className="p-0 flex-1 overflow-y-auto">
              <div className="divide-y divide-border">
                {conversations.map((conv) => (
                  <button
                    key={conv.id}
                    onClick={() => setSelectedConversation(conv)}
                    className={`w-full flex items-center gap-3 p-4 hover:bg-muted/50 transition-colors text-left ${
                      selectedConversation.id === conv.id ? "bg-secondary" : ""
                    }`}
                  >
                    <div className="relative">
                      <Avatar className="h-12 w-12 border-2 border-primary/20">
                        <AvatarFallback className="bg-secondary text-primary font-medium">
                          {conv.initials}
                        </AvatarFallback>
                      </Avatar>
                      {conv.online && (
                        <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-success border-2 border-card" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-medium text-navy truncate">
                          {conv.patient}
                        </span>
                        <span className="text-xs text-muted-foreground flex-shrink-0">
                          {conv.time}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground truncate">
                        {conv.lastMessage}
                      </p>
                    </div>
                    {conv.unread > 0 && (
                      <Badge className="bg-primary text-white text-xs h-5 w-5 p-0 flex items-center justify-center rounded-full">
                        {conv.unread}
                      </Badge>
                    )}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Chat Area */}
          <Card className="border-border/50 lg:col-span-2 flex flex-col">
            {/* Chat Header */}
            <div className="p-4 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Avatar className="h-10 w-10 border-2 border-primary/20">
                    <AvatarFallback className="bg-primary text-white font-medium">
                      {selectedConversation.initials}
                    </AvatarFallback>
                  </Avatar>
                  {selectedConversation.online && (
                    <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-success border-2 border-card" />
                  )}
                </div>
                <div>
                  <h3 className="font-medium text-navy">{selectedConversation.patient}</h3>
                  <p className="text-xs text-muted-foreground">
                    {selectedConversation.online ? "Online" : "Offline"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary">
                  <Phone className="h-5 w-5" />
                </Button>
                <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary">
                  <Video className="h-5 w-5" />
                </Button>
                <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
                  <MoreVertical className="h-5 w-5" />
                </Button>
              </div>
            </div>

            {/* Messages */}
            <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.sender === "doctor" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[70%] rounded-2xl px-4 py-2.5 ${
                      msg.sender === "doctor"
                        ? "bg-primary text-white rounded-br-md"
                        : "bg-muted text-foreground rounded-bl-md"
                    }`}
                  >
                    <p className="text-sm leading-relaxed">{msg.content}</p>
                    <div className={`flex items-center justify-end gap-1 mt-1 ${
                      msg.sender === "doctor" ? "text-white/70" : "text-muted-foreground"
                    }`}>
                      <span className="text-xs">{msg.time}</span>
                      {msg.sender === "doctor" && (
                        msg.status === "read" ? (
                          <CheckCheck className="h-3.5 w-3.5" />
                        ) : (
                          <Check className="h-3.5 w-3.5" />
                        )
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>

            {/* Message Input */}
            <div className="p-4 border-t border-border">
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary">
                  <Paperclip className="h-5 w-5" />
                </Button>
                <Input
                  type="text"
                  placeholder="Digite sua mensagem..."
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  className="flex-1 bg-muted/50 border-0 focus-visible:ring-primary"
                />
                <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary">
                  <Smile className="h-5 w-5" />
                </Button>
                <Button size="icon" className="bg-primary hover:bg-purple-dark text-white">
                  <Send className="h-5 w-5" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground text-center mt-2">
                🔒 Todas as mensagens são criptografadas de ponta a ponta
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
