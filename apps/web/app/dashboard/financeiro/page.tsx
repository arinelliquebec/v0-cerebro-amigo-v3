"use client"

import { useCallback, useEffect, useState } from "react"
import { Header } from "@/components/header"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import {
  DollarSign, Clock, AlertTriangle, UserMinus, Plus, Loader2, Copy, Check,
} from "lucide-react"

interface Resumo {
  recebidoMes: number
  pendenteTotal: number
  vencidoTotal: number
  pagasMes: number
  emitidasMes: number
  pacientesInativos: number
}
interface Cobranca {
  id: string
  descricao: string
  valor: number
  status: string
  vencimento: string | null
  pagoEm: string | null
  asaasInvoiceUrl: string | null
  pacienteId: string
  pacienteNome: string | null
}
interface Paciente { id: string; nome?: string | null }

const brl = (v: number) => (v ?? 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })

const statusCfg: Record<string, { label: string; cls: string }> = {
  pago: { label: "Pago", cls: "bg-success/15 text-success" },
  pendente: { label: "Pendente", cls: "bg-warning/15 text-warning" },
  vencido: { label: "Vencido", cls: "bg-coral/15 text-coral" },
  cancelado: { label: "Cancelado", cls: "bg-muted text-muted-foreground" },
  estornado: { label: "Estornado", cls: "bg-muted text-muted-foreground" },
  erro_gateway: { label: "Erro", cls: "bg-coral/15 text-coral" },
}

