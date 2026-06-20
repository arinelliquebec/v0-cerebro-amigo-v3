"use client"

// Escriba — revisão da nota da teleconsulta (ADR-040). O médico vê o rascunho FACTUAL
// gerado pela IA (relato/temas/medicações mencionadas — SEM diagnóstico/conduta), edita,
// ESCREVE a avaliação e conduta (parte clínica é do médico) e aprova → evolução.

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Header } from "@/components/header"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Loader2, ShieldAlert, FileText, Check, ChevronDown, ChevronUp, Sparkles, ArrowLeft,
} from "lucide-react"
import { useMe } from "@/lib/use-me"
import { FEATURE, temFeature, readFeatureGate } from "@/lib/feature-gate"
import { UpsellFeature } from "@/components/assinatura/upsell-feature"
import { useFeatureUpsell } from "@/components/assinatura/feature-upsell"

interface Rascunho {
  resumo_factual?: string
  queixas_relatadas?: string[]
  fatos_relatados?: string[]
  objetivo?: string[]
  temas_abordados?: string[]
  medicacoes_mencionadas?: string[]
  mencao_risco?: boolean
  sinais_de_alerta?: string[]
  observacoes_para_revisao_medica?: string
}
interface EscribaData {
  transcricao: string | null
  rascunho: Rascunho | null
  mencaoRisco: boolean
  status: string
}

const linhas = (a?: string[]) => (a ?? []).join("\n")
const arr = (s: string) => s.split("\n").map((l) => l.trim()).filter(Boolean)

// Helpers da nota SOAP (puros, em escopo de módulo p/ manter montarConteudo simples).
const bloco = (titulo: string, itens: string[]) =>
  itens.length ? `${titulo}:\n${itens.map((i) => `- ${i}`).join("\n")}\n\n` : ""
const listaTraco = (itens: string[]) => (itens.length ? itens.map((i) => `- ${i}`).join("\n") : "—")
const temasLinha = (itens: string[]) => (itens.length ? `Temas: ${itens.join(", ")}\n\n` : "")
const ouTraco = (v: string) => v || "—"

