"use client"

import { useCallback, useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { CreditCard, Plus, Loader2, AlertTriangle, RefreshCw, DollarSign, TrendingUp } from "lucide-react"

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
  const [valor, setValor] = useState(String(asn.valorMensal))
  const [referencia, setReferencia] = useState(new Date().toISOString().slice(0, 7))
  const [metodo, setMetodo] = useState("pix")
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [ok, setOk] = useState(false)

  async function salvar() {
    setErro(null)
    const v = parseFloat(valor.replace(",", "."))
    if (isNaN(v) || v <= 0) return setErro("Valor inválido")
    setEnviando(true)
    try {
      const r = await fetch(`/api/admin/assinaturas/${asn.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ valor: v, moeda: asn.moeda, referencia, metodo, pagoEm: new Date().toISOString() }),
      })
      if (!r.ok) return setErro("Erro ao registrar.")
      setOk(true); onSalvo()
      setTimeout(() => { setOpen(false); setOk(false) }, 1500)
    } catch { setErro("Erro de conexão.") }
    finally { setEnviando(false) }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); setErro(null); setOk(false) }}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-1.5 text-xs text-success hover:text-success hover:bg-success/10">
          <DollarSign className="h-3.5 w-3.5" /> Registrar pagamento
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader><DialogTitle>Pagamento — {asn.medicoNome}</DialogTitle></DialogHeader>
        {erro && <p className="text-sm text-destructive">{erro}</p>}
        {ok && <p className="text-sm text-success">Pagamento registrado!</p>}
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>Valor ({asn.moeda})</Label>
            <Input value={valor} onChange={(e) => setValor(e.target.value)} inputMode="decimal" />
          </div>
          <div className="space-y-1.5">
            <Label>Referência (mês)</Label>
            <Input type="month" value={referencia} onChange={(e) => setReferencia(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Método</Label>
            <Select value={metodo} onValueChange={setMetodo}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="pix">Pix</SelectItem>
                <SelectItem value="transferencia">Transferência</SelectItem>
                <SelectItem value="cartao">Cartão</SelectItem>
                <SelectItem value="outro">Outro</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button variant="coral" onClick={salvar} disabled={enviando}>
            {enviando ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirmar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function EditarAssinaturaDialog({ asn, onSalvo }: { asn: Assinatura; onSalvo: () => void }) {
  const [open, setOpen] = useState(false)
  const [plano, setPlano] = useState(asn.plano)
  const [valor, setValor] = useState(String(asn.valorMensal))
  const [status, setStatus] = useState(asn.status)
  const [notas, setNotas] = useState(asn.notas ?? "")
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  async function salvar() {
    setErro(null)
    const v = parseFloat(valor.replace(",", "."))
    if (isNaN(v)) return setErro("Valor inválido")
    setEnviando(true)
    try {
      const r = await fetch(`/api/admin/assinaturas/${asn.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plano, valorMensal: v, status, notas: notas || null }),
      })
      if (!r.ok) return setErro("Erro ao atualizar.")
      onSalvo(); setOpen(false)
    } catch { setErro("Erro de conexão.") }
    finally { setEnviando(false) }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); setErro(null) }}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-1.5 text-xs text-muted-foreground hover:text-foreground">
          Editar
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader><DialogTitle>Assinatura — {asn.medicoNome}</DialogTitle></DialogHeader>
        {erro && <p className="text-sm text-destructive">{erro}</p>}
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Plano</Label>
              <Select value={plano} onValueChange={setPlano}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["trial", "starter", "pro", "enterprise"].map((p) => (
                    <SelectItem key={p} value={p}>{p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["trial", "ativa", "suspensa", "cancelada"].map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Valor mensal (BRL)</Label>
            <Input value={valor} onChange={(e) => setValor(e.target.value)} inputMode="decimal" />
          </div>
          <div className="space-y-1.5">
            <Label>Notas (opcional)</Label>
            <Input value={notas} onChange={(e) => setNotas(e.target.value)} placeholder="Observações internas" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button variant="coral" onClick={salvar} disabled={enviando}>
            {enviando ? <Loader2 className="h-4 w-4 animate-spin" /> : "Salvar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function NovaAssinaturaDialog({ onCriado }: { onCriado: () => void }) {
  const [open, setOpen] = useState(false)
  const [nome, setNome] = useState("")
  const [email, setEmail] = useState("")
  const [crm, setCrm] = useState("")
  const [plano, setPlano] = useState("trial")
  const [valor, setValor] = useState("0")
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [ok, setOk] = useState(false)
  const [ativarUrl, setAtivarUrl] = useState<string | null>(null)

  function reset() { setNome(""); setEmail(""); setCrm(""); setPlano("trial"); setValor("0"); setErro(null); setOk(false); setAtivarUrl(null) }

  async function submeter(e: React.FormEvent) {
    e.preventDefault(); setErro(null)
    if (!nome.trim()) return setErro("Informe o nome do médico")
    if (!email.trim()) return setErro("Informe o e-mail")
    if (!crm.trim()) return setErro("Informe o CRM")
    const v = parseFloat(valor.replace(",", "."))
    if (isNaN(v)) return setErro("Valor inválido")
    setEnviando(true)
    try {
      const r = await fetch("/api/admin/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome, email, crm, plano, valorMensal: v }),
      })
      const d = await r.json().catch(() => ({}))
      if (!r.ok) return setErro(d?.error === "email_em_uso" ? "E-mail já cadastrado." : "Erro ao criar convite.")
      setOk(true)
      if (!d?.emailEnviado && d?.ativarContaUrl) setAtivarUrl(d.ativarContaUrl)
      onCriado()
    } catch { setErro("Erro de conexão.") }
    finally { setEnviando(false) }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) reset() }}>
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
          <form onSubmit={submeter} className="space-y-3">
            {erro && <div className="flex items-start gap-2 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive"><AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" /> {erro}</div>}
            <div className="space-y-1.5"><Label>Nome completo</Label><Input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Dr. João Silva" required /></div>
            <div className="space-y-1.5"><Label>E-mail</Label><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="joao@clinica.com" required /></div>
            <div className="space-y-1.5"><Label>CRM</Label><Input value={crm} onChange={(e) => setCrm(e.target.value)} placeholder="CRM/SP 123456" required /></div>
            <div className="space-y-1.5">
              <Label>Plano</Label>
              <Select value={plano} onValueChange={setPlano}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{["trial","starter","pro","enterprise"].map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5"><Label>Valor mensal (BRL)</Label><Input value={valor} onChange={(e) => setValor(e.target.value)} inputMode="decimal" /></div>
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
    const r = await fetch("/api/admin/assinaturas")
    if (r.ok) setAssinaturas(await r.json())
    setLoading(false)
  }, [])

  useEffect(() => { carregar() }, [carregar])

  const mrr = assinaturas.filter((a) => a.status === "ativa").reduce((s, a) => s + a.valorMensal, 0)
  const receitaTotal = assinaturas.reduce((s, a) => s + a.totalPago, 0)

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
                    <Badge className={`border font-mono text-[10px] uppercase ${PLANO_COR[a.plano] ?? ""}`}>{a.plano}</Badge>
                  </td>
                  <td className="px-5 py-3 text-foreground">
                    R$ {a.valorMensal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-5 py-3">
                    <span className={`text-xs font-medium ${STATUS_COR[a.status] ?? ""}`}>{a.status}</span>
                  </td>
                  <td className="px-5 py-3 text-foreground">
                    R$ {a.totalPago.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    {a.pagamentosConfirmados > 0 && (
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
