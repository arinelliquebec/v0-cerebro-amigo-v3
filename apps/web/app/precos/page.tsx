import Link from "next/link"
import { Logo } from "@/components/logo"
import { Button } from "@/components/ui/button"
import { AuroraBackdrop } from "@/components/landing/aurora-backdrop"
import { Eyebrow } from "@/components/landing/eyebrow"
import { Reveal, RevealGroup, RevealItem } from "@/components/landing/reveal"
import { FooterSection } from "@/components/landing/footer-section"
import { Schema } from "@/components/seo/schema"
import {
  Check, ArrowRight, ShieldCheck, Lock, Zap, Users, Brain, ChevronDown, ChevronUp, Star,
} from "lucide-react"

export const metadata = {
  title: "Preços",
  description:
    "Planos simples para psiquiatras. Comece grátis por 14 dias, sem cartão de crédito. Ao assinar, período mínimo de 3 meses.",
  openGraph: {
    title: "Preços — Cérebro Amigo",
    description: "Planos simples para psiquiatras. 14 dias grátis, sem cartão.",
  },
  alternates: { canonical: "https://www.cerebroamigo.com.br/precos" },
}

const planos = [
  {
    nome: "Início",
    preco: "Grátis",
    sub: "por 14 dias",
    destaque: false,
    desc: "Para explorar a plataforma sem compromisso.",
    cor: "border-noir-line bg-noir-surface",
    features: [
      "Até 5 pacientes",
      "Diário por voz",
      "Check-ins automáticos",
      "Briefing pré-consulta",
      "Protocolo de crise",
      "Suporte por e-mail",
    ],
    cta: "Começar grátis",
    href: "/medico",
  },
  {
    nome: "Solo",
    preco: "R$ 197",
    sub: "/mês · 1 médico",
    destaque: true,
    desc: "Para o psiquiatra que quer acompanhar seus pacientes com mais presença.",
    cor: "border-primary/40 bg-primary/5 glow-purple-lg",
    badge: "Mais popular",
    features: [
      "Até 60 pacientes",
      "Tudo do Início",
      "Agentes analíticos de IA",
      "Evolução clínica em gráficos",
      "Editor de prompts",
      "Suporte prioritário",
    ],
    cta: "Ver demonstração",
    href: "/medico",
  },
  {
    nome: "Clínica",
    preco: "R$ 397",
    sub: "/mês · até 3 médicos",
    destaque: false,
    desc: "Para clínicas que querem escalar o acompanhamento sem perder qualidade.",
    cor: "border-noir-line bg-noir-surface",
    features: [
      "Pacientes ilimitados",
      "Tudo do Solo",
      "Múltiplos médicos",
      "Painel da clínica",
      "Relatórios agregados",
      "Onboarding dedicado",
    ],
    cta: "Falar com equipe",
    href: "/sobre#contato",
  },
]

const faqs = [
  {
    q: "Preciso de cartão de crédito para o trial?",
    a: "Não. O período de 14 dias é completamente grátis e sem cadastro de pagamento. Você só informa os dados quando decidir continuar.",
  },
  {
    q: "Quanto tempo leva para configurar?",
    a: "Você cria sua conta, cadastra o primeiro paciente e ele já recebe o convite em minutos. Não há instalação, servidor ou configuração técnica.",
  },
  {
    q: "E se eu quiser cancelar?",
    a: "Ao assinar, o plano tem período mínimo de 3 meses. Concluído esse período, você cancela quando quiser e o acesso fica ativo até o fim do ciclo pago. As condições podem variar conforme o contrato.",
  },
  {
    q: "Os dados dos meus pacientes são seguros?",
    a: "Todos os dados ficam em servidores AWS no Brasil (sa-east-1), criptografados em repouso e em trânsito. A plataforma segue a LGPD para dados de saúde mental (categoria especial, art. 11).",
  },
  {
    q: "A IA substitui minha avaliação clínica?",
    a: "Não. A IA organiza, resume e alerta — a decisão clínica é sempre sua. O protocolo de crise é fixo e pré-aprovado; nunca gerado dinamicamente. Você está no loop em cada momento que importa.",
  },
  {
    q: "Posso usar numa clínica com vários médicos?",
    a: "Sim, o plano Clínica suporta até 3 médicos. Para equipes maiores ou hospitais, entre em contato para um plano personalizado.",
  },
  {
    q: "Quando a integração com pagamento online estará disponível?",
    a: "Em breve. Por ora a assinatura é confirmada manualmente. Você será avisado assim que o checkout online estiver disponível.",
  },
]

