import Link from "next/link"
import { Logo } from "@/components/logo"
import { AuroraBackdrop } from "@/components/landing/aurora-backdrop"
import { Eyebrow } from "@/components/landing/eyebrow"
import { Reveal } from "@/components/landing/reveal"
import { HeartHandshake, Stethoscope, ArrowRight, LifeBuoy } from "lucide-react"

export const metadata = {
  title: "Cérebro Amigo — Acompanhamento entre consultas",
  description:
    "Cérebro Amigo: acompanhamento entre consultas para psiquiatria. Entre como paciente ou como médico.",
  alternates: { canonical: "https://www.cerebroamigo.com.br" },
}

const opcoes = [
  {
    href: "/paciente",
    icon: HeartHandshake,
    titulo: "Sou paciente",
    desc: "Acompanhe seu humor, converse quando precisar e não esqueça a medicação.",
    glow: "hover:glow-coral-lg",
    iconCls: "bg-accent/15 text-accent",
    cta: "Acessar meu portal",
  },
  {
    href: "/medico",
    icon: Stethoscope,
    titulo: "Sou médico",
    desc: "Briefing pré-consulta com IA, agenda e acompanhamento dos seus pacientes.",
    glow: "hover:glow-purple-lg",
    iconCls: "bg-primary/15 text-primary",
    cta: "Conhecer a plataforma",
  },
]

export default function ChooserPage() {
  return (
    <main className="theme-noir relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background px-5 py-14 text-foreground antialiased">
      <AuroraBackdrop grid shader intensity={0.7} />

      <div className="relative w-full max-w-3xl">
        <Reveal className="mb-10 text-center">
          <div className="mb-6 flex justify-center">
            <Logo size="lg" variant="light" />
          </div>
          <Eyebrow className="mb-4">Bem-vindo</Eyebrow>
          <h1 className="font-serif text-4xl font-medium leading-[1.05] tracking-tight text-balance sm:text-5xl">
            Como você quer entrar?
          </h1>
        </Reveal>

        <div className="grid gap-5 sm:grid-cols-2">
          {opcoes.map((o, i) => (
            <Reveal key={o.href} delay={0.08 + i * 0.08}>
              <Link
                href={o.href}
                className={`group flex h-full flex-col rounded-3xl border border-noir-line glass-noir p-7 transition-all duration-300 hover:-translate-y-1 ${o.glow}`}
              >
                <div className={`mb-5 grid h-14 w-14 place-items-center rounded-2xl ${o.iconCls}`}>
                  <o.icon className="h-7 w-7" />
                </div>
                <h2 className="text-2xl font-semibold text-foreground">{o.titulo}</h2>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">{o.desc}</p>
                <span className="mt-6 inline-flex items-center gap-1.5 font-mono text-xs uppercase tracking-wider text-accent-on-dark transition-transform group-hover:translate-x-0.5">
                  {o.cta} <ArrowRight className="h-4 w-4" />
                </span>
              </Link>
            </Reveal>
          ))}
        </div>

        <Reveal delay={0.24} className="mt-8 text-center">
          <p className="text-sm text-muted-foreground">
            Já tem conta?{" "}
            <Link
              href="/login"
              className="font-medium text-accent-on-dark underline-offset-4 hover:underline"
            >
              Entrar como médico
            </Link>
            <span className="mx-2 text-noir-text-dim" aria-hidden="true">·</span>
            <Link
              href="/p/entrar"
              className="font-medium text-accent-on-dark underline-offset-4 hover:underline"
            >
              Entrar como paciente
            </Link>
          </p>
        </Reveal>

        <Reveal delay={0.32} className="mt-8 text-center">
          <p className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
            <LifeBuoy className="h-3.5 w-3.5 text-accent" aria-hidden="true" />
            Em crise, você não está sozinho <span aria-hidden="true">·</span> CVV 188 <span aria-hidden="true">·</span> SAMU 192
          </p>
          <div className="mt-4 flex items-center justify-center gap-5 text-xs">
            <Link href="/privacy" className="text-noir-text-dim transition-colors hover:text-foreground">Privacidade</Link>
            <Link href="/terms" className="text-noir-text-dim transition-colors hover:text-foreground">Termos</Link>
          </div>
        </Reveal>
      </div>
    </main>
  )
}
