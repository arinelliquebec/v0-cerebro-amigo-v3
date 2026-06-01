"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Plus,
  Loader2,
  AlertTriangle,
  MailCheck,
  KeyRound,
  Copy,
  Check,
} from "lucide-react"

interface ResultadoCriacao {
  pacienteId: string
  modo: "magic_link" | "senha_provisoria"
  emailEnviado: boolean
  emailErro: string | null
  magicLinkUrl: string | null
  senhaProvisoria: string | null
}

function CampoCopiavel({ valor }: { valor: string }) {
  const [copiado, setCopiado] = useState(false)
  return (
    <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/40 p-2">
      <code className="flex-1 truncate text-xs text-navy">{valor}</code>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-7 w-7 shrink-0"
        onClick={() => {
          navigator.clipboard?.writeText(valor)
          setCopiado(true)
          setTimeout(() => setCopiado(false), 1500)
        }}
      >
        {copiado ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
      </Button>
    </div>
  )
}

export function NovoPacienteDialog({ onConcluido }: { onConcluido: () => void }) {
  const [aberto, setAberto] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [resultado, setResultado] = useState<ResultadoCriacao | null>(null)

  // form
  const [nome, setNome] = useState("")
  const [email, setEmail] = useState("")
  const [whatsapp, setWhatsapp] = useState("")
  const [cpf, setCpf] = useState("")
  const [nascimento, setNascimento] = useState("")
  const [usarSenha, setUsarSenha] = useState(false)
  const [senha, setSenha] = useState("")

  function reset() {
    setEnviando(false)
    setErro(null)
    setResultado(null)
    setNome("")
    setEmail("")
    setWhatsapp("")
    setCpf("")
    setNascimento("")
    setUsarSenha(false)
    setSenha("")
  }

  async function submeter(e: React.FormEvent) {
    e.preventDefault()
    setErro(null)

    const digitos = whatsapp.replace(/\D/g, "")
    if (!nome.trim() || !email.trim()) return setErro("Nome e e-mail são obrigatórios.")
    if (digitos.length < 10 || digitos.length > 15)
      return setErro("WhatsApp precisa ter 10–15 dígitos (com DDD).")
    if (usarSenha && senha.length < 6)
      return setErro("Senha provisória precisa ter ao menos 6 caracteres.")

    setEnviando(true)
    try {
      const r = await fetch("/api/pacientes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome: nome.trim(),
          email: email.trim(),
          waId: digitos,
          cpf: cpf.replace(/\D/g, "") || null,
          dataNascimento: nascimento || null,
          senhaInicial: usarSenha ? senha : null,
        }),
      })
      const data = await r.json().catch(() => null)
      if (!r.ok) {
        setErro(data?.error ?? "Não foi possível cadastrar o paciente.")
        return
      }
      setResultado(data as ResultadoCriacao)
      onConcluido()
    } catch {
      setErro("Erro de conexão. Tente novamente.")
    } finally {
      setEnviando(false)
    }
  }

  return (
    <Dialog
      open={aberto}
      onOpenChange={(o) => {
        setAberto(o)
        if (!o) reset()
      }}
    >
      <DialogTrigger asChild>
        <Button className="bg-primary hover:bg-purple-dark text-white gap-2">
          <Plus className="h-4 w-4" />
          Novo Paciente
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-navy">Novo paciente</DialogTitle>
          <DialogDescription>
            Cadastre o paciente e envie o convite de acesso ao portal.
          </DialogDescription>
        </DialogHeader>

        {/* ── Resultado ── */}
        {resultado ? (
          <div className="space-y-4">
            {resultado.modo === "magic_link" ? (
              resultado.emailEnviado ? (
                <div className="flex items-start gap-3 rounded-lg bg-success/10 p-3">
                  <MailCheck className="mt-0.5 h-5 w-5 shrink-0 text-success" />
                  <div className="text-sm">
                    <p className="font-medium text-navy">Convite enviado</p>
                    <p className="text-muted-foreground">
                      O paciente recebeu um e-mail com o link para criar a senha (válido por 24h).
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-start gap-2 rounded-lg bg-warning/10 p-3 text-sm text-warning">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>Não foi possível enviar o e-mail. Copie e envie o link manualmente:</span>
                  </div>
                  {resultado.magicLinkUrl && <CampoCopiavel valor={resultado.magicLinkUrl} />}
                </div>
              )
            ) : (
              <div className="space-y-2">
                <div className="flex items-start gap-3 rounded-lg bg-secondary/60 p-3">
                  <KeyRound className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                  <div className="text-sm">
                    <p className="font-medium text-navy">Senha provisória criada</p>
                    <p className="text-muted-foreground">
                      Entregue ao paciente. Ele troca no primeiro acesso ao portal.
                    </p>
                  </div>
                </div>
                {resultado.senhaProvisoria && <CampoCopiavel valor={resultado.senhaProvisoria} />}
              </div>
            )}
            <DialogFooter>
              <Button
                className="bg-primary hover:bg-purple-dark text-white"
                onClick={() => setAberto(false)}
              >
                Concluir
              </Button>
            </DialogFooter>
          </div>
        ) : (
          /* ── Formulário ── */
          <form onSubmit={submeter} className="space-y-4">
            {erro && (
              <div className="flex items-start gap-2 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{erro}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="np-nome">Nome completo</Label>
                <Input id="np-nome" value={nome} onChange={(e) => setNome(e.target.value)} required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="np-email">E-mail</Label>
                <Input id="np-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="np-wa">WhatsApp (com DDD)</Label>
                <Input id="np-wa" inputMode="numeric" placeholder="11999998888" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="np-cpf">CPF (opcional)</Label>
                <Input id="np-cpf" inputMode="numeric" value={cpf} onChange={(e) => setCpf(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="np-nasc">Nascimento (opcional)</Label>
                <Input id="np-nasc" type="date" value={nascimento} onChange={(e) => setNascimento(e.target.value)} />
              </div>
            </div>

            <div className="flex items-center justify-between rounded-lg border border-border/60 p-3">
              <div className="text-sm">
                <p className="font-medium text-navy">
                  {usarSenha ? "Definir senha provisória" : "Enviar convite por e-mail"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {usarSenha
                    ? "Sem e-mail — você entrega a senha (cadastro em consultório)."
                    : "Magic link de 24h enviado ao paciente para criar a senha."}
                </p>
              </div>
              <Switch checked={usarSenha} onCheckedChange={setUsarSenha} aria-label="Definir senha provisória" />
            </div>

            {usarSenha && (
              <div className="space-y-1.5">
                <Label htmlFor="np-senha">Senha provisória</Label>
                <Input id="np-senha" type="text" value={senha} onChange={(e) => setSenha(e.target.value)} placeholder="Mínimo 6 caracteres" />
              </div>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setAberto(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={enviando} className="bg-primary hover:bg-purple-dark text-white">
                {enviando ? <Loader2 className="h-4 w-4 animate-spin" /> : "Cadastrar"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
