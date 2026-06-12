import { Logo } from "./logo"

// Header calmo do checkup — logo do Cérebro Amigo em destaque. Sem drama
// (clinical-safety: público pode estar em sofrimento). Sticky discreto.
export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-[--border] bg-[--background]/85 backdrop-blur-sm">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Logo size="md" />
        <span className="hidden text-xs text-[--muted-foreground] sm:inline">
          Triagem gratuita e anônima
        </span>
      </div>
    </header>
  )
}
