'use cache'

import { cacheLife } from 'next/cache'
import Link from "next/link"
import { HeroPreview } from "@/components/landing/hero-preview"
import { Button } from "@/components/ui/button"
import { CheckCircle, ArrowRight, Sparkles, HeartHandshake } from "lucide-react"

export async function HeroSection() {
  cacheLife('days')

  return (
    <section className="relative overflow-hidden py-24 lg:py-32">
      {/* Background layers */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_-10%,rgba(94,75,139,0.10),transparent)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_40%_at_80%_50%,rgba(229,115,115,0.06),transparent)]" />
      <div className="pointer-events-none absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />

      <div className="container mx-auto max-w-7xl px-6 relative">
        <div className="grid items-center gap-16 lg:grid-cols-[1.1fr_0.9fr] lg:gap-14">
          {/* Left */}
          <div className="space-y-8 lg:max-w-xl animate-fade-up">
            <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-secondary border border-primary/15 text-xs font-semibold text-primary uppercase tracking-wider shadow-sm shadow-primary/5">
              <Sparkles className="h-3.5 w-3.5" />
              Acompanhamento entre consultas · Psiquiatria
            </div>

            <h1 className="font-serif font-semibold text-navy text-5xl lg:text-6xl leading-[1.04] tracking-tight text-balance">
              Nenhum retorno começa do{" "}
              <span className="italic text-primary">zero</span>.
            </h1>

            <p className="text-muted-foreground text-lg lg:text-xl leading-relaxed max-w-lg">
              Entre as consultas, o paciente registra humor, sintomas e até{" "}
              <strong className="font-semibold text-navy">áudios no diário</strong>. Antes de
              cada retorno, a IA entrega um{" "}
              <strong className="font-semibold text-navy">briefing pronto</strong> — evolução,
              aderência e sinais de risco.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                size="lg"
                className="bg-primary hover:bg-purple-dark text-white text-base px-8 py-6 rounded-xl shadow-xl shadow-primary/25 hover:shadow-2xl hover:shadow-primary/30 transition-all duration-300 hover:-translate-y-0.5"
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
                className="text-base px-8 py-6 rounded-xl border-border/80 text-navy hover:border-primary/40 hover:bg-secondary/40 transition-all duration-200"
                asChild
              >
                <Link href="/login">Já tenho conta</Link>
              </Button>
            </div>

            {/* Nota do criador — fato verdadeiro, sem depoimento/nº/logos inventados */}
            <div className="flex items-start gap-3 rounded-xl border border-primary/15 bg-secondary/50 p-3.5 max-w-md">
              <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                <HeartHandshake className="h-5 w-5" />
              </div>
              <p className="text-sm leading-relaxed text-navy/80">
                <span className="font-semibold text-navy">Feito por quem vive isso.</span>{" "}
                Sou desenvolvedor e paciente psiquiátrico há 15+ anos — e construí o
                Cérebro Amigo com a orientação de um psiquiatra.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
              {["LGPD", "AWS Brasil · sa-east-1", "Protocolo de crise"].map((tag) => (
                <div key={tag} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="h-5 w-5 rounded-full bg-success/10 flex items-center justify-center">
                    <CheckCircle className="h-3 w-3 text-success" />
                  </div>
                  <span className="font-medium">{tag}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right — product preview */}
          <div className="relative flex min-w-0 shrink-0 justify-center lg:justify-end animate-scale-in" style={{ animationDelay: '0.2s' }}>
            <div className="relative">
              <HeroPreview />
              {/* Ambient glow effects */}
              <div
                className="pointer-events-none absolute -top-12 -right-12 h-72 w-72 rounded-full bg-primary/[0.12] blur-3xl"
                aria-hidden
              />
              <div
                className="pointer-events-none absolute -bottom-12 -left-12 h-64 w-64 rounded-full bg-coral/[0.10] blur-3xl"
                aria-hidden
              />
              <div
                className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-96 w-96 rounded-full bg-purple-light/[0.05] blur-3xl"
                aria-hidden
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
