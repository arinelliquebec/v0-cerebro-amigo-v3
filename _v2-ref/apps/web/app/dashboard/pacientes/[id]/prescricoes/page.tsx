import { notFound } from 'next/navigation'
import { fetchApi } from '@/lib/api'
import { PrescricoesManager } from './manager'

type PacienteResumo = {
  numero: number
  id: string
  nome: string | null
  email: string | null
  waId: string | null
}

export type Prescricao = {
  id: string
  pacienteId: string
  medicamento: string
  doseDescricao: string
  horarios: string[] // HH:MM:SS
  inicioEm: string
  fimEm: string | null
  receitaTipo: string | null
  receitaValidade: string | null
  observacoes: string | null
  ativa: boolean
  criadaEm: string
}

export const metadata = { title: 'Prescrições' }

export default async function PrescricoesPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  // Busca em paralelo: paciente (extraído da listagem) + prescrições.
  // `fetchApi` é Server Component-only — usa Authorization automático.
  const [lista, prescricoes] = await Promise.all([
    fetchApi<PacienteResumo[]>('/api/v1/pacientes'),
    fetchApi<Prescricao[]>(`/api/v1/prescricoes/paciente/${id}`),
  ])

  const paciente = lista.find((p) => p.id === id)
  if (!paciente) notFound()

  return (
    <PrescricoesManager
      pacienteId={id}
      paciente={paciente}
      prescricoesIniciais={prescricoes}
    />
  )
}
