import { Suspense } from 'react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'
import { fetchApi } from '@/lib/api'
import { Hero } from './components/Hero'
import { FichaTabs } from './FichaTabs'
import { TabResumo } from './components/TabResumo'
import { TabTratamento } from './components/TabTratamento'
import { TabAcompanhamento } from './components/TabAcompanhamento'
import { TabEventos } from './components/TabEventos'
import { TabNotas } from './components/TabNotas'
import { PrescricoesManager } from './prescricoes/manager'
import type { Prescricao } from './prescricoes/page' 

type PacienteCompleto = {
  numero: number
  id: string
  waId: string | null
  nome: string | null
  email: string | null
  cpf: string | null
  dataNascimento: string | null
  consentimentoLgpdEm: string | null
  prescricoesAtivas: number
  ultimaMsg: string | null
}

function PanelSkeleton() {
  return (
    <div className="flex items-center gap-2 px-1 py-8 text-[15px] text-[#9AA8A8]">
      <span className="block h-2 w-2 animate-pulse rounded-full bg-[#00D9C0]" />
      Carregando…
    </div>
  )
}

export default async function PacienteDetalhePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const [lista, prescricoes] = await Promise.all([
    fetchApi<PacienteCompleto[]>('/api/v1/pacientes'),
    fetchApi<Prescricao[]>(`/api/v1/prescricoes/paciente/${id}`),
  ])
  const paciente = lista.find((p) => p.id === id)
  if (!paciente) notFound()

  return (
    <div className="mx-auto max-w-[1400px] space-y-8 px-8 py-10">
      <Link
        href="/dashboard/pacientes"
        className="inline-flex items-center gap-1.5 text-[13px] font-medium text-[#9AA8A8] transition-colors hover:text-[#00D9C0]"
      >
        <ChevronLeft size={16} strokeWidth={2} /> Voltar à lista
      </Link>

      <Hero paciente={paciente} />

      <FichaTabs
        resumo={
          <Suspense fallback={<PanelSkeleton />}>
            <TabResumo paciente={paciente} id={id} />
          </Suspense>
        }
        tratamento={
          <Suspense fallback={<PanelSkeleton />}>
            <TabTratamento id={id} />
          </Suspense>
        }
        prescricoes={
          <PrescricoesManager
            embedded
            pacienteId={id}
            paciente={paciente}
            prescricoesIniciais={prescricoes}
          />
        }
        acompanhamento={
          <Suspense fallback={<PanelSkeleton />}>
            <TabAcompanhamento id={id} />
          </Suspense>
        }
        eventos={
          <Suspense fallback={<PanelSkeleton />}>
            <TabEventos id={id} />
          </Suspense>
        }
        notas={<TabNotas />}
      />
    </div>
  )
}
