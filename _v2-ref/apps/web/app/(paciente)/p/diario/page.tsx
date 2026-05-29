import Link from 'next/link'
import { Suspense } from 'react'
import { Plus, Eye, EyeOff, BookOpen, ArrowUpRight } from 'lucide-react'
import { fetchPaciente } from '@/lib/api-paciente'
import { PageHeader } from '@/components/paciente/page-header'
import { PaperCard } from '@/components/paciente/paper-card'

type Entrada = {
  id: string
  titulo: string | null
  conteudo: string
  humor: number | null
  tags: string[]
  compartilhadaComMedico: boolean
  criadaEm: string
}

async function Lista() {
  const entradas = await fetchPaciente<Entrada[]>('/api/v1/portal/paciente/diario')

  if (entradas.length === 0) {
    return (
      <PaperCard className="mx-5 px-6 py-12 text-center">
        <BookOpen size={32} className="mx-auto text-[#00D9C0]/60" />
        <p className="mt-5 text-[22px] font-bold tracking-tight leading-tight text-[#F5F7F7]">
          Página em <span className="text-[#00D9C0]">branco.</span>
        </p>
        <p className="mt-2 text-[15px] leading-relaxed text-[#D0D5D5]/80">
          Comece quando quiser — qualquer coisa que valha registrar.
        </p>
        <Link
          href="/p/diario/nova"
          className="mt-6 inline-flex items-center gap-2 rounded-full border border-[#00D9C0]/40 bg-[#00D9C0]/10 px-5 py-2.5 text-[14px] font-semibold text-[#00D9C0] transition-all duration-300 hover:border-[#00D9C0]/60 hover:bg-[#00D9C0]/20"
          style={{ boxShadow: '0 0 20px rgba(0, 217, 192, 0.12)' }}
        >
          <Plus size={16} />
          Primeira entrada
        </Link>
      </PaperCard>
    )
  }

  return (
    <div className="space-y-3 px-5">
      {entradas.map((e, i) => (
        <Link key={e.id} href={`/p/diario/${e.id}`} className="group block">
          <article className="relative overflow-hidden rounded-2xl border border-[#00D9C0]/[0.08] bg-[#111818] p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-[#00D9C0]/25">
            <div className="flex items-start gap-3">
              <span className="mt-1 text-[13px] font-medium tabular-nums text-[#9AA8A8]">
                #{String(i + 1).padStart(2, '0')}
              </span>

              <div className="min-w-0 flex-1">
                {e.titulo && (
                  <h3 className="text-[17px] font-semibold tracking-tight leading-tight text-[#F5F7F7]">
                    {e.titulo}
                  </h3>
                )}
                <p className="mt-1.5 line-clamp-2 text-[14px] leading-relaxed text-[#D0D5D5]/80">
                  {e.conteudo}
                </p>

                <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-[#9AA8A8]">
                  <time className="tabular-nums">
                    {new Date(e.criadaEm).toLocaleString('pt-BR', {
                      dateStyle: 'short',
                      timeStyle: 'short',
                    })}
                  </time>
                  {e.humor != null && (
                    <span className="text-[#00D9C0] font-medium tabular-nums">
                      humor · {e.humor}/10
                    </span>
                  )}
                  {e.tags?.length > 0 && (
                    <span className="lowercase">
                      {e.tags.slice(0, 2).map((t) => `#${t}`).join(' ')}
                    </span>
                  )}
                </div>
              </div>

              <div
                className="shrink-0"
                title={
                  e.compartilhadaComMedico
                    ? 'Compartilhada com seu/sua médico(a)'
                    : 'Privada — só você vê'
                }
              >
                {e.compartilhadaComMedico ? (
                  <Eye size={15} className="text-[#00D9C0]" />
                ) : (
                  <EyeOff size={15} className="text-[#9AA8A8]" />
                )}
              </div>
            </div>

            <ArrowUpRight
              size={15}
              className="absolute right-3 top-3 text-[#9AA8A8] opacity-0 transition-all duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-[#00D9C0] group-hover:opacity-100"
            />
          </article>
        </Link>
      ))}
    </div>
  )
}

function ListaSkeleton() {
  return (
    <div className="space-y-3 px-5">
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-24 rounded-2xl bg-[#111818] border border-[#00D9C0]/[0.05] animate-pulse" />
      ))}
    </div>
  )
}

export default function DiarioPage() {
  return (
    <>
      <PageHeader eyebrow="Diário" title="Suas" italic="páginas">
        <Link
          href="/p/diario/nova"
          aria-label="Nova entrada"
          className="absolute right-5 top-8 grid h-12 w-12 place-items-center rounded-full border border-[#00D9C0]/40 bg-[#00D9C0]/10 text-[#00D9C0] transition-all duration-300 hover:rotate-90 hover:border-[#00D9C0]/60 hover:bg-[#00D9C0]/20"
          style={{ boxShadow: '0 0 24px rgba(0, 217, 192, 0.15)' }}
        >
          <Plus size={20} strokeWidth={2.4} />
        </Link>
      </PageHeader>

      <Suspense fallback={<ListaSkeleton />}>
        <Lista />
      </Suspense>
    </>
  )
}
