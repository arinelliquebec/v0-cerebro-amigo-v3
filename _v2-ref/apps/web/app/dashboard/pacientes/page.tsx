import Link from 'next/link'
import { Suspense } from 'react'
import { Plus, Users } from 'lucide-react'
import { fetchApi } from '@/lib/api'
import {
  PacientesListClient,
  type PacienteRow,
} from './PacientesListClient'

export const metadata = { title: 'Pacientes' }

async function Lista() {
  const pacientes = await fetchApi<PacienteRow[]>('/api/v1/pacientes')
  return <PacientesListClient pacientes={pacientes} />
}

function ListaSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          className="h-20 rounded-2xl bg-[#111818] border border-[#00D9C0]/[0.05] animate-pulse"
        />
      ))}
    </div>
  )
}

export default function PacientesPage() {
  return (
    <div className="mx-auto max-w-[1400px] space-y-8 px-8 py-10">
      {/* Header */}
      <header className="flex flex-col gap-4 border-b border-[#00D9C0]/[0.08] pb-8 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00D9C0]" />
            <span className="text-[13px] font-medium text-[#00D9C0]/70">
              Portal do médico
            </span>
          </div>
          <h1 className="text-[32px] font-bold tracking-tight text-[#F5F7F7]">
            Seus <span className="text-[#00D9C0]">pacientes</span>
          </h1>
          <p className="mt-2 max-w-md text-[15px] text-[#D0D5D5]/80">
            Busque, ordene e acesse cada ficha. Numeração estável por médico —
            paciente nº 01 é o primeiro que você cadastrou.
          </p>
        </div>

        <Link
          href="/dashboard/pacientes/novo"
          className="group inline-flex items-center gap-2 self-start rounded-xl border border-[#00D9C0]/30 bg-[#00D9C0]/10 px-5 py-3 text-[15px] font-medium text-[#00D9C0] transition-all duration-300 hover:border-[#00D9C0]/50 hover:bg-[#00D9C0]/15"
          style={{ boxShadow: '0 0 24px rgba(0, 217, 192, 0.08)' }}
        >
          <Plus
            size={18}
            strokeWidth={2}
            className="transition-transform group-hover:rotate-90"
          />
          Novo paciente
        </Link>
      </header>

      <Suspense fallback={<ListaSkeleton />}>
        <Lista />
      </Suspense>
    </div>
  )
}
