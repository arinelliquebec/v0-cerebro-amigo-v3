"use client"

import { useActionState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AlertCircle, Loader2, ShieldCheck } from "lucide-react"
import { trocarSenha, type PacienteAuthState } from "../entrar/actions"

const inicial: PacienteAuthState = { error: null }

export default function TrocarSenhaPage() {
  const [state, action, pending] = useActionState(trocarSenha, inicial)

  return (
    <div className="p-4 pt-8 space-y-6">
      <div className="space-y-1">
        <div className="flex items-center gap-2 text-primary">
          <ShieldCheck className="h-5 w-5" />
          <h1 className="text-lg font-semibold text-navy">Defina uma nova senha</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Você está usando uma senha provisória. Crie uma senha pessoal para continuar.
        </p>
      </div>

      <form action={action} className="space-y-4">
        {state.error && (
          <div className="flex items-start gap-2 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{state.error}</span>
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="senhaAtual">Senha atual (provisória)</Label>
          <Input id="senhaAtual" name="senhaAtual" type="password" autoComplete="current-password" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="novaSenha">Nova senha</Label>
          <Input id="novaSenha" name="novaSenha" type="password" autoComplete="new-password" placeholder="Mínimo 8 caracteres" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirmar">Confirme a nova senha</Label>
          <Input id="confirmar" name="confirmar" type="password" autoComplete="new-password" required />
        </div>

        <Button type="submit" disabled={pending} className="w-full bg-primary hover:bg-purple-dark text-white">
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Salvar nova senha"}
        </Button>
      </form>
    </div>
  )
}
