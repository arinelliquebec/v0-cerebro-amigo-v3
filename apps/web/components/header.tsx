"use client"

import { Bell, Search, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface HeaderProps {
  title: string
  subtitle?: string
}

export function Header({ title, subtitle }: HeaderProps) {
  const today = new Date().toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })

  return (
    <header className="sticky top-0 z-30 border-b border-border/70 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center justify-between px-6">
        <div className="min-w-0">
          <h1 className="truncate text-xl font-semibold tracking-tight text-navy">{title}</h1>
          <p className="truncate text-sm text-muted-foreground">
            {subtitle ?? `Olá, Dra. Ana! ${today}`}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="relative hidden md:block">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground transition-colors" />
            <Input
              type="search"
              placeholder="Buscar pacientes..."
              className="w-64 rounded-full border-border/60 bg-muted/40 pl-9 transition-all duration-200 focus-visible:w-72 focus-visible:bg-card focus-visible:ring-2 focus-visible:ring-primary/40"
            />
          </div>

          {/* Quick Add */}
          <Button
            size="sm"
            className="gap-2 rounded-full bg-primary text-white shadow-sm shadow-primary/25 transition-all duration-200 hover:bg-purple-dark hover:shadow-md active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-primary/40"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Novo Paciente</span>
          </Button>

          {/* Notifications */}
          <Button
            variant="ghost"
            size="icon"
            aria-label="Notificações"
            className="relative rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-primary focus-visible:ring-2 focus-visible:ring-primary/40"
          >
            <Bell className="h-5 w-5" />
            <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-coral text-[10px] font-medium text-white ring-2 ring-background">
              3
            </span>
          </Button>
        </div>
      </div>
    </header>
  )
}
