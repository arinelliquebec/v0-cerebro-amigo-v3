"use client"

import { useCallback, useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { CreditCard, Plus, Loader2, AlertTriangle, RefreshCw, DollarSign, TrendingUp } from "lucide-react"
import { cpfMask, cpfValido, cpfDigits } from "@/lib/cpf"
import { crmMask, crmValido } from "@/lib/crm"

// Máscara de moeda BRL
function moedaBrlMask(valor: string): string {
  // Remove tudo que não é dígito
  const digits = valor.replace(/\D/g, "")
  // Converte para centavos
  const cents = parseInt(digits || "0", 10)
  // Formata como BRL
  const reais = Math.floor(cents / 100)
  const centavos = cents % 100
  return `${reais.toLocaleString("pt-BR")},${centavos.toString().padStart(2, "0")}`
}

// Converte valor mascarado BRL para número
function parseBrl(valor: string): number {
  const clean = valor.replace(/\./g, "").replace(",", ".")
  return parseFloat(clean) || 0
}

// Schemas Zod para validação
const pagamentoSchema = z.object({
  valor: z.string().min(1, "Valor é obrigatório").refine((v) => {
    const num = parseFloat(v.replace(",", "."))
    return !isNaN(num) && num > 0
  }, "Valor deve ser maior que zero"),
  referencia: z.string().min(1, "Mês de referência é obrigatório"),
  metodo: z.enum(["pix", "transferencia", "cartao", "outro"]),
})

const editarAssinaturaSchema = z.object({
  plano: z.enum(["trial", "starter", "pro", "enterprise"]),
  valor: z.string().min(1, "Valor é obrigatório").refine((v) => {
    const num = parseFloat(v.replace(",", "."))
    return !isNaN(num)
  }, "Valor inválido"),
  status: z.enum(["trial", "ativa", "suspensa", "cancelada"]),
  notas: z.string().optional(),
})

const novaAssinaturaSchema = z.object({
  nome: z.string().min(3, "Nome deve ter pelo menos 3 caracteres").max(100, "Nome muito longo"),
  email: z.string().min(1, "E-mail é obrigatório").email("E-mail inválido"),
  crm: z.string().min(1, "CRM é obrigatório").refine((v) => crmValido(v), "CRM inválido (4-10 caracteres alfanuméricos)"),
  crmUf: z.string().length(2, "UF deve ter 2 caracteres").regex(/^[A-Z]{2}$/, "UF inválida"),
  cpf: z.string().refine((v) => {
    if (!v) return true
    return cpfValido(v)
  }, "CPF inválido").optional().or(z.literal("")),
  plano: z.enum(["trial", "starter", "pro", "enterprise"]),
  valor: z.string().min(1, "Valor é obrigatório").refine((v) => {
    const num = parseBrl(v)
    return num > 0
  }, "Valor deve ser maior que zero"),
})

type PagamentoFormData = z.infer<typeof pagamentoSchema>
type EditarAssinaturaFormData = z.infer<typeof editarAssinaturaSchema>
type NovaAssinaturaFormData = z.infer<typeof novaAssinaturaSchema>

interface Assinatura {
  id: string
  plano: string
  valorMensal: number
  moeda: string
  status: string
  trialAte: string | null
  inicioEm: string
  canceladoEm: string | null
  notas: string | null
  medicoId: string
  medicoNome: string | null
  crm: string | null
  medicoEmail: string | null
  totalPago: number
  pagamentosConfirmados: number
}

const PLANO_COR: Record<string, string> = {
  trial: "bg-warning/15 text-warning border-warning/30",
  starter: "bg-muted/50 text-muted-foreground border-border",
  pro: "bg-primary/15 text-primary border-primary/30",
  enterprise: "bg-accent/15 text-accent border-accent/30",
}
const STATUS_COR: Record<string, string> = {
  trial: "text-warning",
  ativa: "text-success",
  suspensa: "text-destructive",
  cancelada: "text-muted-foreground",
}

function PagamentoDialog({ asn, onSalvo }: { asn: Assinatura; onSalvo: () => void }) {
  const [open, setOpen] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [ok, setOk] = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
    reset,
  } = useForm<PagamentoFormData>({
    resolver: zodResolver(pagamentoSchema),
    defaultValues: {
      valor: String(asn.valorMensal),
      referencia: new Date().toISOString().slice(0, 7),
      metodo: "pix",
    },
  })

  const metodo = watch("metodo")

  async function salvar(data: PagamentoFormData) {
    setErro(null)
    const v = parseFloat(data.valor.replace(",", "."))
    setEnviando(true)
    try {
      const r = await fetch(`/api/admin/assinaturas/${asn.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ valor: v, moeda: asn.moeda, referencia: data.referencia, metodo: data.metodo, pagoEm: new Date().toISOString() }),
      })
      if (!r.ok) return setErro("Erro ao registrar.")
      setOk(true); onSalvo()
      setTimeout(() => { setOpen(false); setOk(false); reset() }, 1500)
    } catch { setErro("Erro de conexão.") }
    finally { setEnviando(false) }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) { setErro(null); setOk(false); reset() } }}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-1.5 text-xs text-success hover:text-success hover:bg-success/10">
          <DollarSign className="h-3.5 w-3.5" /> Registrar pagamento
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader><DialogTitle>Pagamento — {asn.medicoNome}</DialogTitle></DialogHeader>
        {erro && <p className="text-sm text-destructive">{erro}</p>}
        {ok && <p className="text-sm text-success">Pagamento registrado!</p>}
        <form onSubmit={handleSubmit(salvar)} className="space-y-3">
          <div className="space-y-1.5">
            <Label>Valor ({asn.moeda})</Label>
            <Input {...register("valor")} inputMode="decimal" />
            {errors.valor && <p className="text-xs text-destructive">{errors.valor.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label>Referência (mês)</Label>
            <Input type="month" {...register("referencia")} />
            {errors.referencia && <p className="text-xs text-destructive">{errors.referencia.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label>Método</Label>
            <Select value={metodo} onValueChange={(v) => setValue("metodo", v as any)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="pix">Pix</SelectItem>
                <SelectItem value="transferencia">Transferência</SelectItem>
                <SelectItem value="cartao">Cartão</SelectItem>
                <SelectItem value="outro">Outro</SelectItem>
              </SelectContent>
            </Select>
            {errors.metodo && <p className="text-xs text-destructive">{errors.metodo.message}</p>}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button type="submit" variant="coral" disabled={enviando}>
              {enviando ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirmar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function EditarAssinaturaDialog({ asn, onSalvo }: { asn: Assinatura; onSalvo: () => void }) {
  const [open, setOpen] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
    reset,
  } = useForm<EditarAssinaturaFormData>({
    resolver: zodResolver(editarAssinaturaSchema),
    defaultValues: {
      plano: asn.plano as any,
      valor: String(asn.valorMensal),
      status: asn.status as any,
      notas: asn.notas ?? "",
    },
  })

  const plano = watch("plano")
  const status = watch("status")

  async function salvar(data: EditarAssinaturaFormData) {
    setErro(null)
    const v = parseFloat(data.valor.replace(",", "."))
    setEnviando(true)
    try {
      const r = await fetch(`/api/admin/assinaturas/${asn.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plano: data.plano, valorMensal: v, status: data.status, notas: data.notas || null }),
      })
      if (!r.ok) return setErro("Erro ao atualizar.")
      onSalvo(); setOpen(false)
    } catch { setErro("Erro de conexão.") }
    finally { setEnviando(false) }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) { setErro(null); reset() } }}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-1.5 text-xs text-muted-foreground hover:text-foreground">
          Editar
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader><DialogTitle>Assinatura — {asn.medicoNome}</DialogTitle></DialogHeader>
        {erro && <p className="text-sm text-destructive">{erro}</p>}
        <form onSubmit={handleSubmit(salvar)} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Plano</Label>
              <Select value={plano} onValueChange={(v) => setValue("plano", v as any)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["trial", "starter", "pro", "enterprise"].map((p) => (
                    <SelectItem key={p} value={p}>{p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.plano && <p className="text-xs text-destructive">{errors.plano.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={status} onValueChange={(v) => setValue("status", v as any)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["trial", "ativa", "suspensa", "cancelada"].map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.status && <p className="text-xs text-destructive">{errors.status.message}</p>}
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Valor mensal (BRL)</Label>
            <Input {...register("valor")} inputMode="decimal" />
            {errors.valor && <p className="text-xs text-destructive">{errors.valor.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label>Notas (opcional)</Label>
            <Input {...register("notas")} placeholder="Observações internas" />
            {errors.notas && <p className="text-xs text-destructive">{errors.notas.message}</p>}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button type="submit" variant="coral" disabled={enviando}>
              {enviando ? <Loader2 className="h-4 w-4 animate-spin" /> : "Salvar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function NovaAssinaturaDialog({ onCriado }: { onCriado: () => void }) {
  const [open, setOpen] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [ok, setOk] = useState(false)
  const [ativarUrl, setAtivarUrl] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
    reset,
    setError,
  } = useForm<NovaAssinaturaFormData>({
    resolver: zodResolver(novaAssinaturaSchema),
    defaultValues: {
      nome: "",
      email: "",
      crm: "",
      crmUf: "",
      cpf: "",
      plano: "trial",
      valor: "0",
    },
  })

  const cpfValue = watch("cpf")
  const crmUfValue = watch("crmUf")
  const planoValue = watch("plano")
  const valorValue = watch("valor")

  function handleReset() {
    reset()
    setErro(null)
    setOk(false)
    setAtivarUrl(null)
  }

  async function submeter(data: NovaAssinaturaFormData) {
    setErro(null)
    const v = parseFloat(data.valor.replace(",", "."))
    setEnviando(true)
    try {
      const r = await fetch("/api/admin/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome: data.nome, email: data.email, crm: data.crm, crmUf: data.crmUf, cpf: cpfDigits(data.cpf || ""), plano: data.plano, valorMensal: v }),
      })
      const d = await r.json().catch(() => ({}))
      if (!r.ok) {
        if (d?.error === "email_em_uso") {
          setError("email", { message: "E-mail já cadastrado" })
          setErro("E-mail já cadastrado.")
        } else if (d?.error === "crm_invalido") {
          const sit = d?.situacao ? ` (situação: ${d.situacao})` : ""
          setError("crm", { message: `CRM não encontrado no CFM ou inativo${sit}. Confira número e UF.` })
          setErro(`CRM não encontrado no CFM ou inativo${sit}. Confira número e UF.`)
        } else if (d?.error === "cfm_indisponivel") {
          setErro("Não foi possível validar o CRM agora (CFM indisponível). Tente novamente em instantes.")
        } else if (d?.error === "crm_uf_obrigatorio") {
          setError("crmUf", { message: "UF é obrigatória para validar o CRM" })
          setErro("UF do CRM é obrigatória.")
        } else {
          setErro("Erro ao criar convite.")
        }
        setEnviando(false)
        return
      }
      setOk(true)
      if (!d?.emailEnviado && d?.ativarContaUrl) setAtivarUrl(d.ativarContaUrl)
      onCriado()
    } catch { setErro("Erro de conexão.") }
    finally { setEnviando(false) }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) handleReset() }}>
      <DialogTrigger asChild>
        <Button variant="coral" className="gap-2"><Plus className="h-4 w-4" /> Convidar médico</Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Convidar médico</DialogTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Cria a conta e envia e-mail para o médico criar a senha.
          </p>
        </DialogHeader>
        {ok ? (
          <div className="py-4 space-y-3">
            <p className="text-success font-medium text-center">
              {ativarUrl ? "Conta criada!" : "Convite enviado!"}
            </p>
            {ativarUrl ? (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  E-mail não enviado (domínio não verificado no Resend). Copie o link e envie manualmente ao médico — válido por 24h.
                </p>
                <div className="flex gap-2">
                  <input
                    readOnly
                    value={ativarUrl}
                    className="flex-1 rounded-lg border border-border bg-muted/40 px-2.5 py-1.5 text-xs font-mono text-foreground truncate"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => navigator.clipboard?.writeText(ativarUrl)}
                    className="shrink-0 text-xs"
                  >
                    Copiar
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center">O médico receberá um e-mail com link válido por 24h para criar a senha.</p>
            )}
            <DialogFooter className="pt-2">
              <Button variant="outline" onClick={() => { setOpen(false) }}>Fechar</Button>
            </DialogFooter>
          </div>
        ) : (
          <form onSubmit={handleSubmit(submeter)} className="space-y-3">
            {erro && <div className="flex items-start gap-2 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive"><AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" /> {erro}</div>}
            <div className="space-y-1.5">
              <Label>Nome completo</Label>
              <Input {...register("nome")} placeholder="Dr. João Silva" />
              {errors.nome && <p className="text-xs text-destructive">{errors.nome.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>E-mail</Label>
              <Input type="email" {...register("email")} placeholder="joao@clinica.com" />
              {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="col-span-2 space-y-1.5">
                <Label>CRM (número)</Label>
                <Input
                  value={watch("crm")}
                  onChange={(e) => setValue("crm", crmMask(e.target.value))}
                  placeholder="123456"
                  maxLength={10}
                  className={errors.crm ? "border-destructive" : ""}
                />
                {errors.crm && <p className="text-xs text-destructive">{errors.crm.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>UF</Label>
                <Select value={crmUfValue} onValueChange={(v) => setValue("crmUf", v)}>
                  <SelectTrigger><SelectValue placeholder="UF" /></SelectTrigger>
                  <SelectContent>
                    {["AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"].map((uf) => (
                      <SelectItem key={uf} value={uf}>{uf}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.crmUf && <p className="text-xs text-destructive">{errors.crmUf.message}</p>}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>CPF do médico</Label>
              <Input
                value={cpfValue}
                onChange={(e) => setValue("cpf", cpfMask(e.target.value))}
                placeholder="000.000.000-00"
                inputMode="numeric"
                maxLength={14}
                className={errors.cpf ? "border-destructive" : ""}
              />
              {errors.cpf && <p className="text-xs text-destructive">{errors.cpf.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Plano</Label>
              <Select value={planoValue} onValueChange={(v) => setValue("plano", v as any)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{["trial","starter","pro","enterprise"].map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
              </Select>
              {errors.plano && <p className="text-xs text-destructive">{errors.plano.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Valor mensal (BRL)</Label>
              <Input
                value={valorValue}
                onChange={(e) => setValue("valor", moedaBrlMask(e.target.value))}
                placeholder="0,00"
                inputMode="numeric"
                className={errors.valor ? "border-destructive" : ""}
              />
              {errors.valor && <p className="text-xs text-destructive">{errors.valor.message}</p>}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button type="submit" variant="coral" disabled={enviando}>
                {enviando ? <Loader2 className="h-4 w-4 animate-spin" /> : "Enviar convite"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}

export default function FinanceiroPage() {
  const [assinaturas, setAssinaturas] = useState<Assinatura[]>([])
  const [loading, setLoading] = useState(true)

  const carregar = useCallback(async () => {
    try {
      const r = await fetch("/api/admin/assinaturas")
      const data = await r.json()
      if (Array.isArray(data)) setAssinaturas(data)
      else setAssinaturas([])
    } catch {
      setAssinaturas([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { carregar() }, [carregar])

  const mrr = assinaturas.filter((a) => a.status === "ativa").reduce((s, a) => s + (a.valorMensal ?? 0), 0)
  const receitaTotal = assinaturas.reduce((s, a) => s + (a.totalPago ?? 0), 0)

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1"><CreditCard className="h-5 w-5 text-primary" /><p className="font-mono text-xs uppercase tracking-widest text-primary">Billing</p></div>
          <h1 className="text-2xl font-semibold text-foreground">Financeiro</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Gestão manual de assinaturas (pré-Stripe)</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="glass" size="sm" onClick={carregar} className="gap-1.5"><RefreshCw className="h-4 w-4" /> Atualizar</Button>
          <NovaAssinaturaDialog onCriado={carregar} />
        </div>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "MRR", value: `R$ ${mrr.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`, icon: TrendingUp, cls: "text-accent" },
          { label: "Receita total", value: `R$ ${receitaTotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`, icon: DollarSign, cls: "text-success" },
          { label: "Assinaturas", value: String(assinaturas.length), icon: CreditCard, cls: "text-primary" },
        ].map((k) => (
          <div key={k.label} className="rounded-2xl border border-noir-line bg-noir-surface p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">{k.label}</p>
              <k.icon className={`h-4 w-4 ${k.cls}`} />
            </div>
            <p className="text-2xl font-bold text-foreground">{k.value}</p>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16 text-muted-foreground"><Loader2 className="h-6 w-6 animate-spin" /></div>
      ) : (
        <div className="rounded-2xl border border-noir-line bg-noir-surface overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-noir-line bg-noir-surface-raised">
                {["Médico", "E-mail", "Plano", "Valor/mês", "Status", "Total pago", "Ações"].map((h) => (
                  <th key={h} className="px-5 py-3 text-left font-mono text-[10px] uppercase tracking-wider text-muted-foreground">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-noir-line">
              {assinaturas.map((a) => (
                <tr key={a.id} className="hover:bg-noir-surface-raised/40 transition-colors">
                  <td className="px-5 py-3 font-medium text-foreground">{a.medicoNome ?? "—"}</td>
                  <td className="px-5 py-3 text-muted-foreground text-xs">{a.medicoEmail ?? "—"}</td>
                  <td className="px-5 py-3">
                    <Badge className={`border font-mono text-[10px] uppercase ${PLANO_COR[a.plano ?? ""] ?? ""}`}>{a.plano ?? "—"}</Badge>
                  </td>
                  <td className="px-5 py-3 text-foreground">
                    R$ {(a.valorMensal ?? 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-5 py-3">
                    <span className={`text-xs font-medium ${STATUS_COR[a.status ?? ""] ?? ""}`}>{a.status ?? "—"}</span>
                  </td>
                  <td className="px-5 py-3 text-foreground">
                    R$ {(a.totalPago ?? 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    {(a.pagamentosConfirmados ?? 0) > 0 && (
                      <span className="ml-1.5 text-[10px] text-muted-foreground">({a.pagamentosConfirmados}x)</span>
                    )}
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-1 flex-wrap">
                      <PagamentoDialog asn={a} onSalvo={carregar} />
                      <EditarAssinaturaDialog asn={a} onSalvo={carregar} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
