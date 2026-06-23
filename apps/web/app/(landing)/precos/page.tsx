import Link from "next/link"
import { Logo } from "@/components/logo"
import { Button } from "@/components/ui/button"
import { AuroraBackdrop } from "@/components/landing/aurora-backdrop"
import { Eyebrow } from "@/components/landing/eyebrow"
import { Reveal, RevealGroup, RevealItem } from "@/components/landing/reveal"
import { FooterSection } from "@/components/landing/footer-section"
import { Schema, breadcrumb } from "@/components/seo/schema"
import {
  Check, ArrowRight, ShieldCheck, Lock, Zap, Users, Brain, ChevronDown, ChevronUp, Star,
} from "lucide-react"

export const metadata = {
  title: "Preços",
  description:
    "Planos mensais para psiquiatras: Essencial, Pro e Master. Sem fidelidade, sem teste grátis — a operação clínica completa em todos; a camada de IA cresce do Essencial ao Master.",
  openGraph: {
    title: "Preços — Cérebro Amigo",
    description: "Três planos mensais (Essencial, Pro, Master). Sem fidelidade. A IA escala com o seu consultório.",
  },
  alternates: { canonical: "https://www.cerebroamigo.com.br/precos" },
}

// 3 planos mensais self-checkout (ADR-059). Operação clínica completa em TODOS; o que
// escala por preço é a camada de IA doctor-facing (briefing → insights+RAG → escriba).
const planos = [
  {
    nome: "Essencial",
    preco: "R$ 397",
    sub: "/mês · 1 médico",
    destaque: false,
    desc: "A operação clínica completa entre consultas, já com o briefing pré-consulta feito por IA.",
    cor: "border-noir-line bg-noir-surface",
    features: [
      "Pacientes ilimitados",
      "Diário por voz + check-ins automáticos",
      "Briefing pré-consulta com IA",
      "Evolução clínica em gráficos (PHQ-9/GAD-7)",
      "Teleconsulta por vídeo",
      "Protocolo de crise + editor de prompts",
    ],
    cta: "Assinar",
    href: "/medicos/cadastro",
  },
  {
    nome: "Pro",
    preco: "R$ 597",
    sub: "/mês · 1 médico",
    destaque: true,
    desc: "Para quem quer a IA fazendo o trabalho pesado: agentes analíticos e busca no prontuário.",
    cor: "border-primary/40 bg-primary/5 glow-purple-lg",
    badge: "Mais escolhido",
    features: [
      "Tudo do Essencial",
      "Insights dos 5 agentes analíticos",
      "Busca semântica no prontuário (RAG)",
      "Suporte prioritário",
    ],
    cta: "Assinar",
    href: "/medicos/cadastro",
  },
  {
    nome: "Master",
    preco: "R$ 997",
    sub: "/mês · 1 médico",
    destaque: false,
    desc: "Toda a camada de IA, incluindo o escriba que transcreve a consulta e rascunha a evolução.",
    cor: "border-noir-line bg-noir-surface",
    features: [
      "Tudo do Pro",
      "Escriba — transcrição + rascunho factual da evolução",
      "Recursos de IA avançados em primeira mão",
      "Onboarding dedicado",
    ],
    cta: "Assinar",
    href: "/medicos/cadastro",
  },
]

const faqs = [
  {
    q: "Como funciona a cobrança?",
    a: "Todos os planos são mensais e você assina online (cartão ou Pix). Sem fidelidade: cancela quando quiser e o acesso fica ativo até o fim do ciclo já pago.",
  },
  {
    q: "Qual a diferença entre Essencial, Pro e Master?",
    a: "Os três entregam a operação clínica completa — registros, escalas (PHQ-9/GAD-7), agenda, teleconsulta, evolução — e os mesmos guardrails de crise e LGPD. O que muda é a camada de IA: o Essencial já inclui o briefing pré-consulta com IA; o Pro adiciona os insights dos agentes analíticos e a busca semântica no prontuário; o Master inclui também o escriba, que transcreve a consulta e rascunha a evolução.",
  },
  {
    q: "Posso mudar de plano depois?",
    a: "Sim. Você sobe ou desce de plano quando quiser, direto na sua conta — a mudança vale a partir do próximo ciclo.",
  },
  {
    q: "Quanto tempo leva para configurar?",
    a: "Você cria sua conta, cadastra o primeiro paciente e ele já recebe o convite em minutos. Não há instalação, servidor ou configuração técnica.",
  },
  {
    q: "E se eu quiser cancelar?",
    a: "Todos os planos são mensais, sem fidelidade — você cancela quando quiser e o acesso fica ativo até o fim do ciclo pago.",
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
    a: "Os planos atuais são para um médico. Para clínicas e redes com vários médicos, fale com a equipe — desenhamos o plano certo para o seu time.",
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
    <main className="theme-noir min-h-screen text-foreground antialiased">
      <Schema data={faqSchema} />
      <Schema data={breadcrumb([{ name: "Início", path: "/" }, { name: "Preços", path: "/precos" }])} />

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
                <Link href="/medico">Conhecer a plataforma <ArrowRight className="h-4 w-4" /></Link>
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
              Três planos mensais, sem fidelidade. A operação clínica completa em
              todos — a camada de IA cresce do Essencial ao Master.
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
                { icon: Zap, label: "Contrato claro", sub: "Mensal, sem fidelidade — cancele quando quiser" },
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
              Pronto para começar?
            </h2>
            <p className="mx-auto mt-3 text-muted-foreground">Escolha seu plano e comece em minutos.</p>
            <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
              <Button variant="coral" size="lg" className="gap-2 px-8 py-6 text-base" asChild>
                <Link href="/medicos/cadastro">Criar conta <ArrowRight className="h-5 w-5" /></Link>
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
