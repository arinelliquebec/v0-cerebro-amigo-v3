"use client"

import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Search,
  Plus,
  FileText,
  Calendar,
  Clock,
  User,
  Pill,
  Activity,
  ChevronRight,
  Download,
  Printer,
} from "lucide-react"
import { useState } from "react"

const patients = [
  {
    id: 1,
    name: "Maria Santos",
    initials: "MS",
    age: 34,
    lastUpdate: "28/05/2026",
    diagnosis: "Transtorno de Ansiedade Generalizada",
    cid: "F41.1",
  },
  {
    id: 2,
    name: "João Silva",
    initials: "JS",
    age: 42,
    lastUpdate: "27/05/2026",
    diagnosis: "Episódio Depressivo Leve",
    cid: "F32.0",
  },
  {
    id: 3,
    name: "Ana Costa",
    initials: "AC",
    age: 28,
    lastUpdate: "25/05/2026",
    diagnosis: "Transtorno Obsessivo-Compulsivo",
    cid: "F42",
  },
]

const consultationHistory = [
  {
    id: 1,
    date: "28/05/2026",
    type: "Retorno",
    summary: "Paciente relata melhora significativa dos sintomas de ansiedade. Sono normalizado. Mantida medicação atual.",
    prescription: "Escitalopram 10mg - 1x ao dia",
  },
  {
    id: 2,
    date: "14/05/2026",
    type: "Retorno",
    summary: "Relato de episódios de insônia. Orientações de higiene do sono fornecidas. Ajuste de horário da medicação.",
    prescription: "Escitalopram 10mg - 1x ao dia (manhã)",
  },
  {
    id: 3,
    date: "30/04/2026",
    type: "Primeira Consulta",
    summary: "Queixa principal: ansiedade generalizada, dificuldade de concentração, insônia inicial. Início de tratamento medicamentoso.",
    prescription: "Escitalopram 5mg - 1x ao dia por 7 dias, depois 10mg",
  },
]

export default function ProntuariosPage() {
  const [selectedPatient, setSelectedPatient] = useState(patients[0])
  const [searchQuery, setSearchQuery] = useState("")

  const filteredPatients = patients.filter((patient) =>
    patient.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="min-h-screen">
      <Header title="Prontuários" subtitle="Histórico clínico dos pacientes" />

      <div className="p-6">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Patients List */}
          <Card className="border-border/50 lg:col-span-1">
            <CardHeader className="pb-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Buscar paciente..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 bg-muted/50 border-0 focus-visible:ring-[#0D9488]"
                />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border max-h-[calc(100vh-320px)] overflow-y-auto">
                {filteredPatients.map((patient) => (
                  <button
                    key={patient.id}
                    onClick={() => setSelectedPatient(patient)}
                    className={`w-full flex items-center gap-3 p-4 hover:bg-muted/50 transition-colors text-left ${
                      selectedPatient.id === patient.id ? "bg-[#F0F9F8]" : ""
                    }`}
                  >
                    <Avatar className="h-11 w-11 border-2 border-[#0D9488]/20">
                      <AvatarFallback className="bg-[#F0F9F8] text-[#0D9488] font-medium">
                        {patient.initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-[#0F2137] truncate">
                        {patient.name}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {patient.diagnosis}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Última atualização: {patient.lastUpdate}
                      </p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Patient Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Patient Header */}
            <Card className="border-border/50">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-16 w-16 border-2 border-[#0D9488]/30">
                      <AvatarFallback className="bg-[#0D9488] text-white text-xl font-medium">
                        {selectedPatient.initials}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h2 className="text-xl font-semibold text-[#0F2137]">
                        {selectedPatient.name}
                      </h2>
                      <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <User className="h-4 w-4" />
                          {selectedPatient.age} anos
                        </span>
                        <span className="flex items-center gap-1">
                          <FileText className="h-4 w-4" />
                          CID: {selectedPatient.cid}
                        </span>
                      </div>
                      <Badge className="mt-2 bg-[#F0F9F8] text-[#0D9488] hover:bg-[#F0F9F8]">
                        {selectedPatient.diagnosis}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="gap-2">
                      <Printer className="h-4 w-4" />
                      Imprimir
                    </Button>
                    <Button variant="outline" size="sm" className="gap-2">
                      <Download className="h-4 w-4" />
                      Exportar
                    </Button>
                    <Button size="sm" className="bg-[#0D9488] hover:bg-[#0F766E] text-white gap-2">
                      <Plus className="h-4 w-4" />
                      Nova Evolução
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tabs */}
            <Tabs defaultValue="history" className="space-y-4">
              <TabsList className="bg-muted/50">
                <TabsTrigger value="history" className="data-[state=active]:bg-[#0D9488] data-[state=active]:text-white">
                  Histórico
                </TabsTrigger>
                <TabsTrigger value="prescriptions" className="data-[state=active]:bg-[#0D9488] data-[state=active]:text-white">
                  Prescrições
                </TabsTrigger>
                <TabsTrigger value="exams" className="data-[state=active]:bg-[#0D9488] data-[state=active]:text-white">
                  Exames
                </TabsTrigger>
                <TabsTrigger value="documents" className="data-[state=active]:bg-[#0D9488] data-[state=active]:text-white">
                  Documentos
                </TabsTrigger>
              </TabsList>

              <TabsContent value="history" className="space-y-4">
                {consultationHistory.map((consultation) => (
                  <Card key={consultation.id} className="border-border/50">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-lg bg-[#F0F9F8] flex items-center justify-center">
                            <Calendar className="h-5 w-5 text-[#0D9488]" />
                          </div>
                          <div>
                            <p className="font-medium text-[#0F2137]">{consultation.date}</p>
                            <Badge variant="secondary" className="text-xs">
                              {consultation.type}
                            </Badge>
                          </div>
                        </div>
                        <Button variant="ghost" size="sm" className="text-[#0D9488]">
                          Ver detalhes
                        </Button>
                      </div>
                      <div className="space-y-3 pl-13">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground mb-1">Evolução</p>
                          <p className="text-sm text-foreground leading-relaxed">
                            {consultation.summary}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                          <Pill className="h-4 w-4 text-[#0D9488]" />
                          <span className="text-sm text-foreground">{consultation.prescription}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>

              <TabsContent value="prescriptions">
                <Card className="border-border/50">
                  <CardContent className="p-6">
                    <div className="text-center py-8">
                      <Pill className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="font-medium text-[#0F2137] mb-2">Prescrições do Paciente</h3>
                      <p className="text-sm text-muted-foreground">
                        Histórico completo de medicações prescritas
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="exams">
                <Card className="border-border/50">
                  <CardContent className="p-6">
                    <div className="text-center py-8">
                      <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="font-medium text-[#0F2137] mb-2">Exames do Paciente</h3>
                      <p className="text-sm text-muted-foreground">
                        Resultados de exames e laudos
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="documents">
                <Card className="border-border/50">
                  <CardContent className="p-6">
                    <div className="text-center py-8">
                      <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="font-medium text-[#0F2137] mb-2">Documentos do Paciente</h3>
                      <p className="text-sm text-muted-foreground">
                        Atestados, relatórios e outros documentos
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  )
}
