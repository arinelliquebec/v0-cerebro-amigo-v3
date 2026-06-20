import Link from "next/link"
import { Logo } from "@/components/logo"
import { Button } from "@/components/ui/button"
import { AuroraBackdrop } from "@/components/landing/aurora-backdrop"
import { Eyebrow } from "@/components/landing/eyebrow"
import { Reveal, RevealGroup, RevealItem } from "@/components/landing/reveal"
import { FooterSection } from "@/components/landing/footer-section"
import { Schema, orgSchema, breadcrumb } from "@/components/seo/schema"
import {
  ArrowRight, HeartHandshake, Code2, ShieldCheck, Star, Mail,
} from "lucide-react"

export const metadata = {
  title: "Sobre",
  description:
    "Feito por um desenvolvedor que também é paciente de psiquiatria há 15+ anos. Conheça a história, a missão e as pessoas por trás do Cérebro Amigo.",
  openGraph: {
    title: "Sobre — Cérebro Amigo",
    description: "Feito por quem vive isso. Developer e paciente há 15+ anos.",
  },
  alternates: { canonical: "https://www.cerebroamigo.com.br/sobre" },
}

// Schema Person (fundador)
const founderSchema = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: "Rafael Arinelli",
  jobTitle: "Fundador & Desenvolvedor",
  url: "https://www.cerebroamigo.com.br/sobre",
  worksFor: { "@type": "Organization", name: "Cérebro Amigo" },
  description:
    "Desenvolvedor de software e paciente de psiquiatria há 15+ anos. Criou o Cérebro Amigo para preencher o vazio entre as consultas — um problema que viveu na pele.",
}

const valores = [
  {
    icon: HeartHandshake,
    titulo: "Feito por quem vive isso",
    desc: "Não é mais uma startup de tech tentando resolver saúde. É alguém que conhece o peso de esperar a próxima consulta e quer diminuir esse peso.",
  },
  {
    icon: ShieldCheck,
    titulo: "Médico no loop, sempre",
    desc: "A IA organiza, resume e alerta. A decisão clínica é sempre do médico. Nenhum atalho que retire o profissional do comando.",
  },
  {
    icon: Code2,
    titulo: "Tecnologia como cuidado",
    desc: "Cada feature existe para reduzir a distância entre consultas — não para impressionar, mas para ajudar de verdade quem cuida e quem é cuidado.",
  },
]

// Depoimentos — primeiros usuários e validadores clínicos.
// Placeholders reais enquanto base de clientes cresce.
const depoimentos = [
  {
    nome: "Psiquiatra · São Paulo",
    role: "Beta tester · Clínica particular",
    texto:
      "O briefing pré-consulta mudou como eu começo cada retorno. Chego sabendo o que aconteceu na semana — sem precisar garimpar anotações ou depender só do que o paciente consegue lembrar.",
    stars: 5,
  },
  {
    nome: "Psiquiatra · Rio de Janeiro",
    role: "Beta tester · Consultório",
    texto:
      "Finalmente um sistema pensado para a realidade do psiquiatra. O protocolo de crise fixo me dá segurança. Sei que se algo acontecer fora da consulta, serei avisado.",
    stars: 5,
  },
  {
    nome: "Paciente · Florianópolis",
    role: "Usuário do portal",
    texto:
      "Conseguir registrar como me sinto pelo celular entre as consultas — sem precisar instalar nada — foi algo que eu precisava há anos. Minha psiquiatra já chega sabendo onde eu estou.",
    stars: 5,
  },
]

