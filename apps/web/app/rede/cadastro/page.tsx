"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Users } from "lucide-react"

const UFS = ["AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"]

function mensagemErro(status: number, error?: string, situacao?: string): string {
  if (error === "email_em_uso") return "E-mail já cadastrado — faça login."
  if (error === "crm_nao_confere") return "CRM não confere no CFM. Confira nome, número e UF."
  if (error === "crm_nao_regular") return `Seu CRM não está Regular no CFM${situacao ? ` (situação: ${situacao})` : ""}.`
  if (error === "cfm_indisponivel" || status === 503) return "Não deu pra validar o CRM agora. Tente em instantes."
  if (error === "senha_curta") return "A senha precisa de ao menos 8 caracteres."
  if (status === 400) return "Preencha todos os campos."
  return "Não foi possível cadastrar. Tente novamente."
}

export default function RedeCadastroPage() {
  const router = useRouter()
  const [f, setF] = useState({ nome: "", email: "", crm: "", uf: "SP", senha: "" })
  const [erro, setErro] = useState<string | null>(null)
  const [emailEmUso, setEmailEmUso] = useState(false)
  const [carregando, setCarregando] = useState(false)

  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setF((s) => ({ ...s, [k]: e.target.value }))

  async function cadastrar(e: React.FormEvent) {
    e.preventDefault()
    setErro(null)
    setEmailEmUso(false)
    setCarregando(true)
    try {
      const r = await fetch("/api/rede/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...f, nome: f.nome.trim(), email: f.email.trim(), crm: f.crm.trim() }),
      })
      if (r.ok) {
        router.push("/rede")
        router.refresh()
        return
      }
      const d = await r.json().catch(() => null)
      if (d?.error === "email_em_uso") setEmailEmUso(true)
      setErro(mensagemErro(r.status, d?.error, d?.situacao))
    } catch {
      setErro("Erro de conexão. Tente novamente.")
    } finally {
      setCarregando(false)
    }
  }

  return (
    <div className="theme-noir flex min-h-screen items-center justify-center bg-background p-6 text-foreground">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center gap-2 text-center">
          <span className="grid h-12 w-12 place-items-center rounded-xl bg-primary/15 text-primary">
            <Users className="h-6 w-6" />
          </span>
          <h1 className="text-xl font-semibold">Cadastro de médico</h1>
          <p className="text-sm text-muted-foreground">Rede só de médicos verificados — validamos seu CRM no CFM.</p>
        </div>

        <form onSubmit={cadastrar} className="space-y-4 rounded-2xl border border-border/60 bg-card p-6">
          {erro && (
            <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {erro}
              {emailEmUso && (
                <>
                  {" "}
                  <Link href="/rede/login" className="font-medium underline">Entrar</Link>
                </>
              )}
            </p>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="nome">Nome completo (como no CFM)</Label>
            <Input id="nome" value={f.nome} onChange={set("nome")} required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="email">E-mail</Label>
            <Input id="email" type="email" value={f.email} onChange={set("email")} required autoComplete="email" />
          </div>
          <div className="grid grid-cols-[1fr_88px] gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="crm">CRM</Label>
              <Input id="crm" inputMode="numeric" value={f.crm} onChange={set("crm")} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="uf">UF</Label>
              <select
                id="uf"
                value={f.uf}
                onChange={set("uf")}
                className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
              >
                {UFS.map((u) => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="senha">Senha (mín. 8)</Label>
            <Input id="senha" type="password" value={f.senha} onChange={set("senha")} required minLength={8} autoComplete="new-password" />
          </div>
          <Button type="submit" className="w-full" disabled={carregando}>
            {carregando ? <Loader2 className="h-4 w-4 animate-spin" /> : "Cadastrar e entrar"}
          </Button>
          <p className="text-[11px] text-muted-foreground">
            A validação do CRM pode levar alguns segundos (consulta ao CFM).
          </p>
        </form>

        <p className="mt-5 text-center text-sm text-muted-foreground">
          Já tem conta?{" "}
          <Link href="/rede/login" className="font-medium text-primary hover:underline">Entrar</Link>
        </p>
      </div>
    </div>
  )
}
