"use client"

// ADR-066 Fase 4 — recuperação de senha (público). Resposta sempre genérica
// (anti-enumeração): não revela se o e-mail existe.

import { useState } from "react"
import Link from "next/link"
import { Logo } from "@/components/logo"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Loader2, MailCheck } from "lucide-react"

export default function EsqueciSenhaPage() {
  const [email, setEmail] = useState("")
  const [enviando, setEnviando] = useState(false)
  const [enviado, setEnviado] = useState(false)

  async function enviar(e: React.FormEvent) {
    e.preventDefault()
    setEnviando(true)
    try {
      await fetch("/api/esqueci-senha", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      })
    } catch { /* mensagem genérica de qualquer forma */ }
    finally { setEnviando(false); setEnviado(true) }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <Card className="w-full max-w-md">
        <CardContent className="p-8 space-y-6">
          <Logo size="md" variant="light" />
          {enviado ? (
            <div className="space-y-3 text-center">
              <MailCheck className="mx-auto h-10 w-10 text-success" />
              <h1 className="text-lg font-semibold text-foreground">Verifique seu e-mail</h1>
              <p className="text-sm text-muted-foreground">
                Se houver uma conta com esse e-mail, enviamos um link para redefinir a senha.
                O link vale por 1 hora.
              </p>
              <Link href="/login" className="inline-block text-sm underline underline-offset-2 hover:text-foreground">Voltar ao login</Link>
            </div>
          ) : (
            <form onSubmit={enviar} className="space-y-4">
              <div className="space-y-1">
                <h1 className="text-lg font-semibold text-foreground">Recuperar acesso</h1>
                <p className="text-sm text-muted-foreground">Informe seu e-mail e enviaremos um link para criar uma nova senha.</p>
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm">E-mail</Label>
                <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="voce@exemplo.com" autoComplete="email" />
              </div>
              <Button type="submit" className="w-full" disabled={enviando || !email.trim()}>
                {enviando ? <Loader2 className="h-4 w-4 animate-spin" /> : "Enviar link de recuperação"}
              </Button>
              <p className="text-center text-sm text-muted-foreground">
                <Link href="/login" className="underline underline-offset-2 hover:text-foreground">Voltar ao login</Link>
              </p>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
