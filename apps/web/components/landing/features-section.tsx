'use cache'

import { cacheLife } from 'next/cache'
import { CardContent } from "@/components/ui/card"
import { SpotlightCard } from "@/components/ui/spotlight-card"
import {
  ClipboardList,
  Smile,
  ShieldAlert,
  Bell,
  TrendingUp,
  Lock,
  Sparkles,
  Brain,
} from "lucide-react"

const features = [
  {
    icon: ClipboardList,
    title: "Prontuário eletrônico",
    description:
      "Histórico clínico completo, organizado por consulta. Evolução, condutas e medicações num só lugar.",
  },
  {
    icon: Smile,
    title: "Check-in de humor",
    description:
      "Escalas validadas (PHQ-9, GAD-7) enviadas automaticamente entre consultas e armazenadas na evolução.",
  },
  {
    icon: ShieldAlert,
    title: "Protocolo de crise",
    description:
      "Detecção automática de risco com notificação imediata ao médico. Texto de crise fixo — nunca gerado por IA.",
  },
  {
    icon: Bell,
    title: "Lembretes automatizados",
    description:
      "Medicação, tarefas terapêuticas e retornos agendados com envio por push ou mensagem.",
  },
  {
    icon: TrendingUp,
    title: "Evolução clínica",
    description:
      "Gráficos de humor, aderência e progresso ao longo do tempo para embasar decisões no retorno.",
  },
  {
    icon: Lock,
    title: "Privacidade LGPD",
    description:
      "Dados de saúde mental protegidos por criptografia, minimização de dados e trilhas de auditoria imutáveis.",
  },
]

const featuredFeature = {
  icon: Brain,
  title: "Briefing pré-consulta com IA",
  description:
    "Antes de cada retorno, a IA consolida tudo que aconteceu no intervalo: variações de humor, aderência a medicações, eventos registrados e alertas. O médico entra na consulta com um resumo claro — sem precisar garimpar anotações.",
  badge: "Inteligência Artificial",
}

export async function FeaturesSection() {
  cacheLife('days')

  return (
    <section id="recursos" className="py-24">
      <div className="container mx-auto max-w-7xl px-6">
        <div className="max-w-2xl mb-16">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-3">
            Recursos
          </p>
          <h2 className="text-3xl lg:text-4xl font-semibold text-navy leading-tight text-balance">
            Tudo que o acompanhamento entre consultas exige
          </h2>
        </div>

        {/* Briefing com IA — card em destaque */}
        <SpotlightCard className="mb-5 bg-gradient-to-br from-secondary to-white">
          <CardContent className="p-8 sm:p-10">
            <div className="flex flex-col sm:flex-row sm:items-start gap-6">
              <div className="h-14 w-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
                <featuredFeature.icon className="h-7 w-7 text-primary" />
              </div>
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h3 className="text-xl font-semibold text-navy">{featuredFeature.title}</h3>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-[10px] font-semibold text-primary uppercase tracking-wider">
                    <Sparkles className="h-3 w-3" />
                    {featuredFeature.badge}
                  </span>
                </div>
                <p className="text-muted-foreground leading-relaxed max-w-2xl">
                  {featuredFeature.description}
                </p>
              </div>
            </div>
          </CardContent>
        </SpotlightCard>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((feature) => (
            <SpotlightCard key={feature.title}>
              <CardContent className="p-7 space-y-4">
                <div className="h-11 w-11 rounded-xl bg-secondary flex items-center justify-center">
                  <feature.icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-navy mb-1.5">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </CardContent>
            </SpotlightCard>
          ))}
        </div>
      </div>
    </section>
  )
}
