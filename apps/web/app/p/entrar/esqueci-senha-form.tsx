"use client"

import { useActionState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AlertCircle, ArrowLeft, CheckCircle2, Loader2, Mail } from "lucide-react"
import { esqueciSenha, type EsqueciSenhaState } from "./actions"

const inicial: EsqueciSenhaState = { ok: false, msg: null }

/** Fluxo "Esqueci minha senha" do paciente. Pede o e-mail e dispara o envio do
 *  link de recuperação. Resposta sempre neutra (anti-enumeração): nunca diz se o
 *  e-mail existe. */
export function EsqueciSenhaForm({ onVoltar }: { onVoltar: () => void }) {
  const [state, action, pending] = useActionState(esqueciSenha, inicial)

  if (state.ok) {
    return (
      <div className="space-y-4">
        <div className="flex items-start gap-2 rounded-lg border border-success/30 bg-success/10 px-3 py-2 text-sm text-foreground">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
          <span>{state.msg}</span>
        </div>
        <Button type="button" variant="ghost" className="w-full gap-2" onClick={onVoltar}>
          <ArrowLeft className="h-4 w-4" />
          Voltar ao login
        </Button>
      </div>
    )
  }

  return (
    <form action={action} className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Informe o e-mail do seu acesso. Enviaremos um link para você criar uma nova senha.
      </p>

      {state.msg && (
        <div className="flex items-start gap-2 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{state.msg}</span>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="email-reset">E-mail</Label>
        <Input
          id="email-reset"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="seu@email.com"
          required
        />
      </div>

      <Button
        type="submit"
        disabled={pending}
        className="w-full gap-2 bg-primary hover:bg-purple-dark text-primary-foreground"
      >
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
        Enviar link de recuperação
      </Button>

      <Button type="button" variant="ghost" className="w-full gap-2" onClick={onVoltar}>
        <ArrowLeft className="h-4 w-4" />
        Voltar ao login
      </Button>
    </form>
  )
}
