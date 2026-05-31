"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Calendar, MessageSquare, MoreHorizontal } from "lucide-react"

const recentPatients = [
  {
    id: 1,
    name: "Maria Santos",
    initials: "MS",
    lastVisit: "Hoje, 09:00",
    nextVisit: "28/06/2026",
    status: "Em acompanhamento",
    statusColor: "bg-success",
  },
  {
    id: 2,
    name: "João Silva",
    initials: "JS",
    lastVisit: "Ontem, 14:30",
    nextVisit: "05/06/2026",
    status: "Novo paciente",
    statusColor: "bg-primary",
  },
  {
    id: 3,
    name: "Ana Costa",
    initials: "AC",
    lastVisit: "25/05/2026",
    nextVisit: "Amanhã",
    status: "Em acompanhamento",
    statusColor: "bg-success",
  },
  {
    id: 4,
    name: "Carlos Oliveira",
    initials: "CO",
    lastVisit: "20/05/2026",
    nextVisit: "01/06/2026",
    status: "Atenção",
    statusColor: "bg-warning",
  },
]

const delayClass = ["delay-100", "delay-200", "delay-300", "delay-400"]

export function RecentPatientsWidget() {
  return (
    <Card className="border-border/80 hover:border-primary/25 hover:shadow-[0_4px_24px_rgba(94,75,139,0.07)] transition-all duration-200">
      <CardHeader className="pb-1 pt-5 px-5">
        <div className="flex items-center justify-between">
          <CardTitle className="text-[0.9375rem] font-semibold text-navy">Pacientes Recentes</CardTitle>
          <Button
            variant="ghost"
            size="sm"
            className="text-primary hover:text-purple-dark text-xs"
          >
            Ver todos
          </Button>
        </div>
      </CardHeader>
      <CardContent className="px-3 pt-1 pb-3">
        <TooltipProvider>
          <div className="space-y-0.5">
            {recentPatients.map((patient, i) => (
              <div
                key={patient.id}
                className={`flex items-center gap-3 px-3 py-2 rounded-xl mx-0.5 hover:bg-primary/[0.04] transition-colors cursor-pointer group animate-fade-left ${delayClass[i]}`}
              >
                <Avatar className="h-10 w-10 bg-secondary text-primary text-[0.8rem] font-semibold border-2 border-primary/20">
                  <AvatarFallback>{patient.initials}</AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-medium text-navy">
                      {patient.name}
                    </span>
                    <span className={`h-2 w-2 rounded-full flex-shrink-0 ${patient.statusColor}`} />
                  </div>
                  <div className="flex gap-3 mt-0.5">
                    <span className="text-xs text-muted-foreground">
                      Última: {patient.lastVisit}
                    </span>
                    <span className="text-xs text-primary font-medium">
                      Próxima: {patient.nextVisit}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-primary">
                        <Calendar size={15} />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Agendar</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-primary">
                        <MessageSquare size={15} />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Mensagem</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-navy">
                        <MoreHorizontal size={15} />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Mais opções</TooltipContent>
                  </Tooltip>
                </div>
              </div>
            ))}
          </div>
        </TooltipProvider>
      </CardContent>
    </Card>
  )
}
