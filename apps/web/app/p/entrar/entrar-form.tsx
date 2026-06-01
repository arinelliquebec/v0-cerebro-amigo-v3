"use client"

import { useActionState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AlertCircle, Loader2, KeyRound, Mail } from "lucide-react"
import { entrarComLink, entrarComSenha, type PacienteAuthState } from "./actions"

const inicial: PacienteAuthState = { error: null }

export function EntrarForm({ token, next }: { token?: string; next: string }) {
  const modoConvite = Boolean(token)
  const [state, action, pending] = useActionState(
    modoConvite ? entrarComLink : entrarComSenha,
    inicial,
  )

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="next" value={next} />
      {token && <input type="hidden" name="token" value={token} />}

      {state.error && (
        <div className="flex items-start gap-2 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{state.error}</span>
        </div>
      )}

      {modoConvite ? (
        <>
          <p className="text-sm text-muted-foreground">
            Bem-vindo(a)! Crie uma senha para acessar seu acompanhamento.
          </p>
          <div className="space-y-2">
            <Label htmlFor="novaSenha">Crie sua senha</Label>
            <Input
              id="novaSenha"
              name="novaSenha"
              type="password"
              autoComplete="new-password"
              placeholder="Mínimo 8 caracteres"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmar">Confirme a senha</Label>
            <Input
              id="confirmar"
              name="confirmar"
              type="password"
              autoComplete="new-password"
              placeholder="Repita a senha"
              required
            />
          </div>
        </>
      ) : (
        <>
          <div className="space-y-2">
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="seu@email.com"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="senha">Senha</Label>
            <Input
              id="senha"
              name="senha"
              type="password"
              autoComplete="current-password"
              placeholder="Sua senha"
              required
            />
          </div>
        </>
      )}

      <Button
        type="submit"
        disabled={pending}
        className="w-full bg-primary hover:bg-purple-dark text-white"
      >
        {pending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : modoConvite ? (
          <>
            <KeyRound className="mr-2 h-4 w-4" />
            Criar senha e entrar
          </>
        ) : (
          <>
            <Mail className="mr-2 h-4 w-4" />
            Entrar
          </>
        )}
      </Button>

      {!modoConvite && (
        <p className="text-center text-xs text-muted-foreground">
          Recebeu um convite por e-mail? Abra o link da mensagem para criar sua senha.
        </p>
      )}
    </form>
  )
}
