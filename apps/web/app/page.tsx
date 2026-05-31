import { NavHeader } from "@/components/landing/nav-header"
import { HeroSection } from "@/components/landing/hero-section"
import { ProblemBar } from "@/components/landing/problem-bar"
import { HowItWorks } from "@/components/landing/how-it-works"
import { FeaturesSection } from "@/components/landing/features-section"
import { SecuritySection } from "@/components/landing/security-section"
import { CTASection } from "@/components/landing/cta-section"
import { FooterSection } from "@/components/landing/footer-section"

export const metadata = {
  title: "Cérebro Amigo - CRM Médico",
  description:
    "O CRM que trabalha entre consultas. Acompanhe pacientes, organize condutas e fortaleça a continuidade do cuidado.",
}

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <NavHeader />
      <HeroSection />
      <ProblemBar />

      {/* How it works */}
      <section id="como-funciona" className="py-24 bg-muted/20">
        <div className="container mx-auto max-w-7xl px-6">
          <div className="max-w-2xl mb-16">
            <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-3">
              Como funciona
            </p>
            <h2 className="text-3xl lg:text-4xl font-semibold text-navy leading-tight text-balance">
              Do plano ao retorno, sem perder visibilidade
            </h2>
          </div>
          <HowItWorks />
        </div>
      </section>

      <FeaturesSection />
      <SecuritySection />
      <CTASection />
      <FooterSection />
    </div>
  )
}
