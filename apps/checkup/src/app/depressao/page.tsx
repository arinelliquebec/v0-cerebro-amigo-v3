import type { Metadata } from "next";
import { CloudRain } from "lucide-react";
import {
  LandingHero,
  ComoFunciona,
  SymptomGrid,
  LandingCta,
  OutrasTriagens,
} from "@/components/landing-blocks";

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

      <main className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
        <LandingHero
          icon={<CloudRain className="h-9 w-9" aria-hidden />}
          eyebrow="Triagem gratuita · PHQ-9"
          title="Teste de depressão online"
          lead="9 perguntas baseadas no PHQ-9, instrumento clínico validado amplamente usado por psiquiatras e clínicos gerais. Resultado em cerca de 3 minutos."
          ctaHref="/teste/phq9"
          ctaLabel="Fazer teste agora — é gratuito"
          badges={["Anônimo", "Sem cadastro", "~3 min", "Instrumento validado"]}
        />

        <ComoFunciona />

        {/* O que é */}
        <section className="mb-12">
          <h2 className="mb-3 font-display text-2xl font-semibold text-foreground">
            O que é o PHQ-9?
          </h2>
          <p className="mb-3 leading-relaxed text-muted-foreground">
            O PHQ-9 (Patient Health Questionnaire-9) é um instrumento de triagem para depressão
            desenvolvido e validado cientificamente, amplamente usado em consultórios e hospitais
            no mundo todo — inclusive no Brasil, com tradução validada por Santos et al. (2013).
          </p>
          <p className="leading-relaxed text-muted-foreground">
            Ele avalia a frequência de 9 sintomas nas últimas 2 semanas, com escore de 0 a 27.
            Os resultados são classificados em faixas: mínimo, leve, moderado, moderadamente
            grave e grave.
          </p>
        </section>

        {/* O que ele NÃO é — ilha clara deliberada (clinical-safety) */}
        <section className="mb-12 bg-amber-50 border border-amber-200 rounded-xl p-5">
          <h2 className="font-semibold text-amber-900 mb-2">Importante saber</h2>
          <p className="text-amber-800 text-sm leading-relaxed">
            O PHQ-9 é um instrumento de <strong>triagem</strong>, não de diagnóstico. Um resultado
            elevado indica que pode valer a pena buscar uma avaliação profissional — mas apenas
            um psiquiatra, psicólogo ou médico pode diagnosticar depressão. Use este resultado
            como ponto de partida para uma conversa com o seu profissional de saúde.
          </p>
        </section>

        <SymptomGrid
          title="Sintomas que o PHQ-9 avalia"
          items={[
            "Pouco interesse ou prazer em fazer as coisas",
            "Sentir-se para baixo, deprimido ou sem perspectiva",
            "Dificuldades com sono — insônia ou dormir demais",
            "Cansaço ou pouca energia",
            "Falta de apetite ou comer demais",
            "Dificuldade de concentração",
            "Sentir-se mal consigo mesmo",
            "Agitação ou lentidão incomuns",
            "Pensamentos de se machucar",
          ]}
        />

        <LandingCta
          title="Pronto para verificar como você está?"
          ctaHref="/teste/phq9"
          ctaLabel="Começar o PHQ-9 agora"
        />

        <OutrasTriagens current="/depressao" />

        <footer className="mt-12 text-center">
          <p className="text-xs text-muted-foreground">
            Fonte: Santos IS et al., Cad. Saúde Pública, 2013 · Pfizer, uso livre
          </p>
        </footer>
      </main>
    </>
  );
}
