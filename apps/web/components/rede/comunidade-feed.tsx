"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { Header } from "@/components/header"
import { PostComposer } from "@/components/rede/post-composer"
import { PostCard } from "@/components/rede/post-card"
import { Sugestoes } from "@/components/rede/sugestoes"
import { ArrowLeft, Globe } from "lucide-react"
import type { Comunidade, PerfilMe, Post } from "@/lib/rede"

export function ComunidadeFeed({ slug }: { slug: string }) {
  const [me, setMe] = useState<PerfilMe | null>(null)
  const [comunidades, setComunidades] = useState<Comunidade[]>([])
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)

  const comunidade = comunidades.find((c) => c.slug === slug)

  const carregarFeed = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/rede/feed?comunidade=${encodeURIComponent(slug)}`)
      setPosts(res.ok ? await res.json() : [])
    } catch {
      setPosts([])
    } finally {
      setLoading(false)
    }
  }, [slug])

  useEffect(() => {
    fetch("/api/rede/perfil/me")
      .then((r) => (r.ok ? r.json() : null))
      .then(setMe)
      .catch(() => setMe(null))
    fetch("/api/rede/comunidades")
      .then((r) => (r.ok ? r.json() : []))
      .then(setComunidades)
      .catch(() => setComunidades([]))
  }, [])

  useEffect(() => {
    carregarFeed()
  }, [carregarFeed])

  const podeInteragir = me?.verificado ?? false

  return (
    <div className="min-h-screen">
      <Header
        title={comunidade?.nome ?? slug}
        subtitle={comunidade?.descricao ?? "Comunidade"}
      />
      <div className="mx-auto grid max-w-5xl gap-6 p-8 lg:grid-cols-[1fr_280px]">
        <div className="space-y-5">
          <Link href="/rede" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Voltar ao feed
          </Link>

          <PostComposer
            me={me}
            comunidades={comunidades}
            onCreated={carregarFeed}
            comunidadePadrao={comunidade?.id}
          />

          {loading ? (
            <div className="space-y-3">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-32 animate-pulse rounded-xl bg-muted/40" />
              ))}
            </div>
          ) : posts.length === 0 ? (
            <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border/60 py-16 text-center">
              <Globe className="h-8 w-8 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">
                Ainda não há publicações nesta comunidade.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {posts.map((p) => (
                <PostCard
                  key={p.id}
                  post={p}
                  podeInteragir={podeInteragir}
                  onRemoved={(id) => setPosts((cur) => cur.filter((x) => x.id !== id))}
                />
              ))}
            </div>
          )}
        </div>
        <aside className="hidden lg:block">
          <Sugestoes />
        </aside>
      </div>
    </div>
  )
}
