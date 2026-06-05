"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ShieldAlert, Send, ImagePlus, X } from "lucide-react"
import type { Comunidade, PerfilMe } from "@/lib/rede"
import { iniciais } from "@/lib/rede"
import { cn } from "@/lib/utils"

const SEM_COMUNIDADE = "__nenhuma__"

interface Props {
  me: PerfilMe | null
  comunidades: Comunidade[]
  onCreated: () => void
  comunidadePadrao?: string
}

export function PostComposer({ me, comunidades, onCreated, comunidadePadrao }: Props) {
  const [corpo, setCorpo] = useState("")
  const [comunidadeId, setComunidadeId] = useState<string>(comunidadePadrao ?? SEM_COMUNIDADE)
  const [enviando, setEnviando] = useState(false)
  const [fotos, setFotos] = useState<File[]>([])

  const verificado = me?.verificado ?? false

  function escolherFotos(e: React.ChangeEvent<HTMLInputElement>) {
    const novas = Array.from(e.target.files ?? []).filter((f) => f.type.startsWith("image/"))
    setFotos((atual) => [...atual, ...novas].slice(0, 4))
    e.target.value = ""
  }

  // Sobe cada foto direto pro S3 via presigned PUT; retorna as keys (ou null em falha).
  async function subirFotos(): Promise<string[] | null> {
    const keys: string[] = []
    for (const f of fotos) {
      const pre = await fetch("/api/rede/posts/foto-presign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contentType: f.type }),
      })
      if (!pre.ok) return null
      const { uploadUrl, key } = await pre.json()
      const put = await fetch(uploadUrl, { method: "PUT", headers: { "Content-Type": f.type }, body: f })
      if (!put.ok) return null
      keys.push(key)
    }
    return keys
  }

  async function publicar() {
    const texto = corpo.trim()
    if (!texto && fotos.length === 0) return
    setEnviando(true)
    try {
      // Post COM foto → fila de aprovação.
      if (fotos.length > 0) {
        const keys = await subirFotos()
        if (!keys) {
          toast.error("Falha ao enviar a foto. Tente novamente.")
          return
        }
        const res = await fetch("/api/rede/posts/com-foto", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            corpo: texto,
            comunidadeId: comunidadeId === SEM_COMUNIDADE ? null : comunidadeId,
            midias: keys,
          }),
        })
        if (res.status === 201) {
          setCorpo("")
          setFotos([])
          setComunidadeId(SEM_COMUNIDADE)
          toast.success("Enviado! Seu post com foto aparece no feed após a aprovação do moderador.")
          onCreated()
          return
        }
        const d = await res.json().catch(() => null)
        toast.error(d?.error === "pii_bloqueada"
          ? "Remova dados que identifiquem pacientes."
          : "Não foi possível publicar.")
        return
      }

      // Post só-texto → publica direto.
      const res = await fetch("/api/rede/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          corpo: texto,
          comunidadeId: comunidadeId === SEM_COMUNIDADE ? null : comunidadeId,
        }),
      })
      if (res.status === 201) {
        setCorpo("")
        setComunidadeId(SEM_COMUNIDADE)
        toast.success("Publicado!")
        onCreated()
        return
      }
      const data = await res.json().catch(() => null)
      if (data?.error === "pii_bloqueada") {
        toast.error("Sua publicação parece conter dados de paciente (CPF/telefone). Remova qualquer informação identificável.")
      } else if (data?.error === "crm_nao_verificado") {
        toast.error("Só médicos com CRM verificado podem publicar.")
      } else {
        toast.error("Não foi possível publicar. Tente novamente.")
      }
    } catch {
      toast.error("Erro de conexão.")
    } finally {
      setEnviando(false)
    }
  }

  if (!verificado) {
    return (
      <Card className="border-border/60 bg-card/80">
        <CardContent className="flex items-start gap-3 p-5">
          <ShieldAlert className="mt-0.5 h-5 w-5 flex-shrink-0 text-accent" />
          <div className="text-sm">
            <p className="font-medium text-foreground">Verifique seu CRM para publicar</p>
            <p className="mt-1 text-muted-foreground">
              A Comunidade Cérebro Amigo é exclusiva para médicos com registro verificado.
              Você pode ler o feed, mas só publica e interage após a verificação do seu CRM.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-border/60 bg-card/80">
      <CardContent className="p-5">
        <div className="flex gap-3">
          <Avatar className="h-10 w-10">
            {me?.fotoUrl ? <AvatarImage src={me.fotoUrl} alt={me.nome} /> : null}
            <AvatarFallback className="bg-primary/10 text-primary">{iniciais(me?.nome)}</AvatarFallback>
          </Avatar>
          <div className="flex-1 space-y-3">
            <Textarea
              value={corpo}
              onChange={(e) => setCorpo(e.target.value)}
              placeholder="Compartilhe uma experiência, dúvida ou aprendizado com outros médicos…"
              maxLength={5000}
              rows={3}
              className="resize-none border-border/50 bg-muted/20 focus-visible:ring-primary/30"
            />
            <p className="text-[11px] text-muted-foreground/70">
              Nunca inclua dados que identifiquem pacientes. Discussões de caso devem ser anônimas (LGPD).
              Fotos passam por aprovação do moderador.
            </p>
            {fotos.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {fotos.map((f, i) => (
                  <div key={i} className="relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={URL.createObjectURL(f)} alt="" className="h-16 w-16 rounded-lg object-cover" />
                    <button
                      type="button"
                      onClick={() => setFotos((a) => a.filter((_, j) => j !== i))}
                      className="absolute -right-1.5 -top-1.5 grid h-5 w-5 place-items-center rounded-full bg-destructive text-destructive-foreground"
                      aria-label="Remover foto"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Select value={comunidadeId} onValueChange={setComunidadeId}>
                  <SelectTrigger className="w-[180px] border-border/50 bg-muted/20 text-sm">
                    <SelectValue placeholder="Comunidade (opcional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={SEM_COMUNIDADE}>Sem comunidade</SelectItem>
                    {comunidades.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <label
                  className={cn(
                    "flex cursor-pointer items-center gap-1.5 rounded-full px-3 py-1.5 text-sm text-muted-foreground hover:text-primary",
                    fotos.length >= 4 && "pointer-events-none opacity-40",
                  )}
                >
                  <ImagePlus className="h-4 w-4" /> Foto
                  <input type="file" accept="image/*" multiple className="hidden" onChange={escolherFotos} />
                </label>
              </div>
              <Button
                onClick={publicar}
                disabled={enviando || (corpo.trim().length === 0 && fotos.length === 0)}
                className="gap-2 rounded-full"
              >
                <Send className="h-4 w-4" />
                {enviando ? "Enviando…" : "Publicar"}
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
