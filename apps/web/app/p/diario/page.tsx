import Link from "next/link"
import { cookies } from "next/headers"
import { Plus, Mic, PenLine, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"

interface DiarioEntrada {
  id: string
  titulo: string | null
  conteudo: string
  humor: number | null
  tags: string[]
  compartilhada_com_medico: boolean
  criada_em: string
  tipo: string
  transcricao: string | null
}

async function carregarEntradas(): Promise<DiarioEntrada[]> {
  const cookieStore = await cookies()
  const token = cookieStore.get("paciente_token")?.value
  if (!token) return []

  const gateway = process.env.API_GATEWAY_URL ?? "http://localhost:5050"
  try {
    const res = await fetch(`${gateway}/api/v1/portal/paciente/diario/?pageSize=30`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    })
    if (!res.ok) return []
    return res.json()
  } catch {
    return []
  }
}

export default async function DiarioPage() {
  const entradas = await carregarEntradas()

  return (
    <div className="px-4 py-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Diário</h1>
          <p className="text-sm text-muted-foreground">
            {entradas.length === 0
              ? "Nenhuma entrada ainda"
              : `${entradas.length} entr${entradas.length === 1 ? "ada" : "adas"}`}
          </p>
        </div>
        <Button asChild size="sm">
          <Link href="/p/diario/nova">
            <Plus className="w-4 h-4 mr-1" />
            Nova entrada
          </Link>
        </Button>
      </div>

      {/* Lista */}
      {entradas.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="space-y-3">
          {entradas.map(e => (
            <EntradaCard key={e.id} entrada={e} />
          ))}
        </div>
      )}
    </div>
  )
}

function EntradaCard({ entrada }: { entrada: DiarioEntrada }) {
  const preview = entrada.conteudo.slice(0, 120)
  const temMais = entrada.conteudo.length > 120
  const quando = formatDistanceToNow(new Date(entrada.criada_em), {
    addSuffix: true,
    locale: ptBR,
  })

  return (
    <Link
      href={`/p/diario/${entrada.id}`}
      className="block rounded-xl border bg-card p-4 hover:bg-accent/40 transition-colors"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          {/* Título e ícone de tipo */}
          <div className="flex items-center gap-2 mb-1">
            {entrada.tipo === "audio" ? (
              <Mic className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
            ) : (
              <PenLine className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
            )}
            {entrada.titulo ? (
              <span className="font-medium text-sm truncate">{entrada.titulo}</span>
            ) : (
              <span className="text-sm text-muted-foreground italic">Sem título</span>
            )}
          </div>

          {/* Preview do conteúdo */}
          <p className="text-sm text-muted-foreground line-clamp-2">
            {preview}{temMais && "…"}
          </p>

          {/* Meta: quando + humor + tags */}
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <span className="text-xs text-muted-foreground">{quando}</span>
            {entrada.humor != null && (
              <HumorBadge humor={entrada.humor} />
            )}
            {entrada.compartilhada_com_medico && (
              <Badge variant="outline" className="text-[10px] h-4 px-1.5">
                Compartilhado
              </Badge>
            )}
            {entrada.tags.slice(0, 3).map(t => (
              <Badge key={t} variant="secondary" className="text-[10px] h-4 px-1.5">
                {t}
              </Badge>
            ))}
          </div>
        </div>
        <ChevronRight className="w-4 h-4 text-muted-foreground mt-1 shrink-0" />
      </div>
    </Link>
  )
}

function HumorBadge({ humor }: { humor: number }) {
  const emoji =
    humor >= 8 ? "😊" : humor >= 6 ? "🙂" : humor >= 4 ? "😐" : humor >= 2 ? "😔" : "😢"
  return (
    <span className="text-xs tabular-nums text-muted-foreground">
      {emoji} {humor}/10
    </span>
  )
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center gap-4 py-16 text-center">
      <div className="text-5xl">📔</div>
      <div>
        <p className="font-medium">Seu diário está vazio</p>
        <p className="text-sm text-muted-foreground mt-1">
          Registre como você está se sentindo — por escrito ou gravando um áudio rápido.
        </p>
      </div>
      <Button asChild>
        <Link href="/p/diario/nova">
          <Plus className="w-4 h-4 mr-1" />
          Primeira entrada
        </Link>
      </Button>
    </div>
  )
}
