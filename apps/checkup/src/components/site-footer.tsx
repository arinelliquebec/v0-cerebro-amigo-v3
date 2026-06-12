import { Logo } from "./logo"

// Rodapé do checkup: marca + atribuição explícita "Cérebro Amigo by Arinelli · © 2026"
// + disclaimer de triagem (não diagnóstico) e canais de crise. Calmo, centrado.
export function SiteFooter() {
  return (
    <footer className="mt-20 border-t border-[--border] bg-[--card]">
      <div className="mx-auto max-w-5xl space-y-4 px-4 py-10 text-center">
        <Logo size="sm" href={null} />

        <p className="mx-auto max-w-md text-xs leading-relaxed text-[--muted-foreground]">
          O Check-up Mental é um instrumento de triagem — não é diagnóstico e não substitui a
          avaliação por um profissional de saúde mental. Em caso de crise, ligue{" "}
          <strong className="text-[--foreground]">188</strong> (CVV) ou{" "}
          <strong className="text-[--foreground]">192</strong> (SAMU).
        </p>

        <p className="text-xs text-[--muted-foreground]">
          <span className="font-[--font-playfair] text-[--navy]">Cérebro Amigo</span>
          <span className="mx-1.5 text-[--coral]">•</span>
          by Arinelli
          <span className="mx-1.5">·</span>
          © 2026
        </p>
      </div>
    </footer>
  )
}
