import Link from "next/link";
import type { Metadata } from "next";

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

      <main className="min-h-screen max-w-2xl mx-auto px-4 py-16">
        {/* Hero */}
        <div className="text-center mb-12">
          <span className="text-5xl mb-4 block">⚡</span>
          <p className="text-sm font-medium text-[--purple] uppercase tracking-widest mb-3">
            ASRS-18 · OMS
          </p>
          <h1 className="font-[--font-playfair] text-4xl font-semibold text-[--navy] mb-4 leading-tight">
            Teste de TDAH para adultos
          </h1>
          <p className="text-[--muted-foreground] text-lg leading-relaxed mb-8">
            Triagem com o ASRS-18, instrumento da OMS na versão brasileira validada (Mattos et al.,
            2006). 18 perguntas sobre os últimos 6 meses — um ponto de partida para conversar com
            um profissional, não um diagnóstico.
          </p>
          <Link
            href="/teste/asrs18"
            className="inline-block py-4 px-10 bg-[--purple] text-white rounded-xl font-medium text-lg hover:bg-[--purple-dark] transition-colors min-h-[44px]"
          >
            Começar triagem
          </Link>
          <p className="text-xs text-[--muted-foreground] mt-3">Gratuito · Anônimo · Sem cadastro</p>
        </div>

        {/* O que é */}
        <section className="mb-10">
          <h2 className="text-xl font-semibold text-[--navy] mb-3">O que é o ASRS-18?</h2>
          <p className="text-[--muted-foreground] leading-relaxed mb-3">
            O ASRS-18 (Adult ADHD Self-Report Scale) é um instrumento desenvolvido pela
            Organização Mundial da Saúde (OMS) para triagem de TDAH em adultos. A versão
            brasileira validada foi publicada por Mattos et al. (Rev Psiq Clín, 2006).
          </p>
          <p className="text-[--muted-foreground] leading-relaxed">
            O instrumento avalia 18 sintomas em duas partes: a Parte A (9 itens) cobre
            desatenção e a Parte B (9 itens) cobre hiperatividade e impulsividade. Como ainda
            não há pontos de corte validados para a população brasileira, esta triagem
            organiza suas respostas para você levar a um profissional — sem dar um veredito.
          </p>
        </section>

        {/* Aviso */}
        <section className="mb-10 bg-amber-50 border border-amber-200 rounded-xl p-5">
          <h2 className="font-semibold text-amber-900 mb-2">TDAH em adultos é mais comum do que se pensa</h2>
          <p className="text-amber-800 text-sm leading-relaxed">
            TDAH não é exclusividade da infância — estima-se que cerca de 2,5% dos adultos
            vivem com o transtorno, muitos sem diagnóstico. Sintomas como dificuldade de foco,
            impulsividade e desorganização persistente podem afetar profundamente a vida
            profissional e pessoal.
          </p>
        </section>

        {/* Sintomas comuns */}
        <section className="mb-12">
          <h2 className="text-xl font-semibold text-[--navy] mb-4">Sintomas que o ASRS-18 avalia</h2>
          <ul className="space-y-2">
            {[
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
            ].map((s) => (
              <li key={s} className="flex gap-2 text-[--muted-foreground] text-sm leading-relaxed">
                <span className="text-[--purple] mt-0.5">•</span>
                <span>{s}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Links para outros testes */}
        <div className="bg-[--secondary] rounded-2xl p-6 text-center">
          <p className="text-[--navy] font-medium mb-4">
            Veja também as outras triagens:
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/depressao"
              className="py-3 px-6 bg-[--purple] text-white rounded-xl font-medium hover:bg-[--purple-dark] transition-colors min-h-[44px] flex items-center justify-center"
            >
              Triagem de depressão
            </Link>
            <Link
              href="/ansiedade"
              className="py-3 px-6 bg-white text-[--purple] border border-[--purple] rounded-xl font-medium hover:bg-[--secondary] transition-colors min-h-[44px] flex items-center justify-center"
            >
              Triagem de ansiedade
            </Link>
          </div>
        </div>

        <footer className="mt-10 text-center">
          <p className="text-xs text-[--muted-foreground]">
            Fonte: Mattos P et al., Rev Psiq Clín, 2006 · OMS, uso livre
          </p>
        </footer>
      </main>
    </>
  );
}
