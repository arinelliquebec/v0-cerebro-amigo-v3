"use client"

// Medicações EM USO (reconciliação, ADR-062). Registro do que o paciente JÁ toma — de
// qualquer prescritor. NÃO é receita (prescrição legal = MEMED). A IA não preenche nem
// sugere: o médico digita/escolhe. Alimenta a checagem de interações A5 no gateway.

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog"
import { Pill, Plus, X, Loader2, Search, Info } from "lucide-react"

interface MedicacaoEmUso {
  id: string
  medicamento: string
  generico: string | null
  classe: string | null
  posologia: string | null
  fonte: string | null
  observacoes: string | null
  criadoEm: string
}
interface CatalogoItem {
  id: string
  nomeGenerico: string
  classeTerapeutica: string
  indicacoesResumo: string | null
}

export function MedicacoesEmUso({ pacienteId }: { pacienteId: string }) {
  const [lista, setLista] = useState<MedicacaoEmUso[]>([])
  const [loading, setLoading] = useState(true)
  const [aberto, setAberto] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  // form
  const [nome, setNome] = useState("")
  const [generico, setGenerico] = useState<string | null>(null)
  const [classe, setClasse] = useState<string | null>(null)
  const [posologia, setPosologia] = useState("")
  const [fonte, setFonte] = useState("")

  // catálogo (busca)
  const [sugestoes, setSugestoes] = useState<CatalogoItem[]>([])
  const buscaTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const carregar = () => {
    setLoading(true)
    fetch(`/api/pacientes/${pacienteId}/medicacoes-em-uso`)
      .then((r) => (r.ok ? r.json() : []))
      .then((rows) => setLista(Array.isArray(rows) ? rows : []))
      .catch(() => setLista([]))
      .finally(() => setLoading(false))
  }
  useEffect(() => { carregar() /* eslint-disable-next-line */ }, [pacienteId])

  // busca no catálogo (debounce). O nome digitado também vale como texto livre.
  function onNome(v: string) {
    setNome(v); setGenerico(null); setClasse(null)
    if (buscaTimer.current) clearTimeout(buscaTimer.current)
    const termo = v.trim()
    if (termo.length < 2) { setSugestoes([]); return }
    buscaTimer.current = setTimeout(() => {
      fetch(`/api/medicamentos?q=${encodeURIComponent(termo)}`)
        .then((r) => (r.ok ? r.json() : []))
        .then((rows) => setSugestoes(Array.isArray(rows) ? rows.slice(0, 8) : []))
        .catch(() => setSugestoes([]))
    }, 250)
  }
  function escolher(c: CatalogoItem) {
    setNome(c.nomeGenerico); setGenerico(c.nomeGenerico); setClasse(c.classeTerapeutica)
    setSugestoes([])
  }

  function resetForm() {
    setNome(""); setGenerico(null); setClasse(null); setPosologia(""); setFonte("")
    setSugestoes([]); setErro(null)
  }

  async function registrar() {
    const medicamento = nome.trim()
    if (!medicamento) { setErro("Informe o nome do medicamento."); return }
    setSalvando(true); setErro(null)
    try {
      const r = await fetch(`/api/pacientes/${pacienteId}/medicacoes-em-uso`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          medicamento, generico, classe,
          posologia: posologia.trim() || null,
          fonte: fonte.trim() || null,
        }),
      })
      if (!r.ok) { setErro("Não foi possível registrar agora. Tente novamente."); return }
      resetForm(); setAberto(false); carregar()
    } catch {
      setErro("Erro de conexão.")
    } finally {
      setSalvando(false)
    }
  }

  async function remover(id: string) {
    const anterior = lista
    setLista((prev) => prev.filter((m) => m.id !== id)) // otimista
    try {
      const r = await fetch(`/api/medicacoes-em-uso/${id}/remover`, { method: "POST" })
      if (!r.ok) setLista(anterior)
    } catch { setLista(anterior) }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Info className="h-3.5 w-3.5 shrink-0" />
          Registro do que o paciente já toma (qualquer prescritor). Também listado na aba <strong>Prescrições</strong>.
        </p>
        <Dialog open={aberto} onOpenChange={(o) => { setAberto(o); if (!o) resetForm() }}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1.5"><Plus className="h-4 w-4" /> Adicionar</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Registrar medicação em uso</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Medicamento</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input value={nome} onChange={(e) => onNome(e.target.value)}
                    placeholder="Busque no catálogo ou digite livremente" className="pl-9" autoComplete="off" />
                </div>
                {classe && <p className="text-xs text-muted-foreground">Classe: {classe}</p>}
                {sugestoes.length > 0 && (
                  <div className="rounded-lg border border-border/60 divide-y divide-border/40 max-h-48 overflow-y-auto">
                    {sugestoes.map((c) => (
                      <button key={c.id} type="button" onClick={() => escolher(c)}
                        className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm hover:bg-muted/50">
                        <span className="font-medium text-foreground">{c.nomeGenerico}</span>
                        <Badge variant="secondary" className="text-[10px]">{c.classeTerapeutica}</Badge>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Posologia <span className="font-normal text-muted-foreground">(como o paciente toma)</span></label>
                <Input value={posologia} onChange={(e) => setPosologia(e.target.value)} placeholder="ex.: 50mg, 1x/dia de manhã" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Fonte <span className="font-normal text-muted-foreground">(opcional)</span></label>
                <Input value={fonte} onChange={(e) => setFonte(e.target.value)} placeholder="ex.: outro psiquiatra, clínico, automedicação" />
              </div>
              {erro && <p role="alert" className="text-xs text-destructive">{erro}</p>}
            </div>
            <DialogFooter>
              <Button onClick={registrar} disabled={salvando || !nome.trim()} className="gap-2">
                {salvando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Registrar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
      ) : lista.length === 0 ? (
        <Card className="border-border/50"><CardContent className="py-8 text-center text-sm text-muted-foreground">
          Nenhuma medicação em uso registrada.
        </CardContent></Card>
      ) : (
        <div className="space-y-2">
          {lista.map((m) => (
            <Card key={m.id} className="border-border/50">
              <CardContent className="flex items-start gap-3 p-3">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-secondary text-primary">
                  <Pill className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-medium text-foreground">{m.medicamento}</p>
                    {m.classe && <Badge variant="secondary" className="text-[10px]">{m.classe}</Badge>}
                  </div>
                  {m.posologia && <p className="text-xs text-muted-foreground">{m.posologia}</p>}
                  {m.fonte && <p className="text-[11px] text-muted-foreground">Fonte: {m.fonte}</p>}
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive"
                  title="Remover" aria-label="Remover" onClick={() => remover(m.id)}>
                  <X className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