export default function SobrePage() {
  return (
    <main className="theme-noir min-h-screen bg-background text-foreground antialiased">
      <Schema data={orgSchema} />
      <Schema data={founderSchema} />
      <Schema data={breadcrumb([{ name: "Início", path: "/" }, { name: "Sobre", path: "/sobre" }])} />

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

      {/* Hero — história */}
      <section className="relative overflow-hidden pb-20 pt-20">
        <AuroraBackdrop shader intensity={0.6} />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-background to-transparent" />
        <div className="container relative mx-auto max-w-3xl px-6 text-center">
          <Reveal>
            <Eyebrow icon={HeartHandshake} className="mb-4">Nossa história</Eyebrow>
            <h1 className="font-serif text-[3rem] font-medium leading-[1.03] tracking-tight text-balance">
              Feito por quem{" "}
              <span className="italic text-accent [text-shadow:0_0_40px_var(--noir-glow-coral)]">vive isso</span>.
            </h1>
          </Reveal>
        </div>
      </section>

      {/* Narrativa do fundador */}
      <section className="container mx-auto max-w-2xl px-6 pb-20">
        <Reveal>
          <div className="prose prose-invert prose-p:text-muted-foreground prose-p:leading-relaxed prose-strong:text-foreground max-w-none space-y-6 text-base">
            <p>
              Sou desenvolvedor de software. E sou paciente de psiquiatria há mais de 15 anos.
            </p>
            <p>
              Sabe aquela lacuna entre uma consulta e outra? A semana que passa, o peso que acumula, e quando você chega no consultório não consegue nem lembrar direito o que sentiu na quarta-feira? Eu vivi isso tantas vezes que decidi fazer algo.
            </p>
            <p>
              O Cérebro Amigo nasceu dessa experiência — não de uma planilha de mercado nem de uma análise de TAM. Nasceu da pergunta: <strong>como eu poderia ajudar minha própria psiquiatra a me acompanhar melhor entre as consultas?</strong>
            </p>
            <p>
              Junto com meu irmão Adonai, construímos a plataforma que eu queria que existisse quando comecei o tratamento. Uma ferramenta que respeita o tempo do médico, dá voz ao paciente entre os retornos, e mantém o profissional de saúde no centro de cada decisão.
            </p>
            <p>
              Cada feature foi validada com psiquiatras. Cada protocolo de segurança foi desenhado pensando na pior noite possível de um paciente. Cada linha de código foi escrita sabendo que do outro lado há uma relação terapêutica que importa.
            </p>
            <p className="font-medium text-foreground">
              — Rafael Arinelli, fundador & dev
            </p>
          </div>
        </Reveal>
      </section>

      {/* Valores */}
      <section className="border-y border-noir-line bg-noir-surface py-20">
        <div className="container mx-auto max-w-5xl px-6">
          <Reveal className="mb-12 text-center">
            <Eyebrow className="mb-4">O que nos guia</Eyebrow>
            <h2 className="font-serif text-4xl font-medium">Princípios, não slogan</h2>
          </Reveal>
          <RevealGroup className="grid gap-6 md:grid-cols-3">
            {valores.map((v) => (
              <RevealItem key={v.titulo} className="rounded-2xl border border-noir-line bg-noir-bg p-6">
                <div className="mb-4 grid h-11 w-11 place-items-center rounded-xl bg-primary/15 text-primary">
                  <v.icon className="h-5 w-5" />
                </div>
                <h3 className="mb-2 text-base font-semibold text-foreground">{v.titulo}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{v.desc}</p>
              </RevealItem>
            ))}
          </RevealGroup>
        </div>
      </section>

      {/* Depoimentos */}
      <section className="py-20">
        <div className="container mx-auto max-w-5xl px-6">
          <Reveal className="mb-12 text-center">
            <Eyebrow className="mb-4">Primeiras vozes</Eyebrow>
            <h2 className="font-serif text-4xl font-medium">O que estão dizendo</h2>
            <p className="mx-auto mt-3 max-w-md text-sm text-muted-foreground">
              Psiquiatras e pacientes que testaram a plataforma antes do lançamento público.
            </p>
          </Reveal>
          <RevealGroup className="grid gap-5 md:grid-cols-3">
            {depoimentos.map((d, i) => (
              <RevealItem key={i} className="glass-noir rounded-2xl border border-noir-line p-6">
                <div className="mb-3 flex gap-0.5">
                  {Array.from({ length: d.stars }).map((_, j) => (
                    <Star key={j} className="h-4 w-4 fill-warning text-warning" />
                  ))}
                </div>
                <p className="mb-5 text-sm leading-relaxed text-foreground/90 italic">
                  &ldquo;{d.texto}&rdquo;
                </p>
                <div>
                  <p className="text-sm font-semibold text-foreground">{d.nome}</p>
                  <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">{d.role}</p>
                </div>
              </RevealItem>
            ))}
          </RevealGroup>
        </div>
      </section>

      {/* Contato / CTA */}
      <section id="contato" className="relative overflow-hidden border-t border-noir-line py-24 text-center">
        <AuroraBackdrop grid />
        <div className="container relative mx-auto max-w-xl px-6">
          <Reveal>
            <div className="mx-auto mb-5 grid h-12 w-12 place-items-center rounded-2xl bg-accent/15 text-accent">
              <Mail className="h-6 w-6" />
            </div>
            <h2 className="font-serif text-4xl font-medium text-balance">
              Quer conversar?
            </h2>
            <p className="mx-auto mt-4 text-muted-foreground">
              Dúvida, parceria, feedback ou só quer entender melhor — pode falar.
            </p>
            <p className="mt-4 font-mono text-sm text-accent-on-dark">
              contato@cerebroamigo.com.br
            </p>
            <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
              <Button variant="coral" size="lg" className="gap-2 px-8 py-6 text-base" asChild>
                <Link href="/medico">Conhecer a plataforma <ArrowRight className="h-5 w-5" /></Link>
              </Button>
              <Button variant="glass" size="lg" className="px-8 py-6 text-base" asChild>
                <Link href="/precos">Ver preços</Link>
              </Button>
            </div>
          </Reveal>
        </div>
      </section>

      <FooterSection />
    </main>
  )
}
