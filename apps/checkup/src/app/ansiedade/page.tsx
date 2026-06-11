import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Teste de Ansiedade Online Gratuito — GAD-7 em Português",
  description:
    "Faça o GAD-7, instrumento clínico validado para triagem de ansiedade generalizada. Gratuito, anônimo, sem cadastro. Resultado instantâneo com devolutiva.",
  keywords: [
    "teste de ansiedade",
    "GAD-7 português",
    "triagem ansiedade online",
    "sintomas ansiedade generalizada",
    "questionário ansiedade gratuito",
    "check-up ansiedade",
  ],
  alternates: { canonical: "https://checkup.cerebroamigo.com.br/ansiedade" },
  openGraph: {
    title: "Teste de Ansiedade Online Gratuito — GAD-7",
    description: "Triagem validada, anônima, resultado em 2 minutos.",
    url: "https://checkup.cerebroamigo.com.br/ansiedade",
  },
};

export default function AnsiedadePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "MedicalWebPage",
            name: "Triagem de Ansiedade — GAD-7",
            url: "https://checkup.cerebroamigo.com.br/ansiedade",
            description:
              "Instrumento de triagem GAD-7 para avaliação de sintomas de ansiedade generalizada.",
            medicalAudience: { "@type": "Patient" },
          }),
        }}
      />

      <main className="min-h-screen max-w-2xl mx-auto px-4 py-16">
        {/* Hero */}
        <div className="text-center mb-12">
          <span className="text-5xl mb-4 block">🌀</span>
          <p className="text-sm font-medium text-[--purple] uppercase tracking-widest mb-3">
            Triagem gratuita · GAD-7
          </p>
          <h1 className="font-[--font-playfair] text-4xl font-semibold text-[--navy] mb-4 leading-tight">
            Teste de ansiedade online
          </h1>
          <p className="text-[--muted-foreground] text-lg leading-relaxed mb-8">
            7 perguntas baseadas no GAD-7, instrumento validado para triagem de ansiedade
            generalizada. Resultado em cerca de 2 minutos.
          </p>
          <Link
            href="/teste/gad7"
            className="inline-block py-4 px-10 bg-[--purple] text-white rounded-xl font-medium text-lg hover:bg-[--purple-dark] transition-colors min-h-[44px] focus-visible:outline-2 focus-visible:outline-[--purple] focus-visible:outline-offset-2"
          >
            Fazer teste agora — é gratuito
          </Link>
          <p className="text-xs text-[--muted-foreground] mt-3">Anônimo · Sem cadastro · ~2 min</p>
        </div>

        {/* O que é */}
        <section className="mb-10">
          <h2 className="text-xl font-semibold text-[--navy] mb-3">O que é o GAD-7?</h2>
          <p className="text-[--muted-foreground] leading-relaxed mb-3">
            O GAD-7 (Generalized Anxiety Disorder-7) é um instrumento de triagem para ansiedade
            generalizada, desenvolvido e validado em estudos internacionais e disponível em
            português brasileiro (Moreno et al.).
          </p>
          <p className="text-[--muted-foreground] leading-relaxed">
            Avalia a frequência de 7 sintomas nas últimas 2 semanas, com escore de 0 a 21,
            classificado em faixas: mínimo, leve, moderado e grave.
          </p>
        </section>

        {/* Aviso */}
        <section className="mb-10 bg-amber-50 border border-amber-200 rounded-xl p-5">
          <h2 className="font-semibold text-amber-900 mb-2">Importante saber</h2>
          <p className="text-amber-800 text-sm leading-relaxed">
            O GAD-7 é um instrumento de <strong>triagem</strong>, não de diagnóstico. Ansiedade
            é normal em muitas situações — o instrumento ajuda a avaliar quando os sintomas podem
            estar interferindo na qualidade de vida e merecem atenção profissional.
          </p>
        </section>

        {/* Sintomas */}
        <section className="mb-12">
          <h2 className="text-xl font-semibold text-[--navy] mb-4">Sintomas que o GAD-7 avalia</h2>
          <ul className="space-y-2">
            {[
              "Sentir-se nervoso, ansioso ou muito tenso",
              "Dificuldade de parar ou controlar as preocupações",
              "Preocupação excessiva com diversas coisas",
              "Dificuldade para relaxar",
              "Agitação que dificulta permanecer sentado",
              "Irritabilidade ou aborrecimento fácil",
              "Sensação de que algo horrível vai acontecer",
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
            Veja como você está com a ansiedade agora
          </p>
          <Link
            href="/teste/gad7"
            className="inline-block py-4 px-10 bg-[--purple] text-white rounded-xl font-medium text-lg hover:bg-[--purple-dark] transition-colors min-h-[44px]"
          >
            Começar o GAD-7 agora
          </Link>
        </div>

        <footer className="mt-10 text-center">
          <p className="text-xs text-[--muted-foreground]">
            Fonte: Moreno AL et al. · Uso livre (mesma família do PHQ)
          </p>
          <div className="mt-3 space-x-4 text-xs">
            <Link href="/depressao" className="text-[--muted-foreground] hover:text-[--foreground]">
              Teste de depressão →
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
