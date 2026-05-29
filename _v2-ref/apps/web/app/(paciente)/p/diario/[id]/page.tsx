import { notFound } from 'next/navigation'
import { fetchPaciente } from '@/lib/api-paciente'
import { EntradaClient } from './EntradaClient'

type Entrada = {
  id: string
  titulo: string | null
  conteudo: string
  humor: number | null
  tags: string[]
  compartilhadaComMedico: boolean
  criadaEm: string
  atualizadaEm: string
}

export default async function EntradaPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  let entrada: Entrada | null = null
  try {
    entrada = await fetchPaciente<Entrada>(`/api/v1/portal/paciente/diario/${id}`)
  } catch {
    notFound()
  }

  if (!entrada) notFound()

  return <EntradaClient entrada={entrada} />
}
