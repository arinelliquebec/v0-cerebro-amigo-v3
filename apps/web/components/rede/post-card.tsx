"use client"

import { useState } from "react"
import Link from "next/link"
import { toast } from "sonner"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Heart, MessageCircle, Trash2, BadgeCheck, Flag } from "lucide-react"
import { DenunciarDialog } from "@/components/rede/denunciar-dialog"
import type { Comentario, Post } from "@/lib/rede"
import { iniciais } from "@/lib/rede"
import { tempoRelativo } from "@/lib/tempo"
import { cn } from "@/lib/utils"

interface Props {
  post: Post
  podeInteragir: boolean
  onRemoved: (id: string) => void
}

export function PostCard({ post, podeInteragir, onRemoved }: Props) {
  const [curtido, setCurtido] = useState(post.curtido)
  const [curtidas, setCurtidas] = useState(post.curtidas)
  const [comentariosAbertos, setComentariosAbertos] = useState(false)
  const [comentarios, setComentarios] = useState<Comentario[]>([])
  const [carregandoComentarios, setCarregandoComentarios] = useState(false)
  const [totalComentarios, setTotalComentarios] = useState(post.comentarios)
  const [novoComentario, setNovoComentario] = useState("")
  const [enviandoComentario, setEnviandoComentario] = useState(false)

  async function alternarCurtir() {
    if (!podeInteragir) {
      toast.error("Verifique seu CRM para interagir.")
      return
    }
    const novoEstado = !curtido
    setCurtido(novoEstado)
    setCurtidas((n) => n + (novoEstado ? 1 : -1))
    try {
      const res = await fetch(`/api/rede/posts/${post.id}/curtir`, {
        method: novoEstado ? "POST" : "DELETE",
      })
      if (!res.ok && res.status !== 204) throw new Error()
    } catch {
      setCurtido(!novoEstado)
      setCurtidas((n) => n + (novoEstado ? -1 : 1))
      toast.error("Não foi possível atualizar a curtida.")
    }
  }

  async function abrirComentarios() {
    const abrir = !comentariosAbertos
    setComentariosAbertos(abrir)
    if (abrir && comentarios.length === 0 && totalComentarios > 0) {
      setCarregandoComentarios(true)
      try {
        const res = await fetch(`/api/rede/posts/${post.id}/comentarios`)
        if (res.ok) setComentarios(await res.json())
      } catch {
        toast.error("Erro ao carregar comentários.")
      } finally {
        setCarregandoComentarios(false)
      }
    }
  }

  async function comentar() {
    const texto = novoComentario.trim()
    if (!texto) return
    setEnviandoComentario(true)
    try {
      const res = await fetch(`/api/rede/posts/${post.id}/comentarios`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ corpo: texto }),
      })
      if (res.status === 201) {
        setNovoComentario("")
        setTotalComentarios((n) => n + 1)
        const lista = await fetch(`/api/rede/posts/${post.id}/comentarios`)
        if (lista.ok) setComentarios(await lista.json())
        return
      }
      const data = await res.json().catch(() => null)
      if (data?.error === "pii_bloqueada") {
        toast.error("Seu comentário parece conter dados de paciente. Remova informações identificáveis.")
      } else if (data?.error === "crm_nao_verificado") {
        toast.error("Só médicos com CRM verificado podem comentar.")
      } else {
        toast.error("Não foi possível comentar.")
      }
    } catch {
      toast.error("Erro de conexão.")
    } finally {
      setEnviandoComentario(false)
    }
  }

  async function remover() {
    if (!confirm("Remover esta publicação?")) return
    try {
      const res = await fetch(`/api/rede/posts/${post.id}`, { method: "DELETE" })
      if (res.status === 204) {
        toast.success("Publicação removida.")
        onRemoved(post.id)
      } else {
        toast.error("Não foi possível remover.")
      }
    } catch {
      toast.error("Erro de conexão.")
    }
  }

  return (
    <Card className="border-border/60 bg-card/80">
      <CardContent className="p-5">
        <div className="flex items-start gap-3">
          <Link href={`/rede/perfil/${post.autorHandle}`}>
            <Avatar className="h-10 w-10">
              {post.autorFoto ? <AvatarImage src={post.autorFoto} alt={post.autorNome} /> : null}
              <AvatarFallback className="bg-primary/10 text-primary">{iniciais(post.autorNome)}</AvatarFallback>
            </Avatar>
          </Link>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <Link
                href={`/rede/perfil/${post.autorHandle}`}
                className="truncate text-sm font-semibold text-foreground hover:underline"
              >
                {post.autorNome}
              </Link>
              {post.autorVerificado && (
                <BadgeCheck className="h-4 w-4 flex-shrink-0 text-primary" aria-label="CRM verificado" />
              )}
              <span className="text-xs text-muted-foreground/60">· {tempoRelativo(post.criadoEm)}</span>
              {post.comunidadeNome && (
                <Badge variant="secondary" className="ml-1 text-[10px]">{post.comunidadeNome}</Badge>
              )}
              {post.meu ? (
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={remover}
                  className="ml-auto text-muted-foreground/50 hover:text-destructive"
                  aria-label="Remover publicação"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              ) : (
                <DenunciarDialog
                  alvoTipo="post"
                  alvoId={post.id}
                  trigger={
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="ml-auto text-muted-foreground/30 hover:text-destructive"
                      aria-label="Denunciar publicação"
                    >
                      <Flag className="h-3.5 w-3.5" />
                    </Button>
                  }
                />
              )}
            </div>
            {post.autorEspecialidade && (
              <p className="text-xs capitalize text-muted-foreground/70">{post.autorEspecialidade}</p>
            )}
            <p className="mt-2 whitespace-pre-wrap break-words text-sm text-foreground/90">{post.corpo}</p>

            <div className="mt-3 flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={alternarCurtir}
                className={cn("gap-1.5 text-muted-foreground hover:text-accent", curtido && "text-accent")}
              >
                <Heart className={cn("h-4 w-4", curtido && "fill-current")} />
                {curtidas > 0 ? curtidas : ""}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={abrirComentarios}
                className="gap-1.5 text-muted-foreground hover:text-primary"
              >
                <MessageCircle className="h-4 w-4" />
                {totalComentarios > 0 ? totalComentarios : ""}
              </Button>
            </div>

            {comentariosAbertos && (
              <div className="mt-3 space-y-3">
                <Separator className="bg-border/50" />
                {carregandoComentarios && (
                  <p className="text-xs text-muted-foreground">Carregando…</p>
                )}
                {comentarios.map((c) => (
                  <div key={c.id} className="flex items-start gap-2">
                    <Avatar className="h-7 w-7">
                      {c.autorFoto ? <AvatarImage src={c.autorFoto} alt={c.autorNome} /> : null}
                      <AvatarFallback className="bg-primary/10 text-[10px] text-primary">{iniciais(c.autorNome)}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1 rounded-lg bg-muted/30 px-3 py-2">
                      <div className="flex items-center gap-1.5">
                        <Link href={`/rede/perfil/${c.autorHandle}`} className="text-xs font-semibold text-foreground hover:underline">
                          {c.autorNome}
                        </Link>
                        {c.autorVerificado && <BadgeCheck className="h-3 w-3 text-primary" />}
                        <span className="text-[10px] text-muted-foreground/60">· {tempoRelativo(c.criadoEm)}</span>
                      </div>
                      <p className="mt-0.5 whitespace-pre-wrap break-words text-sm text-foreground/90">{c.corpo}</p>
                    </div>
                  </div>
                ))}
                {podeInteragir && (
                  <div className="flex items-start gap-2">
                    <Textarea
                      value={novoComentario}
                      onChange={(e) => setNovoComentario(e.target.value)}
                      placeholder="Escreva um comentário…"
                      rows={1}
                      maxLength={2000}
                      className="min-h-[38px] resize-none border-border/50 bg-muted/20 text-sm focus-visible:ring-primary/30"
                    />
                    <Button
                      size="sm"
                      onClick={comentar}
                      disabled={enviandoComentario || novoComentario.trim().length === 0}
                    >
                      Enviar
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