export default function FinanceiroPage() {
  const [resumo, setResumo] = useState<Resumo | null>(null)
  const [cobrancas, setCobrancas] = useState<Cobranca[]>([])
  const [pacientes, setPacientes] = useState<Paciente[]>([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    const [r, c] = await Promise.all([
      fetch("/api/financeiro/resumo").then((x) => (x.ok ? x.json() : null)).catch(() => null),
      fetch("/api/cobrancas").then((x) => (x.ok ? x.json() : [])).catch(() => []),
    ])
    setResumo(r)
    setCobrancas(Array.isArray(c) ? c : [])
  }, [])

  useEffect(() => {
    Promise.all([
      refresh(),
      fetch("/api/pacientes").then((x) => (x.ok ? x.json() : [])).then((p) =>
        setPacientes(Array.isArray(p) ? p : []),
      ).catch(() => setPacientes([])),
    ]).finally(() => setLoading(false))
  }, [refresh])

  const ticket = resumo && resumo.pagasMes > 0 ? resumo.recebidoMes / resumo.pagasMes : 0
  const conversao = resumo && resumo.emitidasMes > 0 ? Math.round((resumo.pagasMes / resumo.emitidasMes) * 100) : 0

  return (
    <div className="min-h-screen">
      <Header title="Financeiro" subtitle="Cobranças, recebimentos e recuperação de receita" />
      <div className="space-y-8 p-8">
        <div className="flex items-center justify-between">
          <div className="grid flex-1 grid-cols-2 gap-4 lg:grid-cols-4">
            <Stat icon={DollarSign} cor="text-success" label="Recebido no mês" valor={brl(resumo?.recebidoMes ?? 0)} />
            <Stat icon={Clock} cor="text-warning" label="A receber" valor={brl(resumo?.pendenteTotal ?? 0)} />
            <Stat icon={AlertTriangle} cor="text-coral" label="Vencido" valor={brl(resumo?.vencidoTotal ?? 0)} />
            <Stat icon={UserMinus} cor="text-primary" label="Pacientes inativos" valor={String(resumo?.pacientesInativos ?? 0)} sub="sem retorno 90d+" />
          </div>
        </div>

        {resumo && (
          <p className="text-sm text-muted-foreground">
            Ticket médio <span className="font-semibold text-foreground">{brl(ticket)}</span> · Conversão{" "}
            <span className="font-semibold text-foreground">{conversao}%</span> ({resumo.pagasMes}/{resumo.emitidasMes} pagas no mês)
          </p>
        )}

        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">Cobranças</h2>
          <NovaCobrancaDialog pacientes={pacientes} onCriada={refresh} />
        </div>

        {loading ? (
          <div className="flex justify-center py-16 text-muted-foreground"><Loader2 className="h-6 w-6 animate-spin" /></div>
        ) : cobrancas.length === 0 ? (
          <Card className="border-border/60"><CardContent className="py-12 text-center text-sm text-muted-foreground">
            Nenhuma cobrança ainda. Crie a primeira para o seu paciente pagar via Pix.
          </CardContent></Card>
        ) : (
          <div className="overflow-hidden rounded-xl border border-border/60">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-left text-xs text-muted-foreground">
                <tr>
                  <th className="px-4 py-2.5 font-medium">Paciente</th>
                  <th className="px-4 py-2.5 font-medium">Descrição</th>
                  <th className="px-4 py-2.5 font-medium">Valor</th>
                  <th className="px-4 py-2.5 font-medium">Vencimento</th>
                  <th className="px-4 py-2.5 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {cobrancas.map((c) => {
                  const s = statusCfg[c.status] ?? { label: c.status, cls: "bg-muted text-muted-foreground" }
                  return (
                    <tr key={c.id} className="border-t border-border/50">
                      <td className="px-4 py-2.5 text-foreground">{c.pacienteNome ?? "—"}</td>
                      <td className="px-4 py-2.5 text-muted-foreground">{c.descricao}</td>
                      <td className="px-4 py-2.5 font-medium text-foreground">{brl(c.valor)}</td>
                      <td className="px-4 py-2.5 text-muted-foreground">
                        {c.vencimento ? new Date(c.vencimento).toLocaleDateString("pt-BR") : "—"}
                      </td>
                      <td className="px-4 py-2.5">
                        <Badge className={`${s.cls} border-0`}>{s.label}</Badge>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

function Stat({ icon: Icon, cor, label, valor, sub }: { icon: typeof DollarSign; cor: string; label: string; valor: string; sub?: string }) {
  return (
    <Card className="border-border/70">
      <CardContent className="p-4">
        <div className="mb-1 flex items-center gap-2">
          <Icon className={`h-4 w-4 ${cor}`} />
          <span className="text-xs text-muted-foreground">{label}</span>
        </div>
        <p className="text-xl font-semibold text-foreground">{valor}</p>
        {sub && <p className="text-[0.7rem] text-muted-foreground">{sub}</p>}
      </CardContent>
    </Card>
  )
}

function NovaCobrancaDialog({ pacientes, onCriada }: { pacientes: Paciente[]; onCriada: () => void }) {
  const [open, setOpen] = useState(false)
  const [pacienteId, setPacienteId] = useState("")
  const [valor, setValor] = useState("")
  const [descricao, setDescricao] = useState("")
  const [criando, setCriando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [pix, setPix] = useState<{ copiaCola: string | null; url: string | null } | null>(null)
  const [copiado, setCopiado] = useState(false)

  async function criar() {
    setErro(null)
    const v = parseFloat(valor.replace(",", "."))
    if (!pacienteId) return setErro("Selecione o paciente.")
    if (!v || v <= 0) return setErro("Valor inválido.")
    setCriando(true)
    try {
      const r = await fetch("/api/cobrancas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pacienteId, valor: v, descricao: descricao.trim() || "Consulta" }),
      })
      const d = await r.json().catch(() => ({}))
      if (r.status === 503) return setErro("Asaas não configurado no servidor (defina ASAAS_API_KEY).")
      if (!r.ok) return setErro(d?.detalhe || d?.error || "Falha ao criar cobrança.")
      setPix({ copiaCola: d.pixCopiaCola ?? null, url: d.invoiceUrl ?? null })
      onCriada()
    } catch {
      setErro("Erro de conexão.")
    } finally {
      setCriando(false)
    }
  }

  function fechar() {
    setOpen(false)
    setPacienteId(""); setValor(""); setDescricao(""); setErro(null); setPix(null); setCopiado(false)
  }

  return (
    <Dialog open={open} onOpenChange={(o) => (o ? setOpen(true) : fechar())}>
      <DialogTrigger asChild>
        <Button className="gap-2"><Plus className="h-4 w-4" /> Nova cobrança</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Nova cobrança (Pix)</DialogTitle></DialogHeader>

        {pix ? (
          <div className="space-y-3">
            <p className="text-sm text-success">Cobrança criada. Envie o Pix ao paciente:</p>
            {pix.copiaCola && (
              <button
                type="button"
                onClick={async () => { await navigator.clipboard.writeText(pix.copiaCola!); setCopiado(true); setTimeout(() => setCopiado(false), 2000) }}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground"
              >
                {copiado ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />} {copiado ? "Copiado!" : "Copiar Pix copia-e-cola"}
              </button>
            )}
            {pix.url && (
              <a href={pix.url} target="_blank" rel="noopener noreferrer" className="block text-center text-sm text-primary underline">
                Abrir fatura
              </a>
            )}
            <p className="text-xs text-muted-foreground">O paciente também vê esta cobrança no portal (/p/pagamentos).</p>
            <DialogFooter><Button variant="outline" onClick={fechar}>Fechar</Button></DialogFooter>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Paciente</Label>
              <Select value={pacienteId} onValueChange={setPacienteId}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {pacientes.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.nome ?? "Paciente"}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Valor (R$)</Label>
              <Input inputMode="decimal" placeholder="150,00" value={valor} onChange={(e) => setValor(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Descrição</Label>
              <Input placeholder="Consulta psiquiátrica" value={descricao} onChange={(e) => setDescricao(e.target.value)} />
            </div>
            {erro && <p className="text-sm text-destructive">{erro}</p>}
            <DialogFooter>
              <Button onClick={criar} disabled={criando} className="gap-2">
                {criando && <Loader2 className="h-4 w-4 animate-spin" />} Gerar Pix
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
