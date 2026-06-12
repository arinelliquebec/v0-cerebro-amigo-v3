import Link from "next/link"

// Blocos compartilhados das landings de condição (/depressao, /ansiedade, /tdah-adulto).
// Server components, Neural Noir. Textos clínicos vêm de cada página (não daqui).

export function LandingHero({
  emoji,
  eyebrow,
  title,
  lead,
  ctaHref,
  ctaLabel,
  badges,
}: {
  emoji: string
  eyebrow: string
  title: string
  lead: string
  ctaHref: string
  ctaLabel: string
  badges: string[]
}) {
  return (
    <div className="relative mb-14 text-center">
      <div className="aurora pointer-events-none absolute -inset-x-8 -top-16 bottom-0 -z-10" aria-hidden />
      <span className="glass-noir mb-5 inline-flex h-20 w-20 items-center justify-center rounded-full text-4xl">
        {emoji}
      </span>
      <p className="mb-3 font-mono text-xs font-medium uppercase tracking-[0.2em] text-[--coral]">{eyebrow}</p>
      <h1 className="mb-4 font-[--font-playfair] text-4xl font-semibold leading-tight text-[--foreground] sm:text-5xl">
        {title}
      </h1>
      <p className="mx-auto mb-8 max-w-xl text-lg leading-relaxed text-[--muted-foreground]">{lead}</p>
      <Link
        href={ctaHref}
        className="inline-block min-h-[44px] rounded-xl bg-[--purple] px-10 py-4 text-lg font-medium text-[--primary-foreground] transition-all hover:bg-[--purple-dark] hover:[box-shadow:0_0_48px_-10px_var(--noir-glow-purple)] focus-visible:outline-2 focus-visible:outline-[--purple] focus-visible:outline-offset-2"
      >
        {ctaLabel}
      </Link>
      <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
        {badges.map((b) => (
          <span
            key={b}
            className="rounded-full border border-[--border] bg-[--secondary] px-3 py-1 text-xs text-[--secondary-foreground]"
          >
            {b}
          </span>
        ))}
      </div>
    </div>
  )
}

const PASSOS = [
  { n: "1", t: "Responda no seu ritmo", d: "Uma pergunta por tela, sem pressa. Você pode voltar e revisar." },
  { n: "2", t: "Resultado na hora", d: "Escore com faixa explicada e uma devolutiva acolhedora." },
  { n: "3", t: "Leve ao seu médico", d: "Baixe o relatório em PDF para conversar com um profissional." },
] as const

export function ComoFunciona() {
  return (
    <section className="mb-12">
      <h2 className="mb-5 text-xl font-semibold text-[--foreground]">Como funciona</h2>
      <ol className="grid gap-3 sm:grid-cols-3">
        {PASSOS.map((p) => (
          <li key={p.n} className="glass-noir rounded-2xl p-5">
            <span className="mb-3 inline-flex h-7 w-7 items-center justify-center rounded-full bg-[--purple] font-mono text-sm font-semibold text-[--primary-foreground]">
              {p.n}
            </span>
            <p className="mb-1 text-sm font-semibold text-[--foreground]">{p.t}</p>
            <p className="text-xs leading-relaxed text-[--muted-foreground]">{p.d}</p>
          </li>
        ))}
      </ol>
    </section>
  )
}

export function SymptomGrid({ title, items }: { title: string; items: string[] }) {
  return (
    <section className="mb-12">
      <h2 className="mb-4 text-xl font-semibold text-[--foreground]">{title}</h2>
      <ul className="grid gap-x-6 gap-y-2.5 sm:grid-cols-2">
        {items.map((s) => (
          <li key={s} className="flex gap-2.5 text-sm leading-relaxed text-[--muted-foreground]">
            <svg
              className="mt-0.5 h-4 w-4 shrink-0 text-[--purple]"
              viewBox="0 0 16 16"
              fill="none"
              aria-hidden
            >
              <path d="M3 8.5L6.5 12L13 4.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span>{s}</span>
          </li>
        ))}
      </ul>
    </section>
  )
}

export function LandingCta({
  title,
  ctaHref,
  ctaLabel,
}: {
  title: string
  ctaHref: string
  ctaLabel: string
}) {
  return (
    <div className="glass-noir rounded-2xl p-8 text-center">
      <p className="mb-4 text-lg font-medium text-[--foreground]">{title}</p>
      <Link
        href={ctaHref}
        className="inline-block min-h-[44px] rounded-xl bg-[--purple] px-10 py-4 text-lg font-medium text-[--primary-foreground] transition-all hover:bg-[--purple-dark] hover:[box-shadow:0_0_48px_-10px_var(--noir-glow-purple)] focus-visible:outline-2 focus-visible:outline-[--purple] focus-visible:outline-offset-2"
      >
        {ctaLabel}
      </Link>
      <p className="mt-3 text-xs text-[--muted-foreground]">Gratuito · Anônimo · Sem cadastro</p>
    </div>
  )
}
