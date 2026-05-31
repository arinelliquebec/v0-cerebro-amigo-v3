'use cache'

import { cacheLife } from 'next/cache'
import { CheckCircle } from "lucide-react"

const securityItems = [
  "Dados armazenados exclusivamente em servidores AWS no Brasil (sa-east-1)",
  "Criptografia em repouso e em trânsito",
  "Trilhas de auditoria imutáveis para todos os eventos clínicos",
  "Acesso por perfil: médico visualiza apenas seus próprios pacientes",
]

const securityBadges = [
  { label: "LGPD", desc: "Categoria especial de dado — saúde mental" },
  { label: "AWS Brasil", desc: "sa-east-1 — residência de dado no País" },
  { label: "Auditoria", desc: "Logs imutáveis de cada evento clínico" },
  { label: "Crise", desc: "Protocolo fixo, pré-aprovado — sem geração dinâmica por IA" },
]

export async function SecuritySection() {
  cacheLife('days')

  return (
    <section id="seguranca" className="py-24 bg-secondary/50 border-y border-primary/10">
      <div className="container mx-auto max-w-7xl px-6">
        <div className="grid md:grid-cols-2 gap-16 items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-3">
              Segurança &amp; Privacidade
            </p>
            <h2 className="text-3xl font-semibold text-navy mb-4 text-balance">
              Infraestrutura pensada para dados de saúde mental
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-8">
              Saúde mental é categoria especial de dado pela LGPD. Nossa arquitetura foi desenhada
              com isso em mente desde o primeiro dia.
            </p>
            <div className="space-y-3.5">
              {securityItems.map((item) => (
                <div key={item} className="flex items-start gap-3">
                  <CheckCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-navy leading-relaxed">{item}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {securityBadges.map((item) => (
              <div
                key={item.label}
                className="p-5 rounded-2xl bg-white border border-border/50 shadow-sm hover:shadow-md transition-shadow"
              >
                <p className="font-semibold text-navy text-sm mb-1.5">{item.label}</p>
                <p className="text-xs text-muted-foreground leading-snug">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
