import Link from "next/link"
import { Logo } from "@/components/logo"
import { ArrowLeft } from "lucide-react"

export const metadata = {
  title: "Política de Privacidade — Cérebro Amigo",
  description: "Política de privacidade da plataforma Cérebro Amigo",
  alternates: { canonical: "https://www.cerebroamigo.com.br/privacy" },
}

export default function PrivacyPage() {
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
        <h1 className="text-3xl font-semibold text-navy mb-2">Política de Privacidade</h1>
        <p className="text-muted-foreground text-sm mb-10">Última atualização: junho de 2026</p>

        <div className="prose prose-slate max-w-none space-y-8">
          <section>
            <h2 className="text-xl font-semibold text-navy mb-3">1. Compromisso com a LGPD</h2>
            <p className="text-muted-foreground leading-relaxed">
              O Cérebro Amigo opera em total conformidade com a Lei Geral de Proteção de Dados
              (LGPD — Lei 13.709/2018). Todos os dados de saúde são classificados como dados
              sensíveis e recebem tratamento reforçado de segurança e minimização.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-navy mb-3">2. Dados coletados</h2>
            <p className="text-muted-foreground leading-relaxed">
              <strong>Dados do profissional:</strong> nome, e-mail, registro profissional, dados
              de autenticação.
            </p>
            <p className="text-muted-foreground leading-relaxed mt-2">
              <strong>Dados dos pacientes:</strong> informações de saúde mental, registros de
              humor, áudios do diário (transcritos), prescrições e evolução clínica — coletados
              exclusivamente para fins de acompanhamento entre consultas.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-navy mb-3">3. Uso de inteligência artificial</h2>
            <p className="text-muted-foreground leading-relaxed">
              A plataforma utiliza modelos de linguagem (LLM) para transcrição de áudios,
              organização de registros e geração de briefings pré-consulta. O texto de
              <strong>crise e risco</strong> é sempre predefinido e humano-validado — nunca
              gerado dinamicamente por IA. Os dados de pacientes não são utilizados para
              treinamento de modelos de terceiros.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-navy mb-3">4. Armazenamento e segurança</h2>
            <p className="text-muted-foreground leading-relaxed">
              Os dados são armazenados na AWS na região sa-east-1 (São Paulo), com criptografia
              em trânsito (TLS 1.3) e em repouso (AES-256). Áudios temporários são excluídos
              após a transcrição. Trilhas de auditoria imutáveis registram todo acesso a dados
              de saúde.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-navy mb-3">5. Direitos do titular</h2>
            <p className="text-muted-foreground leading-relaxed">
              Pacientes e profissionais podem solicitar acesso, correção, anonimização ou
              exclusão de seus dados a qualquer momento. Para exercer seus direitos, entre em
              contato com o responsável pela plataforma.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-navy mb-3">6. Retenção</h2>
            <p className="text-muted-foreground leading-relaxed">
              Dados de saúde são mantidos pelo prazo necessário à prestação do serviço e
              cumprimento de obrigações legais. Após o término da relação, dados podem ser
              anonimizados ou excluídos conforme solicitação do titular.
            </p>
          </section>
        </div>
      </main>
    </div>
  )
}
