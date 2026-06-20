"use client"

import Link from "next/link"
import { Search, Plus, UserCircle, Wallet, LogOut } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { NovoPacienteDialog } from "@/components/pacientes/novo-paciente-dialog"
import { useMe } from "@/lib/use-me"

/** Iniciais p/ o avatar quando não há foto — mesmo padrão da sidebar. */
function iniciais(nome?: string) {
  if (!nome) return "·"
  const partes = nome.trim().split(/\s+/).filter(Boolean)
  const ini = (partes[0]?.[0] ?? "") + (partes.length > 1 ? partes[partes.length - 1][0] : "")
  return ini.toUpperCase() || "·"
}

interface HeaderProps {
  title: string
  subtitle?: string
}

export function Header({ title, subtitle }: HeaderProps) {
  const router = useRouter()
  const me = useMe()
  const [busca, setBusca] = useState("")
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [fotoErro, setFotoErro] = useState(false)

  async function handleLogout() {
    if (isLoggingOut) return // trava duplo-clique: evita POST duplicado + evento de auditoria duplicado
    setIsLoggingOut(true)
    try {
      await fetch("/api/auth/logout", { method: "POST" })
    } finally {
      router.push("/login")
    }
  }

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

          {/* Menu da conta — única porta de entrada visível no topo p/ Minha conta / 2ª via / Sair */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                aria-label="Abrir menu da conta"
                className="rounded-full outline-none transition-all duration-200 hover:opacity-90 focus-visible:ring-2 focus-visible:ring-primary/30"
              >
                <Avatar className="h-9 w-9 shadow-sm">
                  {me?.fotoUrl && !fotoErro ? (
                    <AvatarImage src={me.fotoUrl} alt="" onError={() => setFotoErro(true)} />
                  ) : null}
                  <AvatarFallback className="bg-gradient-to-br from-primary to-purple-dark text-xs font-semibold text-primary-foreground">
                    {iniciais(me?.nome)}
                  </AvatarFallback>
                </Avatar>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="truncate">{me?.nome ?? "Minha conta"}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/dashboard/conta">
                  <UserCircle className="h-4 w-4" aria-hidden="true" /> Minha conta
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/dashboard/financeiro">
                  <Wallet className="h-4 w-4" aria-hidden="true" /> Pagamentos &amp; 2ª via
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="text-destructive focus:bg-destructive/10 focus:text-destructive"
              >
                <LogOut className="h-4 w-4" aria-hidden="true" /> {isLoggingOut ? "Saindo…" : "Sair"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
