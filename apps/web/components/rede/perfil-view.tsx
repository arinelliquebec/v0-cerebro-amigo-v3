"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { toast } from "sonner"
import { Header } from "@/components/header"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { PerfilEditDialog } from "@/components/rede/perfil-edit-dialog"
import { ArrowLeft, BadgeCheck, MapPin, Building2, Pencil, Crown } from "lucide-react"
import type { PerfilPublico } from "@/lib/rede"
import { iniciais, isPremium } from "@/lib/rede"

export function PerfilView({ handle }: { handle: string }) {
  const [perfil, setPerfil] = useState<PerfilPublico | null>(null)
  const [loading, setLoading] = useState(true)
  const [naoEncontrado, setNaoEncontrado] = useState(false)
  const [acaoFollow, setAcaoFollow] = useState(false)

  async function carregar() {
    setLoading(true)
    try {
      const res = await fetch(`/api/rede/perfil/${encodeURIComponent(handle)}`)
      if (res.status === 404) {
        setNaoEncontrado(true)
        return
      }
      if (res.ok) setPerfil(await res.json())
    } catch {
      setNaoEncontrado(true)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    carregar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [handle])

  async function alternarSeguir() {
    if (!perfil) return
    const seguir = !perfil.seguindoEu
    setAcaoFollow(true)
    try {
      const res = await fetch(`/api/rede/seguir/${perfil.medicoId}`, {
        method: seguir ? "POST" : "DELETE",
      })
      if (res.status === 204) {
        setPerfil({
          ...perfil,
          seguindoEu: seguir,
          seguidores: perfil.seguidores + (seguir ? 1 : -1),
        })
      } else {
        const data = await res.json().catch(() => null)
        if (data?.error === "crm_nao_verificado") toast.error("Verifique seu CRM para seguir médicos.")
        else toast.error("Não foi possível atualizar.")
      }
    } catch {
      toast.error("Erro de conexão.")
    } finally {
      setAcaoFollow(false)
    }
  }

  return (
    <div className="min-h-screen">
      <Header title="Perfil" subtitle="Comunidade Cérebro Amigo" />
      <div className="mx-auto max-w-2xl space-y-4 p-8">
        <Link href="/rede" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Voltar ao feed
        </Link>

        {loading ? (
          <div className="h-56 animate-pulse rounded-xl bg-muted/40" />
        ) : naoEncontrado || !perfil ? (
          <Card className="border-border/60">
            <CardContent className="py-16 text-center text-sm text-muted-foreground">
              Perfil não encontrado.
            </CardContent>
          </Card>
        ) : (
          <Card className="overflow-hidden border-border/60">
            <div
              className="h-28 bg-gradient-to-r from-primary/20 to-accent/15"
              style={perfil.capaUrl ? { backgroundImage: `url(${perfil.capaUrl})`, backgroundSize: "cover", backgroundPosition: "center" } : undefined}
            />
            <CardContent className="p-6">
              <div className="-mt-14 flex items-end justify-between">
                <Avatar className="h-20 w-20 border-4 border-card">
                  {perfil.fotoUrl ? <AvatarImage src={perfil.fotoUrl} alt={perfil.nome} /> : null}
                  <AvatarFallback className="bg-primary/10 text-xl text-primary">{iniciais(perfil.nome)}</AvatarFallback>
                </Avatar>
                {perfil.souEu ? (
                  <PerfilEditDialog
                    perfil={perfil}
                    onSaved={carregar}
                    trigger={
                      <Button variant="outline" size="sm" className="gap-1.5 rounded-full">
                        <Pencil className="h-3.5 w-3.5" /> Editar perfil
                      </Button>
                    }
                  />
                ) : (
                  <Button
                    size="sm"
                    variant={perfil.seguindoEu ? "outline" : "default"}
                    onClick={alternarSeguir}
                    disabled={acaoFollow}
                    className="rounded-full"
                  >
                    {perfil.seguindoEu ? "Seguindo" : "Seguir"}
                  </Button>
                )}
              </div>

              <div className="mt-3">
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-semibold text-foreground">{perfil.nome}</h2>
                  {perfil.verificado && <BadgeCheck className="h-5 w-5 text-primary" aria-label="CRM verificado" />}
                  {isPremium(perfil.plano) && <Crown className="h-4.5 w-4.5 text-amber-500" aria-label={`Plano ${perfil.plano}`} />}
                </div>
                <p className="text-sm text-muted-foreground/80">@{perfil.handle}</p>
                {perfil.especialidade && (
                  <p className="mt-0.5 text-sm capitalize text-muted-foreground">{perfil.especialidade}</p>
                )}
              </div>

              {perfil.bio && <p className="mt-3 whitespace-pre-wrap text-sm text-foreground/90">{perfil.bio}</p>}

              <div className="mt-3 flex flex-wrap gap-4 text-sm text-muted-foreground">
                {perfil.cidade && (
                  <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {perfil.cidade}</span>
                )}
                {perfil.instituicao && (
                  <span className="inline-flex items-center gap-1"><Building2 className="h-3.5 w-3.5" /> {perfil.instituicao}</span>
                )}
              </div>

              <div className="mt-4 flex gap-5 border-t border-border/40 pt-4 text-sm">
                <span><strong className="text-foreground">{perfil.posts}</strong> <span className="text-muted-foreground">publicações</span></span>
                <span><strong className="text-foreground">{perfil.seguidores}</strong> <span className="text-muted-foreground">seguidores</span></span>
                <span><strong className="text-foreground">{perfil.seguindo}</strong> <span className="text-muted-foreground">seguindo</span></span>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
