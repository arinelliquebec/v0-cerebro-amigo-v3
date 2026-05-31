'use cache'

import { cacheLife } from 'next/cache'

const items = [
  {
    label: "O problema",
    value: "O que acontece entre uma consulta e a próxima?",
    sub: "Paciente vai para casa. Você perde visibilidade. A próxima consulta começa do zero.",
  },
  {
    label: "O custo",
    value: "Gaps clínicos não detectados",
    sub:
      "Crises, abandono de medicação e recaídas se desenvolvem no intervalo — e chegam tarde.",
  },
  {
    label: "A solução",
    value: "Acompanhamento contínuo e automatizado",
    sub:
      "Cérebro Amigo monitora, alerta e organiza — para você chegar ao retorno preparado.",
  },
]

export async function ProblemBar() {
  cacheLife('days')

  return (
    <section className="bg-navy">
      <div className="container mx-auto max-w-7xl px-6">
        <div className="grid md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-white/10">
          {items.map((item) => (
            <div key={item.label} className="py-10 px-8 lg:px-10">
              <p className="text-xs font-semibold uppercase tracking-widest text-accent-on-dark mb-3">
                {item.label}
              </p>
              <p className="text-white font-semibold text-lg leading-snug mb-3">{item.value}</p>
              <p className="text-white/50 text-sm leading-relaxed">{item.sub}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
