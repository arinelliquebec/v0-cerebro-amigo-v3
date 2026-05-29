import Link from "next/link"
import { BrandWordmark } from "@/components/brand-wordmark"
import { HeroIllustration } from "@/components/hero-illustration"
import { Logo } from "@/components/logo"
import { Button } from "@/components/ui/button"
import { CardContent } from "@/components/ui/card"
import { SpotlightCard } from "@/components/ui/spotlight-card"
import { HowItWorks } from "@/components/landing/how-it-works"
import {
  CheckCircle,
  ArrowRight,
  Bell,
  Smile,
  TrendingUp,
  Lock,
  ClipboardList,
  ShieldAlert,
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

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
        <div className="container mx-auto max-w-7xl px-6 h-16 flex items-center justify-between">
          <Logo size="md" />
          <nav className="hidden md:flex items-center gap-8">
            <Link
              href="#como-funciona"
              className="text-sm font-medium text-muted-foreground hover:text-[#14B8A6] transition-colors"
            >
              Como funciona
            </Link>
            <Link
              href="#recursos"
              className="text-sm font-medium text-muted-foreground hover:text-[#14B8A6] transition-colors"
            >
              Recursos
            </Link>
            <Link
              href="#seguranca"
              className="text-sm font-medium text-muted-foreground hover:text-[#14B8A6] transition-colors"
            >
              Segurança
            </Link>
          </nav>
          <div className="flex items-center gap-3">
            <Button variant="ghost" className="text-[#0F2137] hover:text-[#14B8A6]" asChild>
              <Link href="/login">Entrar</Link>
            </Button>
            <Button className="bg-[#E57373] hover:bg-[#EF5350] text-white" asChild>
              <Link href="/dashboard">
                Ver demonstração
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden py-20 lg:py-28">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(20,184,166,0.07),transparent)]" />
        <div className="container mx-auto max-w-7xl px-6">
          <div className="grid items-center gap-12 lg:grid-cols-[1fr_auto] lg:gap-10">
            {/* Left */}
            <div className="space-y-8 lg:max-w-xl">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#F0F9F8] border border-[#14B8A6]/20 text-xs font-semibold text-[#14B8A6] uppercase tracking-wider">
                <span className="h-1.5 w-1.5 rounded-full bg-[#14B8A6]" aria-hidden />
                Acompanhamento entre consultas · Psiquiatria
              </div>

              <div className="space-y-4">
                <h1>
                  <BrandWordmark size="hero" />
                </h1>
                <p className="text-xl lg:text-2xl text-[#0F2137] font-medium leading-snug">
                  O sistema que trabalha<br />entre consultas
                </p>
              </div>

              <p className="text-muted-foreground text-lg leading-relaxed max-w-md">
                Acompanhe pacientes continuamente, antecipe crises e chegue ao retorno com dados
                reais de evolução — sem depender só da consulta.
              </p>

              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  size="lg"
                  className="bg-[#E57373] hover:bg-[#EF5350] text-white text-base px-8 py-6 rounded-xl shadow-lg shadow-[#E57373]/20"
                  asChild
                >
                  <Link href="/dashboard">
                    Ver demonstração gratuita
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="text-base px-8 py-6 rounded-xl border-border text-[#0F2137] hover:border-[#14B8A6]/50"
                  asChild
                >
                  <Link href="/login">Já tenho conta</Link>
                </Button>
              </div>

              <div className="flex flex-wrap items-center gap-5 pt-1">
                {["LGPD", "AWS Brasil", "Protocolo de crise integrado"].map((tag) => (
                  <div key={tag} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <CheckCircle className="h-3.5 w-3.5 text-[#10B981]" />
                    <span>{tag}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right — hero image */}
            <div className="relative flex min-w-0 shrink-0 justify-center lg:justify-start">
              <HeroIllustration className="relative z-10 mx-auto w-full max-w-md sm:max-w-lg lg:mx-0 lg:max-w-xl xl:max-w-2xl 2xl:max-w-3xl" />
              <div
                className="pointer-events-none absolute -top-8 -right-8 h-80 w-80 rounded-full bg-[#14B8A6]/8 blur-3xl"
                aria-hidden
              />
              <div
                className="pointer-events-none absolute -bottom-8 -left-8 h-56 w-56 rounded-full bg-[#E57373]/8 blur-2xl"
                aria-hidden
              />
            </div>
          </div>
        </div>
      </section>

      {/* Problem statement bar */}
      <section className="bg-[#0F2137]">
        <div className="container mx-auto max-w-7xl px-6">
          <div className="grid md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-white/10">
            {[
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
            ].map((item) => (
              <div key={item.label} className="py-10 px-8 lg:px-10">
                <p className="text-xs font-semibold uppercase tracking-widest text-[#14B8A6] mb-3">
                  {item.label}
                </p>
                <p className="text-white font-semibold text-lg leading-snug mb-3">{item.value}</p>
                <p className="text-white/50 text-sm leading-relaxed">{item.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="como-funciona" className="py-24 bg-muted/20">
        <div className="container mx-auto max-w-7xl px-6">
          <div className="max-w-2xl mb-16">
            <p className="text-xs font-semibold uppercase tracking-widest text-[#14B8A6] mb-3">
              Como funciona
            </p>
            <h2 className="text-3xl lg:text-4xl font-semibold text-[#0F2137] leading-tight text-balance">
              Do plano ao retorno, sem perder visibilidade
            </h2>
          </div>

          <HowItWorks />
        </div>
      </section>

      {/* Features */}
      <section id="recursos" className="py-24">
        <div className="container mx-auto max-w-7xl px-6">
          <div className="max-w-2xl mb-16">
            <p className="text-xs font-semibold uppercase tracking-widest text-[#14B8A6] mb-3">
              Recursos
            </p>
            <h2 className="text-3xl lg:text-4xl font-semibold text-[#0F2137] leading-tight text-balance">
              Tudo que o acompanhamento entre consultas exige
            </h2>
          </div>

          {/* Briefing com IA — card em destaque */}
          <SpotlightCard className="mb-5 bg-gradient-to-br from-[#F0F9F8] to-white">
            <CardContent className="p-8 sm:p-10">
              <div className="flex flex-col sm:flex-row sm:items-start gap-6">
                <div className="h-14 w-14 rounded-2xl bg-[#14B8A6]/10 border border-[#14B8A6]/20 flex items-center justify-center flex-shrink-0">
                  <featuredFeature.icon className="h-7 w-7 text-[#14B8A6]" />
                </div>
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <h3 className="text-xl font-semibold text-[#0F2137]">{featuredFeature.title}</h3>
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#14B8A6]/10 border border-[#14B8A6]/20 text-[10px] font-semibold text-[#14B8A6] uppercase tracking-wider">
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
                  <div className="h-11 w-11 rounded-xl bg-[#F0F9F8] flex items-center justify-center">
                    <feature.icon className="h-5 w-5 text-[#14B8A6]" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-[#0F2137] mb-1.5">{feature.title}</h3>
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

      {/* Security */}
      <section id="seguranca" className="py-24 bg-[#F0F9F8]/50 border-y border-[#14B8A6]/10">
        <div className="container mx-auto max-w-7xl px-6">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-[#14B8A6] mb-3">
                Segurança &amp; Privacidade
              </p>
              <h2 className="text-3xl font-semibold text-[#0F2137] mb-4 text-balance">
                Infraestrutura pensada para dados de saúde mental
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-8">
                Saúde mental é categoria especial de dado pela LGPD. Nossa arquitetura foi desenhada
                com isso em mente desde o primeiro dia.
              </p>
              <div className="space-y-3.5">
                {securityItems.map((item) => (
                  <div key={item} className="flex items-start gap-3">
                    <CheckCircle className="h-4 w-4 text-[#14B8A6] mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-[#0F2137] leading-relaxed">{item}</span>
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
                  <p className="font-semibold text-[#0F2137] text-sm mb-1.5">{item.label}</p>
                  <p className="text-xs text-muted-foreground leading-snug">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-28 bg-[#0F2137]">
        <div className="container mx-auto max-w-7xl px-6 text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-[#14B8A6] mb-4">
            Para psiquiatras e clínicos
          </p>
          <h2 className="text-3xl lg:text-4xl font-semibold text-white mb-5 text-balance max-w-2xl mx-auto">
            Comece a acompanhar seus pacientes entre consultas
          </h2>
          <p className="text-white/55 text-lg mb-10 max-w-md mx-auto leading-relaxed">
            Demonstração gratuita. Sem cartão de crédito. Configure em minutos.
          </p>
          <Button
            size="lg"
            className="bg-[#E57373] hover:bg-[#EF5350] text-white text-base px-10 py-6 rounded-xl shadow-xl shadow-[#E57373]/20"
            asChild
          >
            <Link href="/dashboard">
              Ver demonstração gratuita
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-[#0A1A2E] border-t border-white/5">
        <div className="container mx-auto max-w-7xl px-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
            <div>
              <Logo size="md" variant="light" />
              <p className="text-white/35 text-sm mt-2.5 max-w-xs leading-relaxed">
                Acompanhamento entre consultas para psiquiatria e saúde mental.
              </p>
            </div>
            <div className="flex flex-col items-start md:items-end gap-2.5">
              <p className="text-white/35 text-sm">
                © 2026 Cérebro Amigo. Todos os direitos reservados.
              </p>
              <div className="flex items-center gap-5">
                <Link
                  href="#"
                  className="text-white/35 hover:text-white/65 text-xs transition-colors"
                >
                  Privacidade
                </Link>
                <Link
                  href="#"
                  className="text-white/35 hover:text-white/65 text-xs transition-colors"
                >
                  Termos de uso
                </Link>
                <Link
                  href="/login"
                  className="text-white/35 hover:text-white/65 text-xs transition-colors"
                >
                  Entrar
                </Link>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
