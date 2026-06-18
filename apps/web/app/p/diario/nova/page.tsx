"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Mic, PenLine, ArrowLeft, Check, Edit3, Tag, SmilePlus, Phone, Heart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { AudioDiario, type TranscricaoResult } from "@/components/portal/AudioDiario"
import { cn } from "@/lib/utils"

// ─── Tipos ───────────────────────────────────────────────────────────────────

type Modo = "escolha" | "audio-gravando" | "audio-revisao" | "texto" | "crise"
type SalvandoState = "idle" | "salvando" | "erro" | "indisponivel"

// ─── Página principal ────────────────────────────────────────────────────────

export default function NovaDiarioPage() {
  const router = useRouter()
  const [modo, setModo] = useState<Modo>("escolha")
  const [salvando, setSalvando] = useState<SalvandoState>("idle")

  // Campos do formulário
  const [titulo, setTitulo] = useState("")
  const [conteudo, setConteudo] = useState("")
  const [humor, setHumor] = useState<number | null>(null)
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState("")
  const [compartilhar, setCompartilhar] = useState(false)

  // Dados específicos de áudio
  const [transcricao, setTranscricao] = useState<string | null>(null)
  const [analise, setAnalise] = useState<TranscricaoResult | null>(null)

  // Texto fixo de acolhimento de crise (vem do backend — crisis_copy)
  const [criseTexto, setCriseTexto] = useState<string | null>(null)

  // ─── Callback pós-transcrição ──────────────────────────────────────────────

  const onTranscricao = (data: TranscricaoResult) => {
    // Crise detectada na fala: NÃO mostra form nem análise — só o acolhimento.
    if (data.crise && data.crise_texto) {
      setCriseTexto(data.crise_texto)
      setModo("crise")
      return
    }
    setAnalise(data)
    setTranscricao(data.transcricao)
    setConteudo(data.transcricao)
    if (data.humor_estimado) setHumor(data.humor_estimado)
    if (data.tags_sugeridas.length > 0) setTags(data.tags_sugeridas)
    setModo("audio-revisao")
  }

  // ─── Adicionar tag ────────────────────────────────────────────────────────

  const adicionarTag = () => {
    const t = tagInput.trim().toLowerCase()
    if (t && !tags.includes(t) && tags.length < 5) {
      setTags([...tags, t])
      setTagInput("")
    }
  }

  const removerTag = (t: string) => setTags(tags.filter(x => x !== t))

  // ─── Salvar ───────────────────────────────────────────────────────────────

  const salvar = async () => {
    if (!conteudo.trim()) return
    setSalvando("salvando")

    try {
      const res = await fetch("/api/paciente/diario", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          titulo: titulo.trim() || null,
          conteudo: conteudo.trim(),
          humor,
          tags,
          compartilharComMedico: compartilhar,
          tipo: transcricao ? "audio" : "texto",
          transcricao: transcricao ?? null,
        }),
      })

      // Triagem indisponível (503): não foi salvo nem triado — pedir retry.
      if (res.status === 503) {
        setSalvando("indisponivel")
        return
      }

      const body = await res.json().catch(() => null)

      // Crise detectada no texto: entrada NÃO foi salva, mostra acolhimento.
      if (body?.crise && body?.crise_texto) {
        setCriseTexto(body.crise_texto)
        setModo("crise")
        return
      }

      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      router.push("/p/diario")
      router.refresh()
    } catch {
      setSalvando("erro")
    }
  }

  // ─── Renderização por modo ────────────────────────────────────────────────

  return (
    <div className="px-4 py-6 min-h-screen">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-lg font-semibold">
          {modo === "crise" ? "Estamos com você" : "Nova entrada"}
        </h1>
      </div>

      {/* ── Acolhimento de crise (texto fixo do backend, NUNCA editável) ─── */}
      {modo === "crise" && criseTexto && (
        <div className="space-y-5">
          <div className="rounded-2xl border-2 border-primary/40 bg-primary/5 p-5 space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                <Heart className="w-5 h-5 text-primary" />
              </div>
              <p className="text-sm font-medium">Sua mensagem foi levada a sério</p>
            </div>
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{criseTexto}</p>
          </div>

          {/* Ações rápidas de contato */}
          <div className="grid grid-cols-2 gap-3">
            <a
              href="tel:188"
              className="rounded-xl border-2 border-primary/30 bg-primary/10 hover:bg-primary/20 p-4 flex flex-col items-center gap-1 transition-colors"
            >
              <Phone className="w-5 h-5 text-primary" />
              <span className="font-semibold text-sm">CVV 188</span>
              <span className="text-[11px] text-muted-foreground">24h gratuito</span>
            </a>
            <a
              href="tel:192"
              className="rounded-xl border-2 hover:border-border/80 bg-card hover:bg-accent/40 p-4 flex flex-col items-center gap-1 transition-colors"
            >
              <Phone className="w-5 h-5 text-destructive" />
              <span className="font-semibold text-sm">SAMU 192</span>
              <span className="text-[11px] text-muted-foreground">emergência</span>
            </a>
          </div>

          <Button variant="outline" className="w-full" onClick={() => router.push("/p/diario")}>
            Voltar ao diário
          </Button>
        </div>
      )}

      {/* ── Tela de escolha ─────────────────────────────────────────────── */}
      {modo === "escolha" && (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground text-center">
            Como você quer registrar hoje?
          </p>

          <button
            type="button"
            onClick={() => setModo("audio-gravando")}
            className="w-full rounded-2xl border-2 border-primary/30 bg-primary/5 hover:bg-primary/10 p-6 flex flex-col items-center gap-3 transition-colors"
          >
            <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center">
              <Mic className="w-7 h-7 text-primary" />
            </div>
            <div className="text-center">
              <p className="font-semibold">Gravar áudio</p>
              <p className="text-sm text-muted-foreground mt-0.5">
                Fale como está se sentindo (até 60 segundos)
              </p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setModo("texto")}
            className="w-full rounded-2xl border-2 hover:border-border/80 bg-card hover:bg-accent/40 p-6 flex flex-col items-center gap-3 transition-colors"
          >
            <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center">
              <PenLine className="w-7 h-7 text-muted-foreground" />
            </div>
            <div className="text-center">
              <p className="font-semibold">Escrever</p>
              <p className="text-sm text-muted-foreground mt-0.5">
                Digite sua entrada no diário
              </p>
            </div>
          </button>
        </div>
      )}

      {/* ── Gravação de áudio ────────────────────────────────────────────── */}
      {modo === "audio-gravando" && (
        <div className="flex flex-col items-center">
          <p className="text-sm text-muted-foreground text-center mb-2">
            Fale livremente — conte como está se sentindo, o que aconteceu, o que pensa.
          </p>
          <AudioDiario
            onTranscricao={onTranscricao}
            onCancelar={() => setModo("escolha")}
          />
        </div>
      )}

      {/* ── Revisão pós-áudio + formulário ──────────────────────────────── */}
      {(modo === "audio-revisao" || modo === "texto") && (
        <div className="space-y-5">
          {/* Banner de análise (apenas para áudio) */}
          {analise && modo === "audio-revisao" && (
            <div className="rounded-xl border bg-card p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Mic className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium">Transcrição pronta</span>
                {analise.emocao_predominante !== "neutro" && (
                  <Badge variant="secondary" className="text-xs capitalize">
                    {analise.emocao_predominante}
                  </Badge>
                )}
              </div>
              {analise.sintomas_detectados.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Detectado na fala:</p>
                  <div className="flex flex-wrap gap-1">
                    {analise.sintomas_detectados.map(s => (
                      <Badge key={s} variant="outline" className="text-xs">
                        {s}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Edit3 className="w-3 h-3" />
                Revise e edite a transcrição abaixo antes de salvar
              </p>
            </div>
          )}

          {/* Título (opcional) */}
          <div className="space-y-1.5">
            <Label htmlFor="titulo" className="text-sm">Título <span className="text-muted-foreground">(opcional)</span></Label>
            <Input
              id="titulo"
              placeholder="Como foi o dia…"
              value={titulo}
              onChange={e => setTitulo(e.target.value)}
              maxLength={200}
            />
          </div>

          {/* Conteúdo */}
          <div className="space-y-1.5">
            <Label htmlFor="conteudo" className="text-sm">
              {transcricao ? "Transcrição (edite se necessário)" : "Como você está?"}
            </Label>
            <Textarea
              id="conteudo"
              placeholder="Escreva o que quiser…"
              value={conteudo}
              onChange={e => setConteudo(e.target.value)}
              rows={6}
              className="resize-none"
            />
          </div>

          {/* Humor */}
          <div className="space-y-2">
            <Label className="text-sm flex items-center gap-1">
              <SmilePlus className="w-4 h-4" />
              Humor agora
            </Label>
            <div className="flex gap-1.5 flex-wrap">
              {Array.from({ length: 10 }, (_, i) => i + 1).map(n => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setHumor(humor === n ? null : n)}
                  className={cn(
                    "w-8 h-8 rounded-lg text-sm font-medium transition-colors",
                    humor === n
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted hover:bg-muted/80 text-muted-foreground",
                  )}
                >
                  {n}
                </button>
              ))}
            </div>
            {humor && (
              <p className="text-xs text-muted-foreground">
                {humor >= 8 ? "😊 Bem" : humor >= 6 ? "🙂 OK" : humor >= 4 ? "😐 Mais ou menos" : humor >= 2 ? "😔 Mal" : "😢 Muito mal"}
              </p>
            )}
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label className="text-sm flex items-center gap-1">
              <Tag className="w-4 h-4" />
              Tags
            </Label>
            <div className="flex gap-2">
              <Input
                placeholder="sono, trabalho, ansiedade…"
                value={tagInput}
                onChange={e => setTagInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && (e.preventDefault(), adicionarTag())}
                className="flex-1"
                maxLength={30}
              />
              <Button type="button" variant="outline" size="sm" onClick={adicionarTag} disabled={tags.length >= 5}>
                Adicionar
              </Button>
            </div>
            {tags.length > 0 && (
              <div className="flex gap-1.5 flex-wrap">
                {tags.map(t => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => removerTag(t)}
                    className="text-xs px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground hover:bg-destructive/20 hover:text-destructive transition-colors"
                  >
                    {t} ×
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Compartilhar com médico */}
          <div className="flex items-center justify-between rounded-xl border p-4">
            <div>
              <p className="text-sm font-medium">Compartilhar com médico</p>
              <p className="text-xs text-muted-foreground">
                Ativo: sua psiquiatra poderá ler esta entrada
              </p>
            </div>
            <Switch
              checked={compartilhar}
              onCheckedChange={setCompartilhar}
            />
          </div>

          {/* Erro ao salvar */}
          {salvando === "erro" && (
            <p className="text-sm text-destructive text-center">
              Não foi possível salvar. Tente novamente.
            </p>
          )}
          {salvando === "indisponivel" && (
            <p className="text-sm text-destructive text-center">
              Não foi possível processar sua entrada agora. Tente novamente em instantes.
            </p>
          )}

          {/* Ações */}
          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => {
                if (transcricao) setModo("audio-gravando")
                else setModo("escolha")
              }}
            >
              Voltar
            </Button>
            <Button
              className="flex-1"
              onClick={salvar}
              disabled={!conteudo.trim() || salvando === "salvando"}
            >
              {salvando === "salvando" ? (
                "Salvando…"
              ) : (
                <>
                  <Check className="w-4 h-4 mr-1" />
                  Salvar
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
