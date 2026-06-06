"use client"

// Primeiros passos (item 2 do top-3): onboarding guiado que mata a objeção
// "vou ter trabalho pra começar". Aparece só quando o médico ainda não tem
// pacientes. Reusa convite (NovoPaciente) + importação (CSV/XLSX) e oferece
// "carregar dados de demonstração" (1 clique) pra apresentação ao vivo.

import { useEffect, useState, type ElementType } from "react"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Rocket, UserPlus, Upload, Sparkles, Settings, Loader2, ArrowRight } from "lucide-react"

export function PrimeirosPassos() {
  const [pacientes, setPacientes] = useState<number | null>(null)
  const [seeding, setSeeding] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  useEffect(() => {
    fetch("/api/roi/resumo")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setPacientes(d ? d.pacientesAtivos : 0))
      .catch(() => setPacientes(0))
  }, [])

  async function carregarDemo() {
    setSeeding(true)
    setErro(null)
    try {
      const r = await fetch("/api/seed/demo", { method: "POST" })
      if (!r.ok) throw new Error()
      window.location.reload()
    } catch {
      setErro("Não foi possível carregar a demonstração. Tente novamente.")
      setSeeding(false)
    }
  }

  // Já onboardado (ou ainda carregando a contagem) → não mostra.
  if (pacientes === null || pacientes > 0) return null

  return (
    <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
      <CardContent className="p-6">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-primary/10">
            <Rocket className="h-5 w-5 text-primary" />
          </div>
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-foreground">Bem-vindo(a) ao Cérebro Amigo</h2>
            <p className="text-sm text-muted-foreground">Comece em menos de 5 minutos. Escolha um caminho:</p>
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Passo
            icon={UserPlus} titulo="Convidar 1º paciente"
            desc="Envie um convite por e-mail (magic link)."
            href="/dashboard/pacientes"
          />
          <Passo
            icon={Upload} titulo="Importar minha lista"
            desc="Suba uma planilha (CSV/XLSX) de uma vez."
            href="/dashboard/pacientes"
          />
          <Passo
            icon={Settings} titulo="Configurar consultório"
            desc="Perfil, agenda e preferências."
            href="/dashboard/configuracoes"
          />
        </div>

        {/* Ação de demonstração — destaque para apresentação ao vivo */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-coral/30 bg-coral/5 p-4">
          <div className="flex items-center gap-3">
            <Sparkles className="h-5 w-5 flex-shrink-0 text-coral" />
            <div>
              <p className="text-sm font-medium text-foreground">Carregar dados de demonstração</p>
              <p className="text-xs text-muted-foreground">
                3 pacientes de exemplo com histórico, adesão e alertas. Ideal para conhecer o sistema.
              </p>
            </div>
          </div>
          <Button variant="coral" className="gap-2" onClick={carregarDemo} disabled={seeding}>
            {seeding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {seeding ? "Carregando…" : "Carregar demonstração"}
          </Button>
        </div>
        {erro && <p className="mt-2 text-xs text-coral">{erro}</p>}
      </CardContent>
    </Card>
  )
}

function Passo({ icon: Icon, titulo, desc, href }: {
  icon: ElementType; titulo: string; desc: string; href: string
}) {
  return (
    <Link
      href={href}
      className="group flex flex-col rounded-xl border border-border/70 bg-card p-4 transition-colors hover:border-primary/40 hover:bg-secondary/30"
    >
      <Icon className="h-5 w-5 text-primary" />
      <p className="mt-3 flex items-center gap-1 text-sm font-medium text-foreground">
        {titulo}
        <ArrowRight className="h-3.5 w-3.5 -translate-x-1 opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100" />
      </p>
      <p className="text-xs text-muted-foreground">{desc}</p>
    </Link>
  )
}
