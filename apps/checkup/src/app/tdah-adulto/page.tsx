import type { Metadata } from "next";
import { Zap } from "lucide-react";
import {
  LandingHero,
  ComoFunciona,
  SymptomGrid,
  LandingCta,
  OutrasTriagens,
} from "@/components/landing-blocks";

export const metadata: Metadata = {
  title: "Teste de TDAH Adulto Online — ASRS-18 em Português",
  description:
    "Faça a triagem de TDAH adulto com o ASRS-18, instrumento da OMS na versão brasileira validada. Gratuito, anônimo e sem cadastro.",
  keywords: [
    "teste TDAH adulto",
    "ASRS-18 português",
    "triagem TDAH online",
    "sintomas TDAH adulto",
    "déficit de atenção adulto",
    "hiperatividade adulto",
  ],
  alternates: { canonical: "https://checkup.cerebroamigo.com.br/tdah-adulto" },
  openGraph: {
    title: "Teste de TDAH Adulto — ASRS-18",
    description: "Triagem da OMS para TDAH em adultos, versão brasileira validada. Gratuito e anônimo.",
    url: "https://checkup.cerebroamigo.com.br/tdah-adulto",
  },
};

export default function TDAHAdultoPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "MedicalWebPage",
            name: "Triagem de TDAH Adulto — ASRS-18",
            url: "https://checkup.cerebroamigo.com.br/tdah-adulto",
            description:
              "Instrumento de triagem ASRS-18 da OMS para TDAH em adultos.",
            medicalAudience: { "@type": "Patient" },
          }),
        }}
      />

      <main className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
        <LandingHero
          icon={<Zap className="h-9 w-9" aria-hidden />}
          eyebrow="ASRS-18 · OMS"
          title="Teste de TDAH para adultos"
          lead="Triagem com o ASRS-18, instrumento da OMS na versão brasileira validada (Mattos et al., 2006). 18 perguntas sobre os últimos 6 meses — um ponto de partida para conversar com um profissional, não um diagnóstico."
          ctaHref="/teste/asrs18"
          ctaLabel="Começar triagem"
          badges={["Anônimo", "Sem cadastro", "~5 min", "Instrumento da OMS"]}
        />

        <ComoFunciona />

        {/* O que é */}
        <section className="mb-12">
          <h2 className="mb-3 font-display text-2xl font-semibold text-foreground">
            O que é o ASRS-18?
          </h2>
          <p className="mb-3 leading-relaxed text-muted-foreground">
            O ASRS-18 (Adult ADHD Self-Report Scale) é um instrumento desenvolvido pela
            Organização Mundial da Saúde (OMS) para triagem de TDAH em adultos. A versão
            brasileira validada foi publicada por Mattos et al. (Rev Psiq Clín, 2006).
          </p>
          <p className="leading-relaxed text-muted-foreground">
            O instrumento avalia 18 sintomas em duas partes: a Parte A (9 itens) cobre
            desatenção e a Parte B (9 itens) cobre hiperatividade e impulsividade. Como ainda
            não há pontos de corte validados para a população brasileira, esta triagem
            organiza suas respostas para você levar a um profissional — sem dar um veredito.
          </p>
        </section>

        {/* Aviso — ilha clara deliberada (clinical-safety) */}
        <section className="mb-12 bg-amber-50 border border-amber-200 rounded-xl p-5">
          <h2 className="font-semibold text-amber-900 mb-2">TDAH em adultos é mais comum do que se pensa</h2>
          <p className="text-amber-800 text-sm leading-relaxed">
            TDAH não é exclusividade da infância — estima-se que cerca de 2,5% dos adultos
            vivem com o transtorno, muitos sem diagnóstico. Sintomas como dificuldade de foco,
            impulsividade e desorganização persistente podem afetar profundamente a vida
            profissional e pessoal.
          </p>
        </section>

        <SymptomGrid
          title="Sintomas que o ASRS-18 avalia"
          items={[
            "Dificuldade de manter atenção em tarefas longas",
            "Cometer erros por descuido",
            "Dificuldade de seguir instruções até o fim",
            "Dificuldade de se organizar",
            "Evitar tarefas que exigem esforço mental sustentado",
            "Perder objetos necessários com frequência",
            "Distrair-se facilmente com estímulos externos",
            "Esquecer compromissos do dia a dia",
            "Mexer as mãos ou os pés quando está sentado",
            "Impulsividade nas decisões ou nas falas",
          ]}
        />

        <LandingCta
          title="Organize o que você sente para levar a um profissional"
          ctaHref="/teste/asrs18"
          ctaLabel="Começar o ASRS-18 agora"
        />

        <OutrasTriagens current="/tdah-adulto" />

        <footer className="mt-12 text-center">
          <p className="text-xs text-muted-foreground">
            Fonte: Mattos P et al., Rev Psiq Clín, 2006 · OMS, uso livre
          </p>
        </footer>
      </main>
    </>
  );
}
