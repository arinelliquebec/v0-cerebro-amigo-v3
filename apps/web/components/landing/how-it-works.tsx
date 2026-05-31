'use cache'

import { cacheLife } from 'next/cache'
import { ClipboardList, Smartphone, ShieldAlert, Brain } from 'lucide-react'

const steps = [
  {
    number: '01',
    label: 'Consulta',
    icon: ClipboardList,
    title: 'Plano de acompanhamento',
    description:
      'Médico registra frequência de check-ins, medicações e metas clínicas. Ponto de partida do ciclo.',
  },
  {
    number: '02',
    label: 'Entre consultas',
    icon: Smartphone,
    title: 'Acompanhamento automático',
    description:
      'Sistema envia check-ins no intervalo definido. Paciente responde pelo celular, sem precisar instalar app.',
  },
  {
    number: '03',
    label: 'Monitoramento',
    icon: ShieldAlert,
    title: 'IA monitora e alerta',
    description:
      'IA analisa respostas em tempo real. Em sinal de risco, médico é notificado imediatamente com protocolo fixo e aprovado.',
  },
  {
    number: '04',
    label: 'Pré-retorno',
    icon: Brain,
    title: 'Briefing pré-consulta com IA',
    description:
      'IA consolida humor, aderência e eventos do intervalo num briefing estruturado. Médico chega ao retorno preparado, sem improvisar.',
    highlight: true,
  },
]

export async function HowItWorks() {
  cacheLife('days')

  return (
    <div className="relative">
      {/* Vertical line */}
      <div className="absolute left-[19px] sm:left-[111px] top-0 bottom-0 w-0.5 bg-border" />

      <div className="space-y-10">
        {steps.map((step, i) => {
          const Icon = step.icon
          const isLast = i === steps.length - 1

          return (
            <div key={step.number} className="relative flex gap-4 sm:gap-6">
              {/* Left: label chip (desktop) */}
              <div className="hidden sm:flex w-24 flex-shrink-0 pt-4 justify-end">
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[0.68rem] font-semibold tracking-wide border h-6 ${
                    step.highlight
                      ? 'bg-primary text-white border-primary'
                      : 'bg-secondary text-primary border-primary/20'
                  }`}
                >
                  {step.label}
                </span>
              </div>

              {/* Center: dot */}
              <div className="flex flex-col items-center flex-shrink-0 z-10">
                <div
                  className={`h-10 w-10 rounded-full flex items-center justify-center border-2 ${
                    step.highlight
                      ? 'bg-primary border-primary shadow-[0_0_0_4px_rgba(94,75,139,0.15)]'
                      : 'bg-secondary border-border'
                  }`}
                >
                  <Icon
                    size={18}
                    className={step.highlight ? 'text-white' : 'text-primary'}
                  />
                </div>
                {!isLast && <div className="flex-1 w-0.5 bg-border mt-2" />}
              </div>

              {/* Right: content */}
              <div className={`flex-1 pb-2 ${isLast ? '' : 'pb-6'}`}>
                {/* Mobile label */}
                <span className="sm:hidden text-[0.65rem] font-bold tracking-widest text-primary uppercase">
                  {step.label}
                </span>
                <h3 className="text-base font-semibold text-navy leading-tight mt-0.5 sm:mt-1 mb-2">
                  {step.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed max-w-[480px]">
                  {step.description}
                </p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
