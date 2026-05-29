import type { Metadata } from 'next'
import { Navigation } from '@/components/landing/Navigation'
import { Hero } from '@/components/landing/Hero'
import { FeatureMarquee } from '@/components/landing/FeatureMarquee'
import { Manifesto } from '@/components/landing/Manifesto'
import { ThreePillars } from '@/components/landing/ThreePillars'
import { StatsBar } from '@/components/landing/StatsBar'
import { ProductPreview } from '@/components/landing/ProductPreview'
import { Testimonials } from '@/components/landing/Testimonials'
import { HowItWorks } from '@/components/landing/HowItWorks'
import { FAQ } from '@/components/landing/FAQ'
import { FinalCTA } from '@/components/landing/FinalCTA'
import { Footer } from '@/components/landing/Footer'

export const metadata: Metadata = {
  title: 'Cérebro Amigo · Cuidado psiquiátrico contínuo',
  description: 'Plataforma de cuidado psiquiátrico entre consultas. Lembretes de medicação, diário do paciente, gráficos de humor, timeline clínica e resumo pré-consulta com IA. LGPD categoria especial.',
  alternates: { canonical: 'https://www.cerebroamigo.com.br' },
}

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#0A0E0E] overflow-x-hidden">
      <Navigation />
      <Hero />
      <FeatureMarquee />
      <Manifesto />
      <ThreePillars />
      <StatsBar />
      <ProductPreview />
      <Testimonials />
      <HowItWorks />
      <FAQ />
      <FinalCTA />
      <Footer />
    </div>
  )
}
