"use client"

import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  Search,
  Plus,
  Filter,
  MoreHorizontal,
  Calendar,
  MessageSquare,
  FileText,
  Phone,
  Mail,
  ChevronRight,
} from "lucide-react"
import { useState } from "react"

const patients = [
  {
    id: 1,
    name: "Maria Santos",
    initials: "MS",
    email: "maria.santos@email.com",
    phone: "(11) 99999-1234",
    lastVisit: "28/05/2026",
    nextVisit: "28/06/2026",
    status: "Em acompanhamento",
    statusColor: "bg-[#10B981]",
    notes: "Ansiedade generalizada - Boa evolução",
  },
  {
    id: 2,
    name: "João Silva",
    initials: "JS",
    email: "joao.silva@email.com",
    phone: "(11) 98888-5678",
    lastVisit: "27/05/2026",
    nextVisit: "05/06/2026",
    status: "Novo paciente",
    statusColor: "bg-[#0D9488]",
    notes: "Primeira consulta realizada",
  },
  {
    id: 3,
    name: "Ana Costa",
    initials: "AC",
    email: "ana.costa@email.com",
    phone: "(11) 97777-9012",
    lastVisit: "25/05/2026",
    nextVisit: "29/05/2026",
    status: "Em acompanhamento",
    statusColor: "bg-[#10B981]",
    notes: "Depressão leve - Ajuste de medicação",
  },
  {
    id: 4,
    name: "Carlos Oliveira",
    initials: "CO",
    email: "carlos.oliveira@email.com",
    phone: "(11) 96666-3456",
    lastVisit: "20/05/2026",
    nextVisit: "01/06/2026",
    status: "Atenção",
    statusColor: "bg-[#F59E0B]",
    notes: "TDAH - Necessita reavaliação",
  },
  {
    id: 5,
    name: "Lucia Ferreira",
    initials: "LF",
    email: "lucia.ferreira@email.com",
    phone: "(11) 95555-7890",
    lastVisit: "18/05/2026",
    nextVisit: "15/06/2026",
    status: "Em acompanhamento",
    statusColor: "bg-[#10B981]",
    notes: "TOC - Evolução satisfatória",
  },
  {
    id: 6,
    name: "Pedro Almeida",
    initials: "PA",
    email: "pedro.almeida@email.com",
    phone: "(11) 94444-1234",
    lastVisit: "15/05/2026",
    nextVisit: "10/06/2026",
    status: "Em acompanhamento",
    statusColor: "bg-[#10B981]",
    notes: "Síndrome do pânico - Controlado",
  },
]

export default function PacientesPage() {
  const [searchQuery, setSearchQuery] = useState("")

  const filteredPatients = patients.filter((patient) =>
    patient.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="min-h-screen">
      <Header title="Pacientes" subtitle="Gerencie seus pacientes" />

      <div className="p-6 space-y-6">
        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Buscar paciente por nome..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-card border-border focus-visible:ring-[#0D9488]"
            />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2">
              <Filter className="h-4 w-4" />
              Filtros
            </Button>
            <Button className="bg-[#0D9488] hover:bg-[#0F766E] text-white gap-2">
              <Plus className="h-4 w-4" />
              Novo Paciente
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="border-border/50">
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Total</p>
              <p className="text-2xl font-bold text-[#0F2137]">{patients.length}</p>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Em acompanhamento</p>
              <p className="text-2xl font-bold text-[#10B981]">
                {patients.filter((p) => p.status === "Em acompanhamento").length}
              </p>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Novos</p>
              <p className="text-2xl font-bold text-[#0D9488]">
                {patients.filter((p) => p.status === "Novo paciente").length}
              </p>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Atenção</p>
              <p className="text-2xl font-bold text-[#F59E0B]">
                {patients.filter((p) => p.status === "Atenção").length}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Patients List */}
        <Card className="border-border/50">
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {filteredPatients.map((patient) => (
                <div
                  key={patient.id}
                  className="flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors cursor-pointer group"
                >
                  <Avatar className="h-12 w-12 border-2 border-[#0D9488]/20">
                    <AvatarFallback className="bg-[#F0F9F8] text-[#0D9488] font-medium">
                      {patient.initials}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium text-[#0F2137] truncate">
                        {patient.name}
                      </h3>
                      <span className={`h-2 w-2 rounded-full ${patient.statusColor}`} />
                      <Badge variant="secondary" className="text-xs">
                        {patient.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground truncate">
                      {patient.notes}
                    </p>
                    <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        {patient.email}
                      </span>
                      <span className="flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {patient.phone}
                      </span>
                    </div>
                  </div>

                  <div className="hidden md:block text-right">
                    <p className="text-sm text-muted-foreground">Última consulta</p>
                    <p className="text-sm font-medium text-[#0F2137]">{patient.lastVisit}</p>
                  </div>

                  <div className="hidden md:block text-right">
                    <p className="text-sm text-muted-foreground">Próxima consulta</p>
                    <p className="text-sm font-medium text-[#0D9488]">{patient.nextVisit}</p>
                  </div>

                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-[#0D9488]">
                      <Calendar className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-[#0D9488]">
                      <MessageSquare className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-[#0D9488]">
                      <FileText className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
