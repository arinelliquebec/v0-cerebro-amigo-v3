import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Check-up Mental Gratuito — Triagem de Saúde Mental",
  description:
    "Escolha o teste de triagem que mais se aplica ao que você está sentindo. Gratuito, anônimo e baseado em instrumentos clínicos validados.",
};

const TESTES = [
  {
    href: "/depressao",
    emoji: "🌧️",
    titulo: "Depressão",
    instrumento: "PHQ-9",
    descricao: "Para quando você está se sentindo para baixo, sem energia ou sem prazer nas coisas.",
    duracao: "~3 min",
    cor: "from-indigo-50 to-purple-50 border-purple-200",
    botao: "Fazer teste de depressão",
  },
  {
    href: "/ansiedade",
    emoji: "🌀",
    titulo: "Ansiedade",
    instrumento: "GAD-7",
    descricao: "Para quando a preocupação está tomando conta, com tensão, dificuldade de relaxar ou até mesmo palpitações e tremores em situações cotidianas.",
    duracao: "~2 min",
    cor: "from-teal-50 to-emerald-50 border-emerald-200",
    botao: "Fazer teste de ansiedade",
  },
  {
    href: "/tdah-adulto",
    emoji: "⚡",
    titulo: "TDAH (adulto)",
    instrumento: "ASRS-18",
    descricao: "Para quando foco e impulsividade são um desafio constante no dia a dia.",
    duracao: "~5 min",
    cor: "from-amber-50 to-orange-50 border-orange-200",
    botao: "Ver mais sobre TDAH",
  },
];

export default function HomePage() {
  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-16 sm:py-20">
      <div className="mb-12 text-center">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-[--coral]">
          Check-up Mental · gratuito e anônimo
        </p>
        <h1 className="mb-4 font-[--font-playfair] text-4xl font-semibold leading-tight text-[--navy] sm:text-5xl">
          Como você está se sentindo?
        </h1>
        <p className="text-lg leading-relaxed text-[--muted-foreground]">
          Escolha a triagem que mais combina com o que você está sentindo.
          Baseada em instrumentos clínicos validados — resultado na hora.
        </p>
      </div>

      <div className="space-y-4">
        {TESTES.map((t) => (
          <Link
            key={t.href}
            href={t.href}
            className={`block rounded-2xl border bg-gradient-to-br ${t.cor} p-6 transition-transform hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-2 focus-visible:outline-[--purple]`}
          >
            <div className="flex items-start gap-4">
              <span className="text-3xl">{t.emoji}</span>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="font-semibold text-[--navy] text-lg">{t.titulo}</h2>
                  <span className="text-xs bg-white/70 text-[--muted-foreground] px-2 py-0.5 rounded-full">
                    {t.instrumento}
                  </span>
                  <span className="text-xs text-[--muted-foreground]">{t.duracao}</span>
                </div>
                <p className="text-sm text-[--muted-foreground] leading-relaxed">{t.descricao}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      <p className="mt-10 text-center text-xs text-[--muted-foreground]">
        Anônimo por padrão · nenhum cadastro necessário
      </p>
    </main>
  );
}
