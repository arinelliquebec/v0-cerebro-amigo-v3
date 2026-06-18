"use client"

// ADR-066 Fase 4 — redefinir senha via token do e-mail (público).
// useSearchParams exige Suspense no Next 16 (cacheComponents).

import { Suspense, useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Logo } from "@/components/logo"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Loader2, CheckCircle2 } from "lucide-react"

const ERRO: Record<string, string> = {
  token_invalido: "Link inválido. Solicite um novo.",
  token_ja_utilizado: "Este link já foi usado. Solicite um novo.",
  senha_curta: "A senha precisa ter ao menos 8 caracteres.",
  dados_invalidos: "Dados inválidos.",
}

function Inner() {
  const sp = useSearchParams()
  const token = sp.get("token") ?? ""
  const [nova, setNova] = useState("")
  const [conf, setConf] = useState("")
  const [enviando, setEnviando] = useState(false)
  const [ok, setOk] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  async function enviar(e: React.FormEvent) {
    e.preventDefault()
    setErro(null)
    if (nova.length < 8) { setErro("A senha precisa ter ao menos 8 caracteres."); return }
    if (nova !== conf) { setErro("As senhas não conferem."); return }
    setEnviando(true)
    try {
      const r = await fetch("/api/redefinir-senha", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, novaSenha: nova }),
      })
      if (r.ok || r.status === 204) setOk(true)
      else if (r.status === 410) setErro("Link expirado. Solicite um novo.")
      else { const d = await r.json().catch(() => null); setErro(ERRO[d?.error] ?? "Não foi possível redefinir a senha.") }
    } catch { setErro("Erro de conexão.") }
    finally { setEnviando(false) }
  }

  if (!token) {
    return <p className="text-sm text-destructive">Link inválido. <Link href="/esqueci-senha" className="underline">Solicitar novo</Link>.</p>
  }
  if (ok) {
    return (
      <div className="space-y-3 text-center">
        <CheckCircle2 className="mx-auto h-10 w-10 text-success" />
        <h1 className="text-lg font-semibold text-foreground">Senha redefinida</h1>
        <p className="text-sm text-muted-foreground">Você já pode entrar com a nova senha.</p>
        <Link href="/login" className="inline-block text-sm underline underline-offset-2 hover:text-foreground">Ir para o login</Link>
      </div>
    )
  }
  return (
    <form onSubmit={enviar} className="space-y-4">
      <div className="space-y-1">
        <h1 className="text-lg font-semibold text-foreground">Nova senha</h1>
        <p className="text-sm text-muted-foreground">Crie uma nova senha de acesso.</p>
      </div>
      <div className="space-y-1.5">
        <Label className="text-sm">Nova senha</Label>
        <Input type="password" value={nova} onChange={(e) => setNova(e.target.value)} placeholder="mín. 8 caracteres" autoComplete="new-password" />
      </div>
      <div className="space-y-1.5">
        <Label className="text-sm">Confirmar senha</Label>
        <Input type="password" value={conf} onChange={(e) => setConf(e.target.value)} autoComplete="new-password" />
      </div>
      <Button type="submit" className="w-full" disabled={enviando || !nova}>
        {enviando ? <Loader2 className="h-4 w-4 animate-spin" /> : "Redefinir senha"}
      </Button>
      {erro && <p role="alert" className="text-sm text-destructive">{erro}</p>}
    </form>
  )
}

export default function RedefinirSenhaPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <Card className="w-full max-w-md">
        <CardContent className="p-8 space-y-6">
          <Logo size="md" variant="light" />
          <Suspense fallback={<div className="flex justify-center py-6"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>}>
            <Inner />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  )
}