// Schema FAQPage para Google Rich Results
const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.map((f) => ({
    "@type": "Question",
    name: f.q,
    acceptedAnswer: { "@type": "Answer", text: f.a },
  })),
}

function FaqItem({ q, a }: { q: string; a: string }) {
  return (
    <details className="group border-b border-noir-line py-5 [&>summary]:list-none">
      <summary className="flex cursor-pointer items-center justify-between gap-4 text-base font-medium text-foreground">
        {q}
        <span className="shrink-0 text-muted-foreground transition-transform group-open:rotate-180">
          <ChevronDown className="h-5 w-5" />
        </span>
      </summary>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{a}</p>
    </details>
  )
}

export default function PrecosPage() {
  return (
    <main className="theme-noir min-h-screen bg-background text-foreground antialiased">
      <Schema data={faqSchema} />

      {/* Nav */}
      <header className="sticky top-0 z-50">
        <div className="glass-noir border-b border-noir-line">
          <div className="container mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
            <Link href="/medico"><Logo size="md" variant="light" /></Link>
            <nav className="hidden items-center gap-1 md:flex">
              {[
                { href: "/medico#como-funciona", label: "Como funciona" },
                { href: "/medico#recursos", label: "Recursos" },
                { href: "/precos", label: "Preços" },
                { href: "/sobre", label: "Sobre" },
              ].map((i) => (
                <Link key={i.href} href={i.href} className="rounded-lg px-4 py-2 font-mono text-xs uppercase tracking-wider text-muted-foreground transition-colors hover:bg-noir-surface-raised/60 hover:text-foreground">
                  {i.label}
                </Link>
              ))}
            </nav>
            <div className="flex items-center gap-3">
              <Button variant="ghost" className="text-muted-foreground hover:text-foreground" asChild>
                <Link href="/login">Entrar</Link>
              </Button>
              <Button variant="coral" className="gap-1.5" asChild>
                <Link href="/medico">Ver demo <ArrowRight className="h-4 w-4" /></Link>
              </Button>
            </div>
          </div>
          <div className="h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden pb-16 pt-20">
        <AuroraBackdrop shader intensity={0.6} />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-background to-transparent" />
        <div className="container relative mx-auto max-w-3xl px-6 text-center">
          <Reveal>
            <Eyebrow className="mb-4">Sem letras miúdas</Eyebrow>
            <h1 className="font-serif text-5xl font-medium leading-[1.02] tracking-tight">
              Preços transparentes,{" "}
              <span className="italic text-accent [text-shadow:0_0_40px_var(--noir-glow-coral)]">sem surpresas</span>.
            </h1>
            <p className="mx-auto mt-5 max-w-lg text-lg leading-relaxed text-muted-foreground">
              14 dias grátis, sem cartão de crédito. Ao assinar um plano,
              período mínimo de 3 meses.
            </p>
          </Reveal>
        </div>
      </section>

      {/* Planos */}
      <section className="container mx-auto max-w-6xl px-6 pb-20">
        <RevealGroup className="grid gap-6 md:grid-cols-3">
          {planos.map((p) => (
            <RevealItem key={p.nome}>
              <div className={`relative flex h-full flex-col rounded-3xl border p-7 ${p.cor}`}>
                {p.badge && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3.5 py-1 text-xs font-semibold text-primary-foreground">
                      <Star className="h-3 w-3" /> {p.badge}
                    </span>
                  </div>
                )}
                <Eyebrow className="mb-3">{p.nome}</Eyebrow>
                <div className="mb-1">
                  <span className="text-4xl font-bold text-foreground">{p.preco}</span>
                  <span className="ml-2 text-sm text-muted-foreground">{p.sub}</span>
                </div>
                <p className="mb-6 text-sm leading-relaxed text-muted-foreground">{p.desc}</p>
                <Button
                  variant={p.destaque ? "coral" : "glass"}
                  className="mb-7 w-full gap-1.5"
                  asChild
                >
                  <Link href={p.href}>
                    {p.cta} <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <ul className="flex-1 space-y-2.5">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm text-foreground/90">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            </RevealItem>
          ))}
        </RevealGroup>

        {/* Enterprise row */}
        <Reveal delay={0.2}>
          <div className="mt-6 flex flex-col items-center justify-between gap-4 rounded-2xl border border-noir-line bg-noir-surface px-8 py-5 sm:flex-row">
            <div className="flex items-center gap-4">
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-accent/15 text-accent">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <p className="font-semibold text-foreground">Hospitais e redes de saúde</p>
                <p className="text-sm text-muted-foreground">Multi-médico, integrações customizadas, SLA, contrato.</p>
              </div>
            </div>
            <Button variant="glass" className="shrink-0 gap-1.5" asChild>
              <Link href="/sobre#contato">Falar com a equipe <ArrowRight className="h-4 w-4" /></Link>
            </Button>
          </div>
        </Reveal>
      </section>

      {/* Trust bar */}
      <Reveal>
        <div className="border-y border-noir-line bg-noir-surface py-8">
          <div className="container mx-auto max-w-4xl px-6">
            <div className="grid gap-5 text-center sm:grid-cols-4">
              {[
                { icon: ShieldCheck, label: "LGPD", sub: "Dados de saúde mental protegidos" },
                { icon: Lock, label: "AWS Brasil", sub: "Dados armazenados no Brasil (sa-east-1)" },
                { icon: Zap, label: "Contrato claro", sub: "Período mínimo de 3 meses ao assinar" },
                { icon: Brain, label: "Protocolo fixo", sub: "Crise com texto pré-aprovado, nunca gerado por IA" },
              ].map((t) => (
                <div key={t.label} className="flex flex-col items-center gap-2">
                  <t.icon className="h-5 w-5 text-primary" />
                  <p className="font-mono text-[11px] font-semibold uppercase tracking-wider text-foreground">{t.label}</p>
                  <p className="text-xs leading-snug text-muted-foreground">{t.sub}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Reveal>

      {/* FAQ */}
      <section className="container mx-auto max-w-2xl px-6 py-20">
        <Reveal className="mb-12 text-center">
          <Eyebrow className="mb-4">Perguntas frequentes</Eyebrow>
          <h2 className="font-serif text-4xl font-medium leading-tight">
            Tira dúvidas
          </h2>
        </Reveal>
        <div>
          {faqs.map((f) => (
            <FaqItem key={f.q} q={f.q} a={f.a} />
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="relative overflow-hidden py-24 text-center">
        <AuroraBackdrop grid />
        <div className="container relative mx-auto max-w-xl px-6">
          <Reveal>
            <h2 className="font-serif text-4xl font-medium leading-tight text-balance">
              Pronto para experimentar?
            </h2>
            <p className="mx-auto mt-3 text-muted-foreground">14 dias grátis, sem cartão.</p>
            <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
              <Button variant="coral" size="lg" className="gap-2 px-8 py-6 text-base" asChild>
                <Link href="/medico">Começar grátis <ArrowRight className="h-5 w-5" /></Link>
              </Button>
              <Button variant="glass" size="lg" className="px-8 py-6 text-base" asChild>
                <Link href="/login">Já tenho conta</Link>
              </Button>
            </div>
          </Reveal>
        </div>
      </section>

      <FooterSection />
    </main>
  )
}
