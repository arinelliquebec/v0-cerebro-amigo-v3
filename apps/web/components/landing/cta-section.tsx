'use cache'

import { cacheLife } from 'next/cache'
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"

export async function CTASection() {
  cacheLife('days')

  return (
    <section className="py-28 bg-navy">
      <div className="container mx-auto max-w-7xl px-6 text-center">
        <p className="text-xs font-semibold uppercase tracking-widest text-accent-on-dark mb-4">
          Para psiquiatras e clínicos
        </p>
        <h2 className="text-3xl lg:text-4xl font-semibold text-white mb-5 text-balance max-w-2xl mx-auto">
          Comece a acompanhar seus pacientes entre consultas
        </h2>
        <p className="text-white/55 text-lg mb-10 max-w-md mx-auto leading-relaxed">
          Demonstração gratuita. Sem cartão de crédito. Configure em minutos.
        </p>
        <Button
          size="lg"
          className="bg-coral hover:bg-coral-dark text-white text-base px-10 py-6 rounded-xl shadow-xl shadow-coral/20"
          asChild
        >
          <Link href="/dashboard">
            Ver demonstração gratuita
            <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
        </Button>
      </div>
    </section>
  )
}
