import Link from "next/link"
import { Logo } from "@/components/logo"
import { Button } from "@/components/ui/button"
import { CardContent } from "@/components/ui/card"
import { SpotlightCard } from "@/components/ui/spotlight-card"
import { NeuralField } from "@/components/landing/neural-field"
import { AuroraBackdrop } from "@/components/landing/aurora-backdrop"
import { Eyebrow } from "@/components/landing/eyebrow"
import { Reveal, RevealGroup, RevealItem } from "@/components/landing/reveal"
import { PatientPreview } from "@/components/paciente/patient-preview"
import { InstallPWA } from "@/components/portal/install-pwa"
import {
  Mic, MessageCircle, Pill, Smile, CalendarClock, Lock,
  ArrowRight, HeartHandshake, LifeBuoy, KeyRound, ShieldCheck, CheckCircle, Sparkles,
} from "lucide-react"

export const metadata = {
  title: "Cérebro Amigo — Seu acompanhamento entre as consultas",
  description:
    "O portal do paciente do Cérebro Amigo: registre humor e diário por voz, converse quando precisar e não esqueça a medicação. Sua psiquiatra acompanha o que importa.",
}

const SPOT = "148,134,201"

const passos = [
  { icon: KeyRound, label: "Convite", titulo: "Sua psiquiatra te convida", desc: "Você recebe um link por e-mail e cria uma senha em segundos. Nada para instalar." },
  { icon: Smile, label: "Dia a dia", titulo: "Registre como você está", desc: "Humor em um toque, diário por texto ou voz, e um lembrete pra não perder a medicação." },
  { icon: MessageCircle, label: "Quando precisar", titulo: "Converse a qualquer hora", desc: "Desabafe quando bater o peso. Se houver sinal de risco, sua psiquiatra é avisada na hora." },
  { icon: CalendarClock, label: "Retorno", titulo: "Cheguem preparados", desc: "Tudo o que aconteceu no intervalo fica organizado para a próxima consulta.", highlight: true },
]

const recursos = [
  { icon: Mic, titulo: "Diário por voz", desc: "Conte como foi seu dia falando. A IA transcreve em pt-BR e organiza — sem digitar nada." },
  { icon: Pill, titulo: "Lembretes de medicação", desc: "Um toque pra confirmar. Nunca mais perca a hora do remédio." },
  { icon: Smile, titulo: "Check-in de humor", desc: "Registre como você está em segundos. Vira parte da sua evolução." },
  { icon: CalendarClock, titulo: "Próxima consulta à vista", desc: "Saiba quando é e o que vocês vão conversar." },
  { icon: LifeBuoy, titulo: "Apoio em momentos difíceis", desc: "Se você não estiver bem, a ajuda certa aparece na hora — com sua psiquiatra avisada." },
  { icon: Lock, titulo: "Privacidade", desc: "Seus dados de saúde protegidos — só você e sua psiquiatra têm acesso." },
]

const privacidade = [
  "Seus dados ficam no Brasil (servidores AWS, sa-east-1)",
  "Criptografados — em repouso e em trânsito",
  "Só você e sua psiquiatra têm acesso ao seu conteúdo",
  "A IA organiza e lembra; ela nunca dá diagnóstico nem ajusta dose",
]

