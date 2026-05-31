'use cache'

import { cacheLife } from 'next/cache'
import Link from "next/link"
import { BrandWordmark } from "@/components/brand-wordmark"
import { HeroPreview } from "@/components/landing/hero-preview"
import { Button } from "@/components/ui/button"
import { CheckCircle, ArrowRight } from "lucide-react"

export async function HeroSection() {
  cacheLife('days')

  return (
    <section className="relative overflow-hidden py-20 lg:py-28">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(94,75,139,0.07),transparent)]" />
      <div className="container mx-auto max-w-7xl px-6">
        <div className="grid items-center gap-12 lg:grid-cols-[1fr_auto] lg:gap-10">
          {/* Left */}
          <div className="space-y-8 lg:max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary border border-primary/20 text-xs font-semibold text-primary uppercase tracking-wider">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" aria-hidden />
              Acompanhamento entre consultas · Psiquiatria
            </div>

            <div className="space-y-4">
              <h1>
                <BrandWordmark size="hero" />
              </h1>
              <p className="text-xl lg:text-2xl text-navy font-medium leading-snug">
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
                className="bg-coral hover:bg-coral-dark text-white text-base px-8 py-6 rounded-xl shadow-lg shadow-coral/20"
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
                className="text-base px-8 py-6 rounded-xl border-border text-navy hover:border-primary/50"
                asChild
              >
                <Link href="/login">Já tenho conta</Link>
              </Button>
            </div>

            <div className="flex flex-wrap items-center gap-5 pt-1">
              {["LGPD", "AWS Brasil", "Protocolo de crise integrado"].map((tag) => (
                <div key={tag} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <CheckCircle className="h-3.5 w-3.5 text-success" />
                  <span>{tag}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right — product preview */}
          <div className="relative flex min-w-0 shrink-0 justify-center lg:justify-start">
            <HeroPreview />
            <div
              className="pointer-events-none absolute -top-8 -right-8 h-80 w-80 rounded-full bg-primary/[0.08] blur-3xl"
              aria-hidden
            />
            <div
              className="pointer-events-none absolute -bottom-8 -left-8 h-56 w-56 rounded-full bg-coral/[0.08] blur-2xl"
              aria-hidden
            />
          </div>
        </div>
      </div>
    </section>
  )
}
