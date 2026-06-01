import Link from "next/link"
import { Logo } from "@/components/logo"
import { ArrowLeft } from "lucide-react"

export const metadata = {
  title: "Termos de Uso — Cérebro Amigo",
  description: "Termos de uso da plataforma Cérebro Amigo",
}

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/60 bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto max-w-3xl px-6 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Logo size="sm" />
          </Link>
          <Link
            href="/login"
            className="text-sm text-muted-foreground hover:text-navy transition-colors flex items-center gap-1.5"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar para login
          </Link>
        </div>
      </header>

      <main className="container mx-auto max-w-3xl px-6 py-16">
        <h1 className="text-3xl font-semibold text-navy mb-2">Termos de Uso</h1>
        <p className="text-muted-foreground text-sm mb-10">Última atualização: junho de 2026</p>

        <div className="prose prose-slate max-w-none space-y-8">
          <section>
            <h2 className="text-xl font-semibold text-navy mb-3">1. Natureza da plataforma</h2>
            <p className="text-muted-foreground leading-relaxed">
              O Cérebro Amigo é um software de gestão clínica (CRM) voltado a médicos psiquiatras.
              A plataforma <strong>não substitui o julgamento clínico</strong> e não fornece diagnósticos
              ou prescrições médicas. Todas as decisões terapêuticas são de responsabilidade exclusiva
              do profissional de saúde.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-navy mb-3">2. Uso permitido</h2>
            <p className="text-muted-foreground leading-relaxed">
              Acesso restrito a profissionais de saúde devidamente registrados em seus conselhos
              profissionais. É proibido o compartilhamento de credenciais de acesso, bem como o uso
              da plataforma para fins diferentes da gestão de prática clínica.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-navy mb-3">3. Dados e privacidade</h2>
            <p className="text-muted-foreground leading-relaxed">
              Todos os dados de pacientes são tratados conforme a LGPD (Lei 13.709/2018).
              Consulte nossa{" "}
              <Link href="/privacy" className="text-primary hover:underline font-medium">
                Política de Privacidade
              </Link>{" "}
              para detalhes sobre coleta, armazenamento e exclusão de dados.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-navy mb-3">4. Limitação de responsabilidade</h2>
            <p className="text-muted-foreground leading-relaxed">
              O Cérebro Amigo é fornecido &quot;como está&quot;, sem garantias de disponibilidade ininterrupta.
              O profissional de saúde mantém a responsabilidade final por todas as decisões clínicas,
              independentemente das informações apresentadas pela plataforma.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-navy mb-3">5. Contato</h2>
            <p className="text-muted-foreground leading-relaxed">
              Dúvidas sobre estes termos podem ser enviadas para o responsável pela plataforma.
            </p>
          </section>
        </div>
      </main>
    </div>
  )
}
