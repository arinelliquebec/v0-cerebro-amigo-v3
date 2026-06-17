"use client"

import { Bell, Search, Plus } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { NovoPacienteDialog } from "@/components/pacientes/novo-paciente-dialog"
import { useMe } from "@/lib/use-me"

interface HeaderProps {
  title: string
  subtitle?: string
}

export function Header({ title, subtitle }: HeaderProps) {
  const router = useRouter()
  const me = useMe()
  const [busca, setBusca] = useState("")

  function buscarPacientes(e: React.FormEvent) {
    e.preventDefault()
    const q = busca.trim()
    router.push(q ? `/dashboard/pacientes?q=${encodeURIComponent(q)}` : "/dashboard/pacientes")
  }
  const today = new Date().toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })
  const primeiroNome = me?.nome?.trim().split(/\s+/)[0]
  const saudacao = primeiroNome ? `Olá, ${primeiroNome}! ${today}` : `Olá! ${today}`

  return (
    <header className="sticky top-0 z-30 border-b border-border/40 bg-background/85 backdrop-blur-xl supports-[backdrop-filter]:bg-background/70">
      <div className="flex h-[72px] items-center justify-between px-8">
        <div className="min-w-0">
          <h1 className="truncate text-xl font-semibold tracking-tight text-foreground">{title}</h1>
          <p className="truncate text-sm text-muted-foreground/70 mt-0.5">
            {subtitle ?? saudacao}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Search */}
          <form onSubmit={buscarPacientes} className="relative hidden md:block">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/50" />
            <Input
              type="search"
              placeholder="Buscar pacientes..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              aria-label="Buscar pacientes"
              className="w-64 rounded-full border-border/50 bg-muted/30 pl-10 text-sm transition-all duration-200 focus-visible:w-72 focus-visible:bg-card focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:border-primary/30"
            />
          </form>

          {/* Quick Add — abre o mesmo dialog que funciona em /dashboard/pacientes */}
          <NovoPacienteDialog
            onConcluido={() => router.refresh()}
            trigger={
              <Button
                size="sm"
                className="gap-2 rounded-full bg-primary text-primary-foreground shadow-md shadow-primary/20 transition-all duration-200 hover:bg-purple-dark hover:shadow-lg hover:shadow-primary/25 hover:-translate-y-0.5 active:scale-[0.97] focus-visible:ring-2 focus-visible:ring-primary/30"
              >
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline font-medium">Novo Paciente</span>
              </Button>
            }
          />

          {/* Notifications */}
          <Button
            variant="ghost"
            size="icon"
            aria-label="Notificações"
            className="relative rounded-full text-muted-foreground/60 transition-all duration-200 hover:bg-secondary/70 hover:text-primary focus-visible:ring-2 focus-visible:ring-primary/30"
          >
            <Bell className="h-[18px] w-[18px]" />
            <span className="absolute -right-0.5 -top-0.5 flex h-[18px] w-[18px] items-center justify-center rounded-full bg-coral text-[10px] font-bold text-accent-foreground ring-2 ring-background">
              3
            </span>
          </Button>
        </div>
      </div>
    </header>
  )
}
