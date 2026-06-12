import Link from "next/link";
import type { Metadata } from "next";
import { LandingHero, ComoFunciona, SymptomGrid, LandingCta } from "@/components/landing-blocks";

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

      <main className="mx-auto max-w-2xl px-4 py-16">
        <LandingHero
          emoji="🌀"
          eyebrow="Triagem gratuita · GAD-7"
          title="Teste de ansiedade online"
          lead="7 perguntas baseadas no GAD-7, instrumento validado para triagem de ansiedade generalizada. Resultado em cerca de 2 minutos."
          ctaHref="/teste/gad7"
          ctaLabel="Fazer teste agora — é gratuito"
          badges={["Anônimo", "Sem cadastro", "~2 min", "Instrumento validado"]}
        />

        <ComoFunciona />

        {/* O que é */}
        <section className="mb-10">
          <h2 className="text-xl font-semibold text-[--foreground] mb-3">O que é o GAD-7?</h2>
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

        {/* Aviso — ilha clara deliberada (clinical-safety) */}
        <section className="mb-10 bg-amber-50 border border-amber-200 rounded-xl p-5">
          <h2 className="font-semibold text-amber-900 mb-2">Importante saber</h2>
          <p className="text-amber-800 text-sm leading-relaxed">
            O GAD-7 é um instrumento de <strong>triagem</strong>, não de diagnóstico. Ansiedade
            é normal em muitas situações — o instrumento ajuda a avaliar quando os sintomas podem
            estar interferindo na qualidade de vida e merecem atenção profissional.
          </p>
        </section>

        <SymptomGrid
          title="Sintomas que o GAD-7 avalia"
          items={[
            "Sentir-se nervoso, ansioso ou muito tenso",
            "Dificuldade de parar ou controlar as preocupações",
            "Preocupação excessiva com diversas coisas",
            "Dificuldade para relaxar",
            "Agitação que dificulta permanecer sentado",
            "Irritabilidade ou aborrecimento fácil",
            "Sensação de que algo horrível vai acontecer",
          ]}
        />

        <LandingCta
          title="Veja como você está com a ansiedade agora"
          ctaHref="/teste/gad7"
          ctaLabel="Começar o GAD-7 agora"
        />

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
