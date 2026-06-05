"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ArrowLeft, Copy, Check, Loader2, QrCode } from "lucide-react"

interface Cobranca {
  id: string
  descricao: string
  valor: number
  status: string
  vencimento: string | null
  asaasInvoiceUrl: string | null
  pixCopiaCola: string | null
  pixQrBase64: string | null
}

const brl = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })

export default function PagamentosPaciente() {
  const [itens, setItens] = useState<Cobranca[]>([])
  const [loading, setLoading] = useState(true)
  const [copiado, setCopiado] = useState<string | null>(null)

  useEffect(() => {
    fetch("/api/paciente/cobrancas")
      .then((r) => (r.ok ? r.json() : []))
      .then((rows) => setItens(Array.isArray(rows) ? rows : []))
      .catch(() => setItens([]))
      .finally(() => setLoading(false))
  }, [])

  async function copiar(id: string, texto: string) {
    try {
      await navigator.clipboard.writeText(texto)
      setCopiado(id)
      setTimeout(() => setCopiado(null), 2000)
    } catch {
      /* ignora */
    }
  }

  return (
    <div className="theme-noir min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-md p-4">
        <Link href="/p" className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground">
          <ArrowLeft className="h-4 w-4" /> Voltar
        </Link>
        <h1 className="mb-4 text-2xl font-semibold">Pagamentos</h1>

        {loading ? (
          <div className="flex justify-center py-12 text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : itens.length === 0 ? (
          <p className="rounded-2xl border border-border/60 bg-card p-6 text-center text-sm text-muted-foreground">
            Nenhuma cobrança pendente.
          </p>
        ) : (
          <div className="space-y-4">
            {itens.map((c) => (
              <div key={c.id} className="rounded-2xl border border-border/60 bg-card p-4">
                <div className="mb-2 flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium">{c.descricao}</p>
                    {c.vencimento && (
                      <p className="text-xs text-muted-foreground">
                        vence {new Date(c.vencimento).toLocaleDateString("pt-BR")}
                      </p>
                    )}
                  </div>
                  <span className="text-lg font-semibold text-primary">{brl(c.valor)}</span>
                </div>

                {c.pixQrBase64 && (
                  <div className="my-3 flex justify-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`data:image/png;base64,${c.pixQrBase64}`}
                      alt="QR Code Pix"
                      className="h-44 w-44 rounded-lg bg-white p-2"
                    />
                  </div>
                )}

                {c.pixCopiaCola && (
                  <button
                    type="button"
                    onClick={() => copiar(c.id, c.pixCopiaCola!)}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground"
                  >
                    {copiado === c.id ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    {copiado === c.id ? "Copiado!" : "Copiar Pix copia-e-cola"}
                  </button>
                )}

                {c.asaasInvoiceUrl && (
                  <a
                    href={c.asaasInvoiceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 flex items-center justify-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm font-medium"
                  >
                    <QrCode className="h-4 w-4" /> Abrir fatura / outras formas
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
