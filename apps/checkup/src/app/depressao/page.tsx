import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Teste de Depressão Online Gratuito — PHQ-9 em Português",
  description:
    "Faça o PHQ-9, instrumento clínico validado para triagem de depressão. Gratuito, anônimo, sem cadastro. Resultado instantâneo com devolutiva e relatório PDF.",
  keywords: [
    "teste de depressão",
    "PHQ-9 português",
    "triagem depressão online",
    "sintomas depressão",
    "questionário depressão gratuito",
    "check-up depressão",
  ],
  alternates: { canonical: "https://checkup.cerebroamigo.com.br/depressao" },
  openGraph: {
    title: "Teste de Depressão Online Gratuito — PHQ-9",
    description: "Triagem validada, anônima, resultado em 3 minutos.",
    url: "https://checkup.cerebroamigo.com.br/depressao",
  },
};

export default function DepressaoPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "MedicalWebPage",
            name: "Triagem de Depressão — PHQ-9",
            url: "https://checkup.cerebroamigo.com.br/depressao",
            description:
              "Instrumento de triagem PHQ-9 para avaliação de sintomas depressivos.",
            medicalAudience: { "@type": "Patient" },
          }),
        }}
      />

      <main className="min-h-screen max-w-2xl mx-auto px-4 py-16">
        {/* Hero */}
        <div className="text-center mb-12">
          <span className="text-5xl mb-4 block">🌧️</span>
          <p className="text-sm font-medium text-[--purple] uppercase tracking-widest mb-3">
            Triagem gratuita · PHQ-9
          </p>
          <h1 className="font-[--font-playfair] text-4xl font-semibold text-[--navy] mb-4 leading-tight">
            Teste de depressão online
          </h1>
          <p className="text-[--muted-foreground] text-lg leading-relaxed mb-8">
            9 perguntas baseadas no PHQ-9, instrumento clínico validado amplamente usado
            por psiquiatras e clínicos gerais. Resultado em cerca de 3 minutos.
          </p>
          <Link
            href="/teste/phq9"
            className="inline-block py-4 px-10 bg-[--purple] text-white rounded-xl font-medium text-lg hover:bg-[--purple-dark] transition-colors min-h-[44px] focus-visible:outline-2 focus-visible:outline-[--purple] focus-visible:outline-offset-2"
          >
            Fazer teste agora — é gratuito
          </Link>
          <p className="text-xs text-[--muted-foreground] mt-3">Anônimo · Sem cadastro · ~3 min</p>
        </div>

        {/* O que é */}
        <section className="mb-10">
          <h2 className="text-xl font-semibold text-[--navy] mb-3">O que é o PHQ-9?</h2>
          <p className="text-[--muted-foreground] leading-relaxed mb-3">
            O PHQ-9 (Patient Health Questionnaire-9) é um instrumento de triagem para depressão
            desenvolvido e validado cientificamente, amplamente usado em consultórios e hospitais
            no mundo todo — inclusive no Brasil, com tradução validada por Santos et al. (2013).
          </p>
          <p className="text-[--muted-foreground] leading-relaxed">
            Ele avalia a frequência de 9 sintomas nas últimas 2 semanas, com escore de 0 a 27.
            Os resultados são classificados em faixas: mínimo, leve, moderado, moderadamente
            grave e grave.
          </p>
        </section>

        {/* O que ele NÃO é */}
        <section className="mb-10 bg-amber-50 border border-amber-200 rounded-xl p-5">
          <h2 className="font-semibold text-amber-900 mb-2">Importante saber</h2>
          <p className="text-amber-800 text-sm leading-relaxed">
            O PHQ-9 é um instrumento de <strong>triagem</strong>, não de diagnóstico. Um resultado
            elevado indica que pode valer a pena buscar uma avaliação profissional — mas apenas
            um psiquiatra, psicólogo ou médico pode diagnosticar depressão. Use este resultado
            como ponto de partida para uma conversa com o seu profissional de saúde.
          </p>
        </section>

        {/* Sintomas comuns */}
        <section className="mb-12">
          <h2 className="text-xl font-semibold text-[--navy] mb-4">Sintomas que o PHQ-9 avalia</h2>
          <ul className="space-y-2">
            {[
              "Pouco interesse ou prazer em fazer as coisas",
              "Sentir-se para baixo, deprimido ou sem perspectiva",
              "Dificuldades com sono — insônia ou dormir demais",
              "Cansaço ou pouca energia",
              "Falta de apetite ou comer demais",
              "Dificuldade de concentração",
              "Sentir-se mal consigo mesmo",
              "Agitação ou lentidão incomuns",
              "Pensamentos de se machucar",
            ].map((s) => (
              <li key={s} className="flex gap-2 text-[--muted-foreground] text-sm leading-relaxed">
                <span className="text-[--purple] mt-0.5">•</span>
                <span>{s}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* CTA final */}
        <div className="text-center bg-[--secondary] rounded-2xl p-8">
          <p className="text-[--navy] font-medium text-lg mb-4">
            Pronto para verificar como você está?
          </p>
          <Link
            href="/teste/phq9"
            className="inline-block py-4 px-10 bg-[--purple] text-white rounded-xl font-medium text-lg hover:bg-[--purple-dark] transition-colors min-h-[44px]"
          >
            Começar o PHQ-9 agora
          </Link>
        </div>

        <footer className="mt-10 text-center">
          <p className="text-xs text-[--muted-foreground]">
            Fonte: Santos IS et al., Cad. Saúde Pública, 2013 · Pfizer, uso livre
          </p>
          <div className="mt-3 space-x-4 text-xs">
            <Link href="/ansiedade" className="text-[--muted-foreground] hover:text-[--foreground]">
              Teste de ansiedade →
            </Link>
            <Link href="/tdah-adulto" className="text-[--muted-foreground] hover:text-[--foreground]">
              Teste de TDAH →
            </Link>
          </div>
        </footer>
      </main>
    </>
  );
}
