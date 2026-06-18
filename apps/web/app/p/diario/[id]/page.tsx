import Link from "next/link"
import { cookies } from "next/headers"
import { notFound } from "next/navigation"
import { ArrowLeft, Mic, PenLine } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

interface DiarioEntrada {
  id: string
  titulo: string | null
  conteudo: string
  humor: number | null
  tags: string[]
  compartilhadaComMedico: boolean
  criadaEm: string
  atualizadaEm: string
  tipo: string
  transcricao: string | null
}

async function carregarEntrada(id: string): Promise<DiarioEntrada | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get("paciente_token")?.value
  if (!token) return null

  const gateway = process.env.API_GATEWAY_URL ?? "http://localhost:5050"
  try {
    const res = await fetch(`${gateway}/api/v1/portal/paciente/diario/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    })
    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  }
}

export default async function DiarioDetalhePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const entrada = await carregarEntrada(id)
  if (!entrada) notFound()

  const quando = format(new Date(entrada.criadaEm), "d 'de' MMMM 'de' yyyy', às' HH:mm", {
    locale: ptBR,
  })

  return (
    <div className="px-4 py-6 space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="icon">
          <Link href="/p/diario" aria-label="Voltar para o diário">
            <ArrowLeft className="w-5 h-5" />
          </Link>
        </Button>
        <h1 className="text-lg font-semibold truncate">
          {entrada.titulo ?? "Entrada do diário"}
        </h1>
      </div>

      {/* Meta */}
      <div className="flex items-center gap-2 flex-wrap text-sm text-muted-foreground">
        {entrada.tipo === "audio" ? (
          <span className="inline-flex items-center gap-1">
            <Mic className="w-3.5 h-3.5" /> Áudio transcrito
          </span>
        ) : (
          <span className="inline-flex items-center gap-1">
            <PenLine className="w-3.5 h-3.5" /> Texto
          </span>
        )}
        <span>·</span>
        <span>{quando}</span>
        {entrada.humor != null && <HumorBadge humor={entrada.humor} />}
        {entrada.compartilhadaComMedico && (
          <Badge variant="outline" className="text-[10px] h-4 px-1.5">
            Compartilhado
          </Badge>
        )}
      </div>

      {/* Tags */}
      {entrada.tags.length > 0 && (
        <div className="flex gap-1.5 flex-wrap">
          {entrada.tags.map(t => (
            <Badge key={t} variant="secondary" className="text-xs">
              {t}
            </Badge>
          ))}
        </div>
      )}

      {/* Conteúdo */}
      <div className="rounded-xl border bg-card p-4">
        <p className="text-sm whitespace-pre-wrap leading-relaxed">
          {entrada.conteudo}
        </p>
      </div>
    </div>
  )
}

function HumorBadge({ humor }: { humor: number }) {
  const emoji =
    humor >= 8 ? "😊" : humor >= 6 ? "🙂" : humor >= 4 ? "😐" : humor >= 2 ? "😔" : "😢"
  return (
    <span className="text-xs tabular-nums">
      {emoji} {humor}/10
    </span>
  )
}
