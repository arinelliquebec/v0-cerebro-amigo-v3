import { Suspense } from 'react'
import { Pill, AlertTriangle } from 'lucide-react'
import { fetchPaciente } from '@/lib/api-paciente'
import { PageHeader } from '@/components/paciente/page-header'
import { PaperCard } from '@/components/paciente/paper-card'

type Medicacao = {
  id: string
  medicamento: string
  doseDescricao: string
  horarios: string[]
  inicioEm: string
  observacoes: string | null
}

async function Lista() {
  const meds = await fetchPaciente<Medicacao[]>('/api/v1/portal/paciente/medicacoes')

  if (meds.length === 0) {
    return (
      <PaperCard className="mx-5 px-6 py-12 text-center">
        <Pill size={32} className="mx-auto text-[#00D9C0]/60" />
        <p className="mt-5 text-[20px] font-semibold tracking-tight text-[#F5F7F7]">
          Sem medicações ativas
        </p>
        <p className="mt-2 text-[15px] text-[#D0D5D5]/80">
          Quando seu/sua médico(a) prescrever algo, aparecerá aqui.
        </p>
      </PaperCard>
    )
  }

  return (
    <div className="space-y-4 px-5">
      {meds.map((m, i) => (
        <PaperCard key={m.id}>
          <div className="flex items-start justify-between gap-3 px-5 pt-5">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#00D9C0]" />
                <span className="text-[13px] font-medium text-[#00D9C0]/70">
                  Prescrição
                </span>
              </div>
              <h3 className="mt-2 text-[22px] font-bold tracking-tight leading-tight text-[#F5F7F7]">
                {m.medicamento}
              </h3>
              <p className="mt-1.5 text-[15px] text-[#D0D5D5]/80">{m.doseDescricao}</p>
            </div>
            <span className="text-[13px] font-medium tabular-nums text-[#9AA8A8]">
              #{String(i + 1).padStart(2, '0')}
            </span>
          </div>

          <div className="mt-5 px-5">
            <div className="text-[13px] font-medium text-[#D0D5D5] mb-2">
              Horários
            </div>
            <div className="flex flex-wrap gap-2">
              {(m.horarios ?? []).map((h, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center rounded-full border border-[#00D9C0]/25 bg-[#00D9C0]/10 px-3 py-1 text-[14px] font-semibold tabular-nums text-[#00D9C0]"
                >
                  {typeof h === 'string' ? h.slice(0, 5) : h}
                </span>
              ))}
            </div>
          </div>

          {m.observacoes && (
            <div className="mx-5 mt-5 border-l-2 border-[#00D9C0]/40 pl-4">
              <p className="italic text-[14px] leading-relaxed text-[#D0D5D5]">
                {m.observacoes}
              </p>
            </div>
          )}

          <div className="mt-5 flex items-center justify-between border-t border-[#00D9C0]/[0.06] px-5 py-3.5">
            <span className="text-[13px] text-[#9AA8A8]">
              Iniciada em
            </span>
            <span className="text-[14px] font-medium tabular-nums text-[#F5F7F7]">
              {new Date(m.inicioEm).toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
              })}
            </span>
          </div>
        </PaperCard>
      ))}
    </div>
  )
}

function ListaSkeleton() {
  return (
    <div className="space-y-4 px-5">
      {[1, 2].map((i) => (
        <div key={i} className="h-48 rounded-2xl bg-[#111818] border border-[#00D9C0]/[0.05] animate-pulse" />
      ))}
    </div>
  )
}

export default function MedicacoesPage() {
  return (
    <>
      <PageHeader
        eyebrow="Tratamento"
        title="Suas"
        italic="medicações"
        kicker="Receita ativa, com horários e observações de quem te acompanha."
      />
      <Suspense fallback={<ListaSkeleton />}>
        <Lista />
      </Suspense>

      <div className="mx-5 mt-6 flex items-start gap-2 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3.5">
        <AlertTriangle size={16} className="mt-0.5 shrink-0 text-amber-400" />
        <div className="text-[14px] leading-relaxed text-amber-200">
          <span className="font-semibold text-amber-300">Atenção:</span>{' '}
          Para qualquer mudança na medicação, fale com seu/sua médico(a). Nunca pare ou ajuste por conta própria.
        </div>
      </div>
    </>
  )
}
