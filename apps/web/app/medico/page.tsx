import { Suspense } from "react"
import { NavHeader } from "@/components/landing/nav-header"
import { HeroSection } from "@/components/landing/hero-section"
import { ProblemBar } from "@/components/landing/problem-bar"
import { HowItWorks } from "@/components/landing/how-it-works"
import { FeaturesSection } from "@/components/landing/features-section"
import { SecuritySection } from "@/components/landing/security-section"
import { CTASection } from "@/components/landing/cta-section"
import { FooterSection } from "@/components/landing/footer-section"
import { Eyebrow } from "@/components/landing/eyebrow"
import { Reveal } from "@/components/landing/reveal"
import { Schema, softwareSchema, websiteSchema } from "@/components/seo/schema"
import { CheckupQrBanner } from "@/components/landing/checkup-qr-banner"

export const metadata = {
  title: "Para Psiquiatras",
  description:
    "Briefing pré-consulta com IA, diário por voz do paciente, protocolo de crise integrado e acompanhamento automático entre consultas. 14 dias grátis.",
  openGraph: {
    title: "Cérebro Amigo — Para Psiquiatras",
    description: "Briefing pré-consulta com IA. Paciente registra. Você chega preparado.",
  },
  alternates: { canonical: "https://www.cerebroamigo.com.br/medico" },
}

export default function MedicoLandingPage() {
  return (
    // `.theme-noir` escopa o tema dark espacial só à landing — dashboard e
    // portal têm seus próprios layouts e seguem o :root (light).
    <main className="theme-noir min-h-screen bg-background text-foreground antialiased">
      <Schema data={softwareSchema} />
      <Schema data={websiteSchema} />
      <NavHeader />
      <Suspense fallback={null}>
        <CheckupQrBanner />
      </Suspense>
      <HeroSection />
      <ProblemBar />

      {/* How it works */}
      <section id="como-funciona" className="relative py-28">
        <div className="container mx-auto max-w-7xl px-6">
          <Reveal className="max-w-2xl mb-16">
            <Eyebrow className="mb-4">Como funciona</Eyebrow>
            <h2 className="font-serif text-4xl lg:text-5xl font-medium text-foreground leading-[1.05] text-balance">
              Do plano ao retorno,{" "}
              <span className="text-accent-on-dark">sem perder visibilidade</span>
            </h2>
          </Reveal>
          <HowItWorks />
        </div>
      </section>

      <FeaturesSection />
      <SecuritySection />
      <CTASection />
      <FooterSection />
    </main>
  )
}
