import { Logo } from "./logo"

// Header calmo do checkup — logo do Cérebro Amigo em destaque. Sem drama
// (clinical-safety: público pode estar em sofrimento). Sticky discreto.
export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 glass-noir border-b-0">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Logo size="md" />
        <a
          href="https://www.cerebroamigo.com.br"
          className="text-xs text-[--muted-foreground] transition-colors hover:text-[--purple-light]"
        >
          Conheça o Cérebro Amigo →
        </a>
      </div>
    </header>
  )
}
