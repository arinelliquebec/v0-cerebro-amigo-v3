"use client"

// Portal do cliente (Fluxo A, ADR-034): o médico vê o próprio plano, status,
// link p/ pagar (invoiceUrl do Asaas) e o histórico. (Fluxo B médico→paciente
// segue estacionado — esta página agora é a assinatura DO médico na plataforma.)

import { useEffect, useState } from "react"
import { Header } from "@/components/header"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Loader2, CreditCard, ExternalLink, CheckCircle2, AlertTriangle } from "lucide-react"

interface Pagamento { valor: number; referencia: string | null; metodo: string | null; pagoEm: string | null }
interface Assinatura {
  plano: string
  valorMensal: number
  moeda: string
  status: string
  trialAte: string | null
  cobrancaAtiva: boolean
  invoiceUrl: string | null
  pagamentos: Pagamento[]
}

const STATUS: Record<string, { label: string; cls: string }> = {
  trial: { label: "Em teste", cls: "bg-warning/15 text-warning border-warning/30" },
  ativa: { label: "Ativa", cls: "bg-success/15 text-success border-success/30" },
  suspensa: { label: "Suspensa", cls: "bg-destructive/15 text-destructive border-destructive/30" },
  cancelada: { label: "Cancelada", cls: "bg-muted text-muted-foreground border-border" },
}

const brl = (n: number) => `R$ ${(n ?? 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`

export default function MinhaAssinaturaPage() {
  const [a, setA] = useState<Assinatura | null>(null)
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState<string | null>(null)

  useEffect(() => {
    fetch("/api/minha-assinatura")
      .then(async (r) => {
        if (r.status === 404) { setErro("Você ainda não tem uma assinatura cadastrada. Fale com a administração."); return null }
        if (!r.ok) { setErro("Não foi possível carregar sua assinatura."); return null }
        return r.json()
      })
      .then((d) => { if (d) setA(d) })
      .catch(() => setErro("Erro de conexão."))
      .finally(() => setLoading(false))
  }, [])

  const st = a ? (STATUS[a.status] ?? { label: a.status, cls: "bg-muted text-muted-foreground border-border" }) : null

  return (
    <div className="p-8 space-y-6">
      <Header title="Minha assinatura" subtitle="Seu plano na plataforma e pagamentos" />

      {loading ? (
        <div className="flex justify-center py-16 text-muted-foreground"><Loader2 className="h-6 w-6 animate-spin" /></div>
      ) : erro ? (
        <Card><CardContent className="py-10 text-center text-muted-foreground">{erro}</CardContent></Card>
      ) : a ? (
        <>
          <Card>
            <CardContent className="p-6 space-y-5">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-1">Plano</p>
                  <p className="text-lg font-semibold capitalize text-foreground">{a.plano}</p>
                </div>
                <div>
                  <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-1">Valor mensal</p>
                  <p className="text-lg font-semibold text-foreground">{brl(a.valorMensal)}</p>
                </div>
                {st && <Badge className={`border font-mono text-[10px] uppercase ${st.cls}`}>{st.label}</Badge>}
              </div>

              {a.invoiceUrl ? (
                <a href={a.invoiceUrl} target="_blank" rel="noreferrer" className="inline-block">
                  <Button variant="coral" className="gap-2">
                    <CreditCard className="h-4 w-4" /> Pagar agora <ExternalLink className="h-3.5 w-3.5" />
                  </Button>
                </a>
              ) : a.cobrancaAtiva ? (
                <p className="flex items-center gap-2 text-sm text-success"><CheckCircle2 className="h-4 w-4" /> Cobrança em dia — sem fatura em aberto.</p>
              ) : (
                <p className="flex items-center gap-2 text-sm text-muted-foreground"><AlertTriangle className="h-4 w-4" /> Cobrança ainda não ativada pela administração.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-0">
              <div className="px-6 py-4 border-b border-border">
                <h2 className="text-sm font-semibold text-foreground">Histórico de pagamentos</h2>
              </div>
              {a.pagamentos.length === 0 ? (
                <p className="px-6 py-8 text-center text-sm text-muted-foreground">Nenhum pagamento ainda.</p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-left text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                      <th className="px-6 py-2.5 font-medium">Referência</th>
                      <th className="px-6 py-2.5 font-medium">Valor</th>
                      <th className="px-6 py-2.5 font-medium">Método</th>
                      <th className="px-6 py-2.5 font-medium">Pago em</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {a.pagamentos.map((p, i) => (
                      <tr key={i}>
                        <td className="px-6 py-2.5 text-foreground">{p.referencia ?? "—"}</td>
                        <td className="px-6 py-2.5 text-foreground">{brl(p.valor)}</td>
                        <td className="px-6 py-2.5 text-muted-foreground capitalize">{p.metodo ?? "—"}</td>
                        <td className="px-6 py-2.5 text-muted-foreground">{p.pagoEm ? new Date(p.pagoEm).toLocaleDateString("pt-BR") : "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </CardContent>
          </Card>
        </>
      ) : null}
    </div>
  )
}
