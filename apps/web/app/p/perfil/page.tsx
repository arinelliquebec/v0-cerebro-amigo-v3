"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { User, Stethoscope, Loader2, Check, LogOut, ClipboardCheck, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PushToggle } from "@/components/portal/push-toggle"
import { sairPaciente } from "../entrar/actions"

interface Perfil {
  nome: string | null
  email: string | null
  nomeMedico: string
  crmMedico: string
}

export default function PerfilPage() {
  const [perfil, setPerfil] = useState<Perfil | null>(null)
  const [nome, setNome] = useState("")
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [salvo, setSalvo] = useState(false)
  const [erro, setErro] = useState(false)

  useEffect(() => {
    fetch("/api/paciente/perfil")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((p: Perfil) => {
        setPerfil(p)
        setNome(p.nome ?? "")
        setEmail(p.email ?? "")
      })
      .catch(() => setPerfil(null))
      .finally(() => setLoading(false))
  }, [])

  async function salvar() {
    setSalvando(true)
    setSalvo(false)
    setErro(false)
    try {
      const r = await fetch("/api/paciente/perfil", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome, email }),
      })
      if (r.ok) {
        setSalvo(true)
        setTimeout(() => setSalvo(false), 2000)
      } else {
        setErro(true)
      }
    } catch {
      setErro(true)
    } finally {
      setSalvando(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-16 text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    )
  }

  return (
    <div className="p-4 pt-8 space-y-6">
      <h1 className="flex items-center gap-2 text-2xl font-semibold text-foreground">
        <User className="h-6 w-6 text-primary" /> Meu perfil
      </h1>

      {perfil?.nomeMedico && (
        <div className="flex items-center gap-3 rounded-2xl border border-border/60 bg-card p-4">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-secondary text-primary">
            <Stethoscope className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">{perfil.nomeMedico}</p>
            <p className="text-xs text-muted-foreground">{perfil.crmMedico}</p>
          </div>
        </div>
      )}

      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="nome">Nome</Label>
          <Input id="nome" value={nome} onChange={(e) => setNome(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="email">E-mail</Label>
          <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <Button onClick={salvar} disabled={salvando} className="w-full bg-primary hover:bg-purple-dark text-primary-foreground">
          {salvando ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : salvo ? (
            <>
              <Check className="mr-1 h-4 w-4" /> Salvo
            </>
          ) : (
            "Salvar"
          )}
        </Button>
        {erro && (
          <p role="alert" className="text-sm text-destructive">
            Não conseguimos salvar suas alterações agora. Verifique a conexão e tente novamente em instantes.
          </p>
        )}
      </div>

      <PushToggle />

      <Link
        href="/p/checkins"
        className="flex items-center gap-3 rounded-2xl border border-border/60 bg-card p-4"
      >
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-secondary text-primary">
          <ClipboardCheck className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium text-foreground">Check-ins</p>
          <p className="text-xs text-muted-foreground">Perguntas rápidas da sua psiquiatra</p>
        </div>
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
      </Link>

      <form action={sairPaciente} className="pt-2">
        <Button variant="outline" type="submit" className="w-full gap-2 text-muted-foreground">
          <LogOut className="h-4 w-4" /> Sair
        </Button>
      </form>
    </div>
  )
}
