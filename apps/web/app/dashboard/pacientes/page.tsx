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
  Calendar,
  MessageSquare,
  FileText,
  Mail,
  Pill,
  ChevronRight,
} from "lucide-react"
import { useState, useEffect } from "react"

interface Paciente {
  id: string
  numero: number
  nome: string
  email: string | null
  prescricoesAtivas: number
  ultimaMsg: string | null
}

function initials(nome: string) {
  return nome.split(" ").slice(0, 2).map((n) => n[0]).join("").toUpperCase()
}

export default function PacientesPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [pacientes, setPacientes] = useState<Paciente[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/pacientes/")
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then(setPacientes)
      .catch(() => setPacientes([]))
      .finally(() => setLoading(false))
  }, [])

  const filteredPatients = pacientes.filter((p) =>
    p.nome.toLowerCase().includes(searchQuery.toLowerCase())
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
              className="pl-9 bg-card border-border focus-visible:ring-[#14B8A6]"
            />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2">
              <Filter className="h-4 w-4" />
              Filtros
            </Button>
            <Button className="bg-[#14B8A6] hover:bg-[#0D9488] text-white gap-2">
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
              <p className="text-2xl font-bold text-[#0F2137]">{pacientes.length}</p>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Com prescrição ativa</p>
              <p className="text-2xl font-bold text-[#10B981]">
                {pacientes.filter((p) => p.prescricoesAtivas > 0).length}
              </p>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Sem prescrição</p>
              <p className="text-2xl font-bold text-[#14B8A6]">
                {pacientes.filter((p) => p.prescricoesAtivas === 0).length}
              </p>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Filtrados</p>
              <p className="text-2xl font-bold text-[#F59E0B]">
                {filteredPatients.length}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Patients List */}
        <Card className="border-border/50">
          <CardContent className="p-0">
            {loading ? (
              <div className="p-8 text-center text-muted-foreground text-sm">Carregando...</div>
            ) : filteredPatients.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground text-sm">
                {pacientes.length === 0 ? "Nenhum paciente cadastrado." : "Nenhum resultado para a busca."}
              </div>
            ) : (
              <div className="divide-y divide-border">
                {filteredPatients.map((paciente) => (
                  <div
                    key={paciente.id}
                    className="flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors cursor-pointer group"
                  >
                    <Avatar className="h-12 w-12 border-2 border-[#14B8A6]/20">
                      <AvatarFallback className="bg-[#F0F9F8] text-[#14B8A6] font-medium">
                        {initials(paciente.nome)}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium text-[#0F2137] truncate">{paciente.nome}</h3>
                        <span className="text-xs text-muted-foreground">#{paciente.numero}</span>
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                        {paciente.email && (
                          <span className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {paciente.email}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Pill className="h-3 w-3" />
                          {paciente.prescricoesAtivas} prescrições ativas
                        </span>
                      </div>
                    </div>

                    {paciente.ultimaMsg && (
                      <div className="hidden md:block text-right">
                        <p className="text-sm text-muted-foreground">Última mensagem</p>
                        <p className="text-sm font-medium text-[#0F2137]">
                          {new Date(paciente.ultimaMsg).toLocaleDateString("pt-BR")}
                        </p>
                      </div>
                    )}

                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-[#14B8A6]">
                        <Calendar className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-[#14B8A6]">
                        <MessageSquare className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-[#14B8A6]">
                        <FileText className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
