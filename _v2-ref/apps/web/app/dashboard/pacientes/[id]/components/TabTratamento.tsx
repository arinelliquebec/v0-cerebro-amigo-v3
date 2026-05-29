import Link from 'next/link'
import { Pill, ArrowUpRight } from 'lucide-react'
import { fetchApi } from '@/lib/api'

type Adesao = {
  medicamento: string
  tomadas: number
  faltas: number
  total: number
  percentualAdesao: number | null
}

export async function TabTratamento({ id }: { id: string }) {
  const dados = await fetchApi<Adesao[]>('/api/v1/pacientes/' + id + '/adesao')

  if (dados.length === 0) {
    return (
      <div className="space-y-6">
        <section className="rounded-2xl border border-[#00D9C0]/[0.08] bg-[#111818] p-10 text-center">
          <Pill size={32} className="mx-auto text-[#00D9C0]/60" />
          <p className="mt-5 text-[18px] font-semibold text-[#F5F7F7]">
            Sem prescrições ativas
          </p>
          <p className="mt-2 text-[15px] text-[#D0D5D5]/80">
            Comece prescrevendo o primeiro medicamento.
          </p>
          <Link
            href={'/dashboard/pacientes/' + id + '/prescricoes/nova'}
            className="mt-6 inline-flex items-center gap-2 rounded-xl border border-[#00D9C0]/30 bg-[#00D9C0]/10 px-4 py-2.5 text-[14px] font-medium text-[#00D9C0] transition-all hover:border-[#00D9C0]/50 hover:bg-[#00D9C0]/15"
          >
            Nova prescrição
          </Link>
        </section>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-[#00D9C0]/[0.08] bg-[#111818] p-6">
        <header className="mb-6 flex items-end justify-between">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00D9C0]" />
            <h2 className="text-[13px] font-medium text-[#00D9C0]/70">
              Adesão · últimos 30 dias
            </h2>
          </div>
          <span className="text-[13px] text-[#9AA8A8]">
            {dados.length} {dados.length === 1 ? 'medicamento' : 'medicamentos'}
          </span>
        </header>

        <div className="space-y-5">
          {dados.map((d) => (
            <BarraAdesao key={d.medicamento} d={d} />
          ))}
        </div>
      </section>

      <Link
        href={'/dashboard/pacientes/' + id + '/prescricoes'}
        className="group flex items-center justify-between rounded-2xl border border-[#00D9C0]/[0.15] bg-[#111818] px-5 py-4 text-[15px] text-[#F5F7F7] transition-all hover:border-[#00D9C0]/30 hover:bg-[#00D9C0]/8"
      >
        <span className="flex items-center gap-2.5">
          <Pill size={18} strokeWidth={2} className="text-[#00D9C0]" />
          <span className="font-medium">Gerenciar prescrições</span>
        </span>
        <ArrowUpRight
          size={18}
          className="text-[#9AA8A8] transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-[#00D9C0]"
        />
      </Link>

      <section className="rounded-2xl border border-[#00D9C0]/[0.08] bg-[#111818] p-6">
        <div className="flex items-center gap-2 mb-3">
          <span className="w-1.5 h-1.5 rounded-full bg-[#00D9C0]" />
          <h2 className="text-[13px] font-medium text-[#00D9C0]/70">
            Mapa de medicamentos · histórico
          </h2>
        </div>
        <p className="text-[15px] leading-relaxed text-[#D0D5D5]/80">
          Em breve: histórico completo de prescrições anteriores com motivo de
          cada troca, ajuste de dose e interrupção. Vai virar referência clínica
          entre consultas (precisa de migration nova — próxima sessão).
        </p>
      </section>
    </div>
  )
}

function BarraAdesao({ d }: { d: Adesao }) {
  const pct = d.percentualAdesao ?? 0
  const tone = pct >= 80 ? 'good' : pct >= 50 ? 'warn' : 'bad'

  const styleMap = {
    good: { text: 'text-emerald-300', bar: 'bg-emerald-500/70', track: 'bg-emerald-500/10' },
    warn: { text: 'text-amber-300', bar: 'bg-amber-500/70', track: 'bg-amber-500/10' },
    bad: { text: 'text-red-300', bar: 'bg-red-500/70', track: 'bg-red-500/10' },
  } as const
  const s = styleMap[tone]

  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between">
        <span className="text-[15px] font-medium text-[#F5F7F7]">{d.medicamento}</span>
        <span className={'text-[16px] font-semibold tabular-nums ' + s.text}>
          {d.percentualAdesao != null ? pct.toFixed(0) + '%' : '—'}
        </span>
      </div>
      <div className={'h-2 overflow-hidden rounded-full ' + s.track}>
        <div
          className={'h-full transition-all duration-700 ' + s.bar}
          style={{ width: pct + '%' }}
          role="progressbar"
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
      <div className="mt-2 text-[13px] text-[#9AA8A8] tabular-nums">
        {d.tomadas} tomadas · {d.faltas} faltas · {d.total} previstas
      </div>
    </div>
  )
}