export default function PacienteLandingPage() {
  return (
    <div className="theme-noir min-h-screen bg-background text-foreground antialiased">
      {/* ── Nav ── */}
      <header className="sticky top-0 z-50">
        <div className="glass-noir border-b border-noir-line">
          <div className="container mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
            <Logo size="md" variant="light" />
            <nav className="hidden items-center gap-1 md:flex">
              {[
                { href: "#como-funciona", label: "Como funciona" },
                { href: "#recursos", label: "Recursos" },
                { href: "#privacidade", label: "Privacidade" },
              ].map((i) => (
                <Link key={i.href} href={i.href} className="rounded-lg px-4 py-2 font-mono text-xs uppercase tracking-wider text-muted-foreground transition-colors hover:bg-noir-surface-raised/60 hover:text-foreground">
                  {i.label}
                </Link>
              ))}
            </nav>
            <div className="flex items-center gap-2">
              <Button variant="ghost" className="hidden text-muted-foreground hover:text-foreground hover:bg-noir-surface-raised/60 sm:inline-flex" asChild>
                <Link href="/p/entrar">Já tenho conta</Link>
              </Button>
              <Button variant="coral" size="sm" className="gap-1.5" asChild>
                <Link href="/p/entrar">Entrar <ArrowRight className="h-4 w-4" /></Link>
              </Button>
            </div>
          </div>
          <div className="h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="relative overflow-hidden pt-16 pb-24 lg:pt-24">
        <AuroraBackdrop grid />
        <div className="pointer-events-none absolute inset-0 opacity-60">
          <NeuralField />
        </div>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-background to-transparent" />

        <div className="container relative mx-auto max-w-6xl px-5">
          <div className="grid items-center gap-14 lg:grid-cols-[1fr_0.85fr]">
            <div className="space-y-7 text-center lg:text-left">
              <Reveal>
                <span className="inline-flex items-center gap-2 rounded-full glass-noir border border-noir-line px-4 py-2">
                  <Eyebrow icon={HeartHandshake}>Seu portal · Cérebro Amigo</Eyebrow>
                </span>
              </Reveal>
              <Reveal delay={0.06}>
                <h1 className="font-serif text-[2.75rem] font-medium leading-[1.0] tracking-tight text-balance sm:text-6xl">
                  Cuidar de você não termina{" "}
                  <span className="italic text-accent [text-shadow:0_0_40px_var(--noir-glow-coral)]">na consulta</span>.
                </h1>
              </Reveal>
              <Reveal delay={0.12}>
                <p className="mx-auto max-w-md text-lg leading-relaxed text-muted-foreground lg:mx-0">
                  Registre como está, converse quando precisar e não esqueça a medicação — e sua
                  psiquiatra acompanha tudo que importa, entre uma consulta e outra.
                </p>
              </Reveal>
              <Reveal delay={0.18}>
                <div className="flex flex-col items-center gap-3 sm:flex-row lg:justify-start">
                  <Button variant="coral" size="lg" className="w-full gap-2 px-8 py-6 text-base sm:w-auto" asChild>
                    <Link href="/p/entrar">Entrar <ArrowRight className="h-5 w-5" /></Link>
                  </Button>
                  <Button variant="glass" size="lg" className="w-full px-8 py-6 text-base sm:w-auto" asChild>
                    <Link href="/p/entrar">Já tenho conta</Link>
                  </Button>
                </div>
              </Reveal>
              <Reveal delay={0.24}>
                <div className="flex flex-col items-center gap-3 sm:flex-row lg:justify-start">
                  <InstallPWA />
                  <p className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                    <LifeBuoy className="h-3.5 w-3.5 text-accent" /> Em crise? CVV 188 · SAMU 192
                  </p>
                </div>
              </Reveal>
            </div>

            <Reveal delay={0.1} className="relative flex justify-center">
              <PatientPreview />
              <div className="pointer-events-none absolute -top-10 right-0 h-64 w-64 rounded-full bg-primary/15 blur-3xl" aria-hidden />
              <div className="pointer-events-none absolute -bottom-10 left-0 h-56 w-56 rounded-full bg-coral/12 blur-3xl" aria-hidden />
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── Empatia (problema) ── */}
      <section className="relative border-y border-noir-line bg-noir-surface">
        <div className="container mx-auto max-w-6xl px-5">
          <RevealGroup className="grid divide-y divide-noir-line md:grid-cols-3 md:divide-x md:divide-y-0">
            {[
              { t: "O peso de carregar sozinho", d: "Entre as consultas, muita coisa acontece — e é difícil lembrar de tudo no retorno." },
              { t: "Esquecer não é falha sua", d: "Medicação, como você se sentiu, o que quer falar — some na correria do dia." },
              { t: "Você não precisa segurar tudo", d: "O Cérebro Amigo guarda, lembra e organiza por você. E avisa sua psiquiatra quando importa." },
            ].map((i) => (
              <RevealItem key={i.t} className="px-8 py-12 lg:px-10">
                <p className="mb-3 text-xl font-medium leading-snug text-balance text-foreground">{i.t}</p>
                <p className="text-sm leading-relaxed text-muted-foreground">{i.d}</p>
              </RevealItem>
            ))}
          </RevealGroup>
        </div>
      </section>

      {/* ── Como funciona ── */}
      <section id="como-funciona" className="relative py-24">
        <div className="container mx-auto max-w-6xl px-5">
          <Reveal className="mx-auto mb-14 max-w-2xl text-center">
            <Eyebrow className="mb-4">Como funciona</Eyebrow>
            <h2 className="font-serif text-4xl font-medium leading-[1.05] text-balance">
              Simples, do convite ao retorno
            </h2>
          </Reveal>
          <RevealGroup className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {passos.map((p) => (
              <RevealItem key={p.titulo}>
                <div className={`h-full rounded-2xl border p-5 ${p.highlight ? "border-primary/30 bg-primary/5 glow-purple-lg" : "border-noir-line bg-noir-surface"}`}>
                  <div className={`mb-4 grid h-11 w-11 place-items-center rounded-xl ${p.highlight ? "bg-primary text-primary-foreground" : "bg-noir-surface-raised border border-noir-line text-primary"}`}>
                    <p.icon className="h-5 w-5" />
                  </div>
                  <Eyebrow className="mb-1.5">{p.label}</Eyebrow>
                  <h3 className="text-base font-semibold text-foreground">{p.titulo}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{p.desc}</p>
                </div>
              </RevealItem>
            ))}
          </RevealGroup>
        </div>
      </section>

      {/* ── Recursos ── */}
      <section id="recursos" className="relative py-24">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_50%_100%,rgba(148,134,201,0.06),transparent)]" />
        <div className="container relative mx-auto max-w-6xl px-5">
          <Reveal className="mb-14 max-w-2xl">
            <Eyebrow className="mb-4">O que você tem aqui</Eyebrow>
            <h2 className="font-serif text-4xl font-medium leading-[1.05] text-balance">
              Feito pra te acompanhar no dia a dia
            </h2>
          </Reveal>

          {/* featured — conversa */}
          <Reveal delay={0.06}>
            <SpotlightCard spotlightColor={SPOT} className="mb-5 glow-purple-lg">
              <CardContent className="flex flex-col gap-6 bg-gradient-to-br from-noir-surface-raised to-noir-surface p-8 sm:flex-row sm:items-start sm:p-10">
                <div className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/20 to-primary/5 text-primary">
                  <MessageCircle className="h-8 w-8" />
                </div>
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-3">
                    <h3 className="text-2xl font-semibold text-foreground">Converse quando precisar</h3>
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/25 bg-primary/10 px-3 py-1 font-mono text-[10px] font-medium uppercase tracking-wider text-primary">
                      <Sparkles className="h-3 w-3" /> Médico no loop
                    </span>
                  </div>
                  <p className="max-w-2xl text-base leading-relaxed text-muted-foreground">
                    Desabafe a qualquer hora do dia ou da noite. A conversa é sua — e, se houver
                    qualquer sinal de risco, sua psiquiatra é avisada imediatamente com um protocolo
                    fixo e seguro. Você nunca está sozinho.
                  </p>
                </div>
              </CardContent>
            </SpotlightCard>
          </Reveal>

          <RevealGroup className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {recursos.map((r) => (
              <RevealItem key={r.titulo}>
                <SpotlightCard spotlightColor={SPOT} className="group h-full">
                  <CardContent className="h-full space-y-4 bg-gradient-to-br from-noir-surface-raised to-noir-surface p-7">
                    <div className="grid h-12 w-12 place-items-center rounded-xl border border-noir-line bg-noir-surface-raised text-primary transition-all group-hover:border-primary/30">
                      <r.icon className="h-5 w-5 transition-transform duration-300 group-hover:scale-110" />
                    </div>
                    <div>
                      <h3 className="text-[17px] font-semibold text-foreground">{r.titulo}</h3>
                      <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{r.desc}</p>
                    </div>
                  </CardContent>
                </SpotlightCard>
              </RevealItem>
            ))}
          </RevealGroup>
        </div>
      </section>

      {/* ── Privacidade ── */}
      <section id="privacidade" className="relative overflow-hidden border-y border-noir-line bg-noir-bg py-24">
        <AuroraBackdrop />
        <div className="container relative mx-auto max-w-6xl px-5">
          <div className="grid items-center gap-14 md:grid-cols-2">
            <Reveal>
              <Eyebrow className="mb-4">Privacidade</Eyebrow>
              <h2 className="mb-4 font-serif text-4xl font-medium leading-[1.05] text-balance">
                Seus dados são só seus
              </h2>
              <p className="mb-8 leading-relaxed text-muted-foreground">
                Saúde mental é um dado sensível. Tratamos do seu com o cuidado que ele merece —
                desde o primeiro acesso.
              </p>
              <div className="space-y-3.5">
                {privacidade.map((p) => (
                  <div key={p} className="flex items-start gap-3">
                    <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <span className="text-sm leading-relaxed text-foreground/90">{p}</span>
                  </div>
                ))}
              </div>
            </Reveal>

            <Reveal delay={0.1} className="flex justify-center">
              <div className="rounded-3xl border border-noir-line glass-noir p-8 glow-purple-lg">
                <div className="grid h-16 w-16 place-items-center rounded-2xl bg-accent/15 text-accent">
                  <ShieldCheck className="h-8 w-8" />
                </div>
                <p className="mt-5 max-w-xs text-lg font-medium leading-snug text-foreground">
                  A IA nunca decide nada clínico. Quem cuida de você é sua psiquiatra.
                </p>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── CTA + crise ── */}
      <section className="relative overflow-hidden py-28 text-center">
        <AuroraBackdrop grid />
        <div className="pointer-events-none absolute -top-20 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-coral/12 blur-3xl" />
        <div className="container relative mx-auto max-w-2xl px-5">
          <Reveal>
            <div className="mx-auto mb-5 grid h-12 w-12 place-items-center rounded-2xl bg-accent/15 text-accent">
              <HeartHandshake className="h-6 w-6" />
            </div>
            <h2 className="font-serif text-4xl font-medium leading-[1.05] text-balance">
              Recebeu um convite da sua psiquiatra?
            </h2>
            <p className="mx-auto mt-4 max-w-md text-muted-foreground">
              Crie sua senha e comece agora. Leva menos de um minuto.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button variant="coral" size="lg" className="w-full gap-2 px-8 py-6 text-base sm:w-auto" asChild>
                <Link href="/p/entrar">Entrar <ArrowRight className="h-5 w-5" /></Link>
              </Button>
              <Button variant="glass" size="lg" className="w-full px-8 py-6 text-base sm:w-auto" asChild>
                <Link href="/p/entrar">Já tenho conta</Link>
              </Button>
            </div>
            <div className="mx-auto mt-8 inline-flex flex-wrap items-center justify-center gap-x-4 gap-y-2 rounded-2xl border border-noir-line glass-noir px-5 py-3 text-sm">
              <span className="flex items-center gap-1.5 text-foreground">
                <LifeBuoy className="h-4 w-4 text-accent" /> Precisa de ajuda agora?
              </span>
              <span className="font-mono text-foreground">CVV 188</span>
              <span className="text-muted-foreground">·</span>
              <span className="font-mono text-foreground">SAMU 192</span>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-noir-line bg-noir-surface px-5 py-12">
        <div className="container mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 md:flex-row">
          <div className="flex flex-col items-center gap-2 md:items-start">
            <Logo size="md" variant="light" />
            <p className="text-sm text-noir-text-dim">Seu acompanhamento entre as consultas.</p>
          </div>
          <div className="flex flex-col items-center gap-3 md:items-end">
            <div className="flex items-center gap-5 text-sm">
              <Link href="/privacy" className="text-noir-text-dim transition-colors hover:text-foreground">Privacidade</Link>
              <Link href="/terms" className="text-noir-text-dim transition-colors hover:text-foreground">Termos</Link>
              <Link href="/login" className="text-noir-text-dim transition-colors hover:text-foreground">Sou médico</Link>
            </div>
            <p className="text-xs text-noir-text-dim/60">© 2026 Cérebro Amigo</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