export default function EscribaRevisaoPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const me = useMe()
  const { showUpsell } = useFeatureUpsell()
  // Feature gate (ADR-059): escriba = só Master. Trava proativa (me.features) + reativa (402).
  const semEscriba = me?.features != null && !temFeature(me.features, FEATURE.escriba)

  const [data, setData] = useState<EscribaData | null>(null)
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState<string | null>(null)
  const [erroSalvar, setErroSalvar] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [aprovado, setAprovado] = useState(false)
  const [verTranscricao, setVerTranscricao] = useState(false)

  // Campos editáveis (rascunho factual + parte clínica do médico)
  const [resumo, setResumo] = useState("")
  const [queixas, setQueixas] = useState("")
  const [fatos, setFatos] = useState("")
  const [objetivo, setObjetivo] = useState("")
  const [temas, setTemas] = useState("")
  const [medicacoes, setMedicacoes] = useState("")
  const [observacoes, setObservacoes] = useState("")
  const [sinaisAlerta, setSinaisAlerta] = useState<string[]>([])
  // Avaliação (A) e Plano (P) são do MÉDICO — a IA não preenche.
  const [avaliacao, setAvaliacao] = useState("")
  const [plano, setPlano] = useState("")

  useEffect(() => {
    fetch(`/api/consultas/${id}/escriba`)
      .then(async (r) => {
        { const gate = await readFeatureGate(r); if (gate) { setErro("bloqueado"); showUpsell(gate.feature); return null } }
        if (r.status === 404) { setErro("sem_rascunho"); return null }
        if (!r.ok) { setErro("erro"); return null }
        return r.json()
      })
      .then((d: EscribaData | null) => {
        if (!d) return
        setData(d)
        const r = d.rascunho ?? {}
        setResumo(r.resumo_factual ?? "")
        setQueixas(linhas(r.queixas_relatadas))
        setFatos(linhas(r.fatos_relatados))
        setObjetivo(linhas(r.objetivo))
        setTemas(linhas(r.temas_abordados))
        setMedicacoes(linhas(r.medicacoes_mencionadas))
        setObservacoes(r.observacoes_para_revisao_medica ?? "")
        setSinaisAlerta(r.sinais_de_alerta ?? [])
        if (d.status === "aprovado") setAprovado(true)
      })
      .catch(() => setErro("erro"))
      .finally(() => setLoading(false))
  }, [id])

  const rascunhoAtual = (): Rascunho => ({
    resumo_factual: resumo,
    queixas_relatadas: arr(queixas),
    fatos_relatados: arr(fatos),
    objetivo: arr(objetivo),
    temas_abordados: arr(temas),
    medicacoes_mencionadas: arr(medicacoes),
    mencao_risco: data?.mencaoRisco ?? false,
    sinais_de_alerta: sinaisAlerta,
    observacoes_para_revisao_medica: observacoes,
  })

  async function salvarRascunho(): Promise<boolean> {
    setSalvando(true)
    setErroSalvar(false)
    try {
      const r = await fetch(`/api/consultas/${id}/escriba`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rascunho: rascunhoAtual() }),
      })
      if (!r.ok) {
        setErroSalvar(true)
        return false
      }
      return true
    } catch {
      setErroSalvar(true)
      return false
    } finally {
      setSalvando(false)
    }
  }

  // Nota final em formato SOAP. S/O = factual (assistido por IA); A/P = do médico.
  // observacoes_para_revisao_medica é auxílio de revisão e NÃO entra na nota.
  function montarConteudo(): string {
    return [
      `S — SUBJETIVO (assistido por IA, revisado pelo médico)\n${ouTraco(resumo)}\n\n`,
      bloco("Queixas relatadas", arr(queixas)),
      bloco("Fatos relatados", arr(fatos)),
      bloco("Medicações mencionadas", arr(medicacoes)),
      temasLinha(arr(temas)),
      `O — OBJETIVO (dados ditos na consulta)\n${listaTraco(arr(objetivo))}\n\n`,
      `A — AVALIAÇÃO (médico)\n${ouTraco(avaliacao)}\n\n`,
      `P — PLANO / CONDUTA (médico)\n${ouTraco(plano)}`,
    ].join("")
  }

  async function aprovar() {
    if (!avaliacao.trim()) {
      setErro("avaliacao_vazia")
      return
    }
    setSalvando(true)
    setErro(null)
    try {
      const salvou = await salvarRascunho()
      if (!salvou) {
        setErro("erro_aprovar")
        return
      }
      const r = await fetch(`/api/consultas/${id}/escriba/aprovar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conteudo: montarConteudo() }),
      })
      if (!r.ok) throw new Error()
      setAprovado(true)
    } catch {
      setErro("erro_aprovar")
    } finally {
      setSalvando(false)
    }
  }

  return (
    <div className="p-8 space-y-6 max-w-3xl">
      <Header title="Escriba — nota da consulta" subtitle="Rascunho factual da IA · você revisa, completa e aprova" />

      {loading ? (
        <div className="flex justify-center py-20 text-muted-foreground"><Loader2 className="h-6 w-6 animate-spin" /></div>
      ) : erro === "bloqueado" || semEscriba ? (
        <UpsellFeature feature={FEATURE.escriba} />
      ) : erro === "sem_rascunho" ? (
        <Card><CardContent className="py-12 text-center space-y-3">
          <p className="text-sm text-muted-foreground">Nenhum rascunho ainda. Grave a teleconsulta (com consentimento do paciente) para gerar a nota.</p>
          <Button asChild variant="outline"><Link href={`/dashboard/consultas/${id}/teleconsulta`}><ArrowLeft className="h-4 w-4 mr-2" />Ir para a teleconsulta</Link></Button>
        </CardContent></Card>
      ) : erro === "erro" ? (
        <Card><CardContent className="py-12 text-center space-y-3">
          <ShieldAlert className="mx-auto h-8 w-8 text-coral" />
          <p className="text-sm text-muted-foreground">Não foi possível carregar a nota desta consulta agora. Atualize a página ou tente novamente em instantes.</p>
          <Button variant="outline" onClick={() => window.location.reload()}>Tentar novamente</Button>
        </CardContent></Card>
      ) : aprovado ? (
        <Card className="border-success/40 bg-success/5"><CardContent className="py-12 text-center space-y-3">
          <Check className="mx-auto h-8 w-8 text-success" />
          <p className="text-sm font-medium text-foreground">Evolução aprovada e salva no prontuário.</p>
          <Button asChild variant="outline"><Link href="/dashboard/prontuarios">Ir para prontuários</Link></Button>
        </CardContent></Card>
      ) : (
        <>
          {data?.mencaoRisco && (
            <div className="flex items-start gap-3 rounded-xl border border-coral/40 bg-coral/10 p-4">
              <ShieldAlert className="h-5 w-5 flex-shrink-0 text-coral" />
              <div className="text-sm text-foreground">
                <p>
                  <strong>Menção de risco</strong> identificada na conversa. Revise com atenção — esta é uma
                  observação factual da fala, não uma avaliação clínica.
                </p>
                {sinaisAlerta.length > 0 && (
                  <ul className="mt-2 list-disc space-y-0.5 pl-5 text-xs text-foreground/90">
                    {sinaisAlerta.map((s) => <li key={s}>{s}</li>)}
                  </ul>
                )}
              </div>
            </div>
          )}

          {/* Rascunho factual (editável) — S e O do SOAP */}
          <Card>
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <h2 className="text-sm font-semibold text-foreground">Rascunho factual (IA — sem diagnóstico)</h2>
              </div>

              <p className="text-xs font-semibold uppercase tracking-wide text-primary">S — Subjetivo (relato do paciente)</p>
              <Campo label="Resumo factual" value={resumo} onChange={setResumo} rows={4} />
              <Campo label="Queixas relatadas (uma por linha)" value={queixas} onChange={setQueixas} rows={3} />
              <Campo label="Fatos relatados (uma por linha)" value={fatos} onChange={setFatos} rows={3} />
              <Campo label="Medicações mencionadas (uma por linha)" value={medicacoes} onChange={setMedicacoes} rows={2} />
              <Campo label="Temas abordados (um por linha)" value={temas} onChange={setTemas} rows={2} />

              <p className="pt-2 text-xs font-semibold uppercase tracking-wide text-primary">O — Objetivo (só o que foi dito na consulta)</p>
              <Campo label="Escalas com escore, exames e sinais vitais citados (um por linha)" value={objetivo} onChange={setObjetivo} rows={3} />

              {observacoes.trim() && (
                <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-1">
                  <p className="text-xs font-medium text-muted-foreground">Observações para revisão (IA) — confirme antes de aprovar (não entra na nota)</p>
                  <Campo label="" value={observacoes} onChange={setObservacoes} rows={2} />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Avaliação (A) e Plano (P) — DO MÉDICO */}
          <Card className="border-primary/30">
            <CardContent className="p-6 space-y-3">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />
                <h2 className="text-sm font-semibold text-foreground">Avaliação e plano (você escreve)</h2>
              </div>
              <p className="text-xs text-muted-foreground">
                A IA não preenche estes campos. Diagnóstico, impressão clínica, CID e conduta são da sua decisão.
              </p>
              <Campo label="A — Avaliação / impressão clínica" value={avaliacao} onChange={setAvaliacao} rows={5}
                placeholder="Impressão clínica, hipóteses diagnósticas, CID…" />
              <Campo label="P — Plano / conduta" value={plano} onChange={setPlano} rows={4}
                placeholder="Conduta, ajustes, encaminhamentos, exames, próxima consulta…" />
              {erro === "avaliacao_vazia" && <p className="text-xs text-coral">Escreva a avaliação antes de aprovar.</p>}
              {erro === "erro_aprovar" && <p className="text-xs text-coral">Não foi possível aprovar. Tente novamente.</p>}
            </CardContent>
          </Card>

          {/* Transcrição (colapsada) */}
          {data?.transcricao && (
            <Card>
              <CardContent className="p-0">
                <button
                  onClick={() => setVerTranscricao((v) => !v)}
                  className="flex w-full items-center justify-between px-6 py-4 text-sm font-medium text-foreground"
                >
                  Transcrição da consulta
                  {verTranscricao ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </button>
                {verTranscricao && (
                  <pre className="max-h-72 overflow-auto whitespace-pre-wrap border-t border-border px-6 py-4 text-xs text-muted-foreground">
                    {data.transcricao}
                  </pre>
                )}
              </CardContent>
            </Card>
          )}

          <div className="flex flex-wrap gap-3">
            <Button variant="outline" onClick={salvarRascunho} disabled={salvando}>
              {salvando ? <Loader2 className="h-4 w-4 animate-spin" /> : "Salvar rascunho"}
            </Button>
            <Button onClick={aprovar} disabled={salvando} className="gap-2">
              <Check className="h-4 w-4" /> Aprovar e salvar evolução
            </Button>
          </div>
          {erroSalvar && (
            <p className="text-xs text-coral">Não foi possível salvar o rascunho da nota. Tente novamente.</p>
          )}
        </>
      )}
    </div>
  )
}

function Campo({ label, value, onChange, rows = 3, placeholder }: {
  label: string; value: string; onChange: (v: string) => void; rows?: number; placeholder?: string
}) {
  return (
    <label className="block">
      {label && <span className="mb-1 block text-xs font-medium text-muted-foreground">{label}</span>}
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        placeholder={placeholder}
        className="w-full resize-y rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/30"
      />
    </label>
  )
}
