"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MoreHorizontal, Calendar, MessageSquare } from "lucide-react"

const recentPatients = [
  {
    id: 1,
    name: "Maria Santos",
    initials: "MS",
    lastVisit: "Hoje, 09:00",
    nextVisit: "28/06/2026",
    status: "Em acompanhamento",
    statusColor: "bg-[#10B981]",
  },
  {
    id: 2,
    name: "João Silva",
    initials: "JS",
    lastVisit: "Ontem, 14:30",
    nextVisit: "05/06/2026",
    status: "Novo paciente",
    statusColor: "bg-[#0D9488]",
  },
  {
    id: 3,
    name: "Ana Costa",
    initials: "AC",
    lastVisit: "25/05/2026",
    nextVisit: "Amanhã",
    status: "Em acompanhamento",
    statusColor: "bg-[#10B981]",
  },
  {
    id: 4,
    name: "Carlos Oliveira",
    initials: "CO",
    lastVisit: "20/05/2026",
    nextVisit: "01/06/2026",
    status: "Atenção",
    statusColor: "bg-[#F59E0B]",
  },
]

export function RecentPatientsWidget() {
  return (
    <Card className="border-border/50 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold text-[#0F2137]">
            Pacientes Recentes
          </CardTitle>
          <Button variant="ghost" size="sm" className="text-[#0D9488] hover:text-[#0F766E]">
            Ver todos
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {recentPatients.map((patient) => (
            <div
              key={patient.id}
              className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors group"
            >
              <Avatar className="h-11 w-11 border-2 border-[#0D9488]/20">
                <AvatarFallback className="bg-[#F0F9F8] text-[#0D9488] text-sm font-medium">
                  {patient.initials}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-foreground truncate">
                    {patient.name}
                  </p>
                  <span className={`h-2 w-2 rounded-full ${patient.statusColor}`} />
                </div>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-xs text-muted-foreground">
                    Última: {patient.lastVisit}
                  </span>
                  <span className="text-xs text-[#0D9488] font-medium">
                    Próxima: {patient.nextVisit}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-[#0D9488]">
                  <Calendar className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-[#0D9488]">
                  <MessageSquare className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
