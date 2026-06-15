"use client"

import { Suspense, useCallback, useEffect, useRef, useState } from "react"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Logo } from "@/components/logo"
import { Turnstile } from "@/components/turnstile"
import { CheckCircle2, AlertTriangle, Loader2 } from "lucide-react"

const UFS = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG",
  "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO",
]

const ERRO_MSG: Record<string, string> = {
  campos_obrigatorios: "Preencha todos os campos.",
  crm_uf_obrigatorio: "Selecione a UF do seu CRM.",
  email_em_uso: "Este e-mail já tem cadastro. Tente fazer login.",
  crm_invalido: "CRM não encontrado ou fora de situação regular no CFM.",
  nome_divergente: "O nome informado não confere com o cadastro do seu CRM no CFM.",
  crm_indisponivel: "Não foi possível validar seu CRM agora. Tente novamente em instantes.",
  crm_validacao_nao_configurada: "Validação de CRM indisponível no momento. Tente mais tarde.",
  rate_limited: "Muitas tentativas. Aguarde alguns minutos e tente de novo.",
  captcha_invalido: "Falha na verificação de segurança. Recarregue a página e tente de novo.",
  erro_interno: "Algo deu errado. Tente novamente.",
}

function CadastroForm() {
  const params = useSearchParams()
  const src = params.get("src")
  const rid = params.get("rid")
  const fromCheckup = src === "checkup" && !!rid

  const [nome, setNome] = useState("")
  const [email, setEmail] = useState("")
  const [crm, setCrm] = useState("")
  const [crmUf, setCrmUf] = useState("")
  const [consent, setConsent] = useState(false)
  const [estado, setEstado] = useState<"idle" | "enviando" | "ok" | "erro">("idle")
  const [erro, setErro] = useState<string | null>(null)
  const eventFired = useRef(false)

  // Captcha (ADR-055): só exigido quando há site key (senão, captcha desligado).
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null)
  const handleToken = useCallback((t: string | null) => setTurnstileToken(t), [])

  // doctor_signup_started: 1x ao abrir o form vindo do Check-up (atribuição).
  useEffect(() => {
    if (!fromCheckup || eventFired.current) return
    eventFired.current = true
    fetch("/api/checkup-event", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event: "doctor_signup_started", rid }),
    }).catch(() => {})
  }, [fromCheckup, rid])

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErro(null)
    if (!nome.trim() || !email.trim() || !crm.trim() || !crmUf) {
      setErro(ERRO_MSG.campos_obrigatorios)
      return
    }
    if (!consent) {
      setErro("É necessário concordar com o tratamento dos dados para continuar.")
      return
    }
    if (siteKey && !turnstileToken) {
      setErro("Confirme que você não é um robô antes de continuar.")
      return
    }
    setEstado("enviando")
    try {
      const r = await fetch("/api/medico-signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome: nome.trim(),
          email: email.trim(),
          crm: crm.trim(),
          crmUf,
          src: fromCheckup ? "checkup" : null,
          rid: fromCheckup ? rid : null,
          turnstileToken,
        }),
      })
      if (r.status === 202) {
        setEstado("ok")
        return
      }
      const data = await r.json().catch(() => ({}))
      const code = r.status === 429 ? "rate_limited" : (data?.error ?? "erro_interno")
      setErro(ERRO_MSG[code] ?? data?.mensagem ?? ERRO_MSG.erro_interno)
      setEstado("erro")
    } catch {
      setErro(ERRO_MSG.erro_interno)
      setEstado("erro")
    }
  }

  if (estado === "ok") {
    return (
      <div className="text-center space-y-4">
        <CheckCircle2 className="mx-auto h-12 w-12 text-success" aria-hidden />
        <h1 className="text-2xl font-semibold text-foreground">Confira seu e-mail</h1>
        <p className="text-muted-foreground">
          Enviamos um link para <strong>{email}</strong> para você criar sua senha e ativar o acesso.
          O link vale por 24 horas.
        </p>
        <p className="text-sm text-muted-foreground">
          Não chegou? Verifique o spam ou tente novamente em alguns minutos.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5" noValidate>
      <div className="space-y-1.5 text-center">
        <h1 className="text-2xl font-semibold text-foreground">Cadastro de médico</h1>
        <p className="text-sm text-muted-foreground">
          Validamos seu CRM no CFM. Após o cadastro, enviamos um e-mail para você ativar o acesso.
        </p>
      </div>

      {erro && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive"
        >
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          <span>{erro}</span>
        </div>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="nome">Nome completo</Label>
        <Input id="nome" value={nome} onChange={(e) => setNome(e.target.value)}
          autoComplete="name" placeholder="Como consta no seu CRM" required />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="email">E-mail</Label>
        <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)}
          autoComplete="email" placeholder="voce@exemplo.com" required />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="col-span-2 space-y-1.5">
          <Label htmlFor="crm">CRM</Label>
          <Input id="crm" value={crm} onChange={(e) => setCrm(e.target.value)}
            inputMode="numeric" placeholder="Número do CRM" required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="crmUf">UF</Label>
          <select id="crmUf" value={crmUf} onChange={(e) => setCrmUf(e.target.value)} required
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
            <option value="" disabled>UF</option>
            {UFS.map((uf) => <option key={uf} value={uf}>{uf}</option>)}
          </select>
        </div>
      </div>

      <label className="flex items-start gap-2 text-sm text-muted-foreground">
        <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)}
          className="mt-0.5 h-4 w-4 rounded border-input" />
        <span>
          Concordo com o tratamento dos meus dados profissionais (CRM, nome, e-mail) para
          validação e criação da conta, conforme a LGPD.
        </span>
      </label>

      {siteKey && <Turnstile siteKey={siteKey} onToken={handleToken} />}

      <Button type="submit" className="w-full" disabled={estado === "enviando" || (!!siteKey && !turnstileToken)}>
        {estado === "enviando" && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />}
        {estado === "enviando" ? "Validando CRM…" : "Criar conta"}
      </Button>

      <p className="text-center text-xs text-muted-foreground">
        Já tem conta? <a href="/login" className="underline">Entrar</a>
      </p>
    </form>
  )
}

export default function CadastroMedicoPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-md space-y-8">
        <div className="flex justify-center">
          <Logo />
        </div>
        <div className="rounded-xl border bg-card p-6 shadow-sm sm:p-8">
          <Suspense fallback={<div className="text-center text-sm text-muted-foreground">Carregando…</div>}>
            <CadastroForm />
          </Suspense>
        </div>
      </div>
    </main>
  )
}
