import { Sparkles, Pill, Clock, ShieldCheck, AlertTriangle } from 'lucide-react'

const TABS = ['Resumo', 'Tratamento', 'Prescrições', 'Acompanhamento']

const PONTOS = [
  'Adesão medicamentosa de 92% nos últimos 30 dias.',
  'Humor em tendência de melhora desde a 2ª semana.',
  '3 entradas no diário mencionando melhora do sono.',
]
const SUGESTOES = [
  'Reforçar adesão e investigar possíveis efeitos colaterais.',
  'Avaliar ajuste de dose conforme resposta clínica.',
]
const PRESCRICOES = [
  { nome: 'Sertralina 50mg', dose: '1 comprimido pela manhã', horarios: ['08:00'] },
  { nome: 'Clonazepam 0,5mg', dose: '1 comprimido à noite', horarios: ['22:00'] },
]

/** Mockup "prontuário" — resumo pré-consulta IA + prescrições + alerta (ProductPreview). */
export function DashboardFullPreview() {
  return (
    <div className="w-full select-none bg-[#0A0E0E] p-4 text-left">
      {/* Header: paciente + abas */}
      <div className="mb-3 flex items-end justify-between gap-4 border-b border-[#00D9C0]/[0.08] pb-3">
        <div className="flex items-center gap-3">
          <span className="text-[30px] font-bold tabular-nums leading-none text-[#F5F7F7]">
            <span className="text-[#00D9C0]/40">#</span>03
          </span>
          <div>
            <div className="text-[16px] font-semibold tracking-tight text-[#F5F7F7]">
              Ana Beatriz Costa
            </div>
            <div className="text-[12px] text-[#9AA8A8]">37 anos · acompanhamento ativo</div>
          </div>
        </div>
        <div className="hidden gap-1 sm:flex">
          {TABS.map((t) => (
            <span
              key={t}
              className={`rounded-md px-2.5 py-1 text-[12px] font-medium ${t === 'Resumo' ? 'border-b-2 border-[#00D9C0] text-[#00D9C0]' : 'text-[#9AA8A8]'}`}
            >
              {t}
            </span>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-[1.5fr_1fr] gap-3">
        {/* Resumo pré-consulta IA */}
        <div className="rounded-xl border border-[#00D9C0]/10 bg-[#111818] p-4">
          <div className="mb-2 flex items-center gap-1.5">
            <Sparkles size={15} className="text-[#00D9C0]" />
            <span className="text-[13px] font-medium text-[#00D9C0]/80">
              Resumo pré-consulta · IA
            </span>
          </div>
          <p className="text-[13px] leading-relaxed text-[#D0D5D5]">
            No período de 24/04 a 24/05, Ana apresentou boa adesão e tendência de
            melhora no humor, com redução dos sintomas ansiosos relatados no diário.
          </p>

          <div className="mt-3">
            <div className="mb-1.5 flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-[#00D9C0]" />
              <span className="text-[13px] font-semibold text-[#00D9C0]">Pontos relevantes</span>
            </div>
            <ul className="space-y-1 pl-3">
              {PONTOS.map((p) => (
                <li key={p} className="relative text-[12px] leading-snug text-[#D0D5D5] before:absolute before:-left-3 before:top-[0.45em] before:h-1.5 before:w-1.5 before:rounded-full before:bg-[#00D9C0]/60">
                  {p}
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-3">
            <div className="mb-1.5 flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-[#00D9C0]" />
              <span className="text-[13px] font-semibold text-[#00D9C0]">Sugestões para a consulta</span>
            </div>
            <ul className="space-y-1 pl-3">
              {SUGESTOES.map((s) => (
                <li key={s} className="relative text-[12px] leading-snug text-[#D0D5D5] before:absolute before:-left-3 before:top-[0.45em] before:h-1.5 before:w-1.5 before:rounded-full before:bg-[#00D9C0]/60">
                  {s}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Direita: prescrições + alertas */}
        <div className="space-y-3">
          <div className="rounded-xl border border-[#00D9C0]/10 bg-[#111818] p-3">
            <div className="mb-2 flex items-center gap-1.5">
              <Pill size={15} className="text-[#00D9C0]" />
              <span className="text-[13px] font-semibold text-[#F5F7F7]">Prescrições ativas</span>
            </div>
            <div className="space-y-2">
              {PRESCRICOES.map((m) => (
                <div key={m.nome} className="rounded-lg border border-[#00D9C0]/[0.08] bg-[#0A0E0E] p-2">
                  <div className="text-[13px] font-semibold text-[#F5F7F7]">{m.nome}</div>
                  <div className="text-[11px] text-[#9AA8A8]">{m.dose}</div>
                  <div className="mt-1 flex gap-1">
                    {m.horarios.map((h) => (
                      <span key={h} className="inline-flex items-center gap-1 rounded-full border border-[#00D9C0]/25 bg-[#00D9C0]/10 px-1.5 py-0.5 text-[10px] font-medium tabular-nums text-[#00D9C0]">
                        <Clock size={10} /> {h}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-start gap-2 rounded-xl border border-emerald-500/25 bg-emerald-500/[0.08] p-2.5">
            <ShieldCheck size={15} className="mt-0.5 shrink-0 text-emerald-400" />
            <div className="text-[11px] leading-snug text-emerald-200">
              <span className="font-semibold text-emerald-300">Adesão em dia.</span> Paciente
              tomou todas as doses na última semana.
            </div>
          </div>

          <div className="flex items-start gap-2 rounded-xl border border-amber-500/25 bg-amber-500/[0.08] p-2.5">
            <AlertTriangle size={15} className="mt-0.5 shrink-0 text-amber-400" />
            <div className="text-[11px] leading-snug text-amber-200">
              <span className="font-semibold text-amber-300">Receita a vencer.</span> Clonazepam
              expira em 7 dias — renovar antes da próxima consulta.
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
