import { Suspense } from "react"
import { headers } from "next/headers"
import Link from "next/link"
import { BookText, Heart, Pill, MessageCircle, CalendarClock } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"

/**
 * Shell do portal do paciente. A AUTENTICAÇÃO é do middleware (proxy.ts):
 * /p/* exige `paciente_token`, exceto /p/entrar. Aqui só decidimos o chrome:
 * /p/entrar renderiza sem a bottom-nav. O pathname vem do header `x-pathname`.
 *
 * O acesso dinâmico (`headers()`) + o conteúdo das páginas ficam DENTRO do
 * <Suspense> — exigência do PPR (cacheComponents) para acesso a dados
 * não-cacheados (cookies/headers).
 */
export default function PortalLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="theme-noir">
      <Suspense fallback={<PortalFallback withNav />}>
        <PortalShell>{children}</PortalShell>
      </Suspense>
    </div>
  )
}

async function PortalShell({ children }: { children: React.ReactNode }) {
  const pathname = (await headers()).get("x-pathname") ?? ""
  const semChrome = pathname.startsWith("/p/entrar")

  if (semChrome) return <>{children}</>

  return (
    <div className="min-h-screen bg-background flex flex-col max-w-md mx-auto">
      <main className="flex-1 pb-20">{children}</main>

      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md border-t bg-background/95 backdrop-blur">
        <div className="flex justify-around py-2">
          <NavItem href="/p" label="Início" active={pathname === "/p"}>
            <Heart className="w-5 h-5" />
          </NavItem>
          <NavItem href="/p/agenda" label="Agenda" active={pathname.startsWith("/p/agenda")}>
            <CalendarClock className="w-5 h-5" />
          </NavItem>
          <NavItem href="/p/conversa" label="Conversa" active={pathname.startsWith("/p/conversa")}>
            <MessageCircle className="w-5 h-5" />
          </NavItem>
          <NavItem href="/p/diario" label="Diário" active={pathname.startsWith("/p/diario")}>
            <BookText className="w-5 h-5" />
          </NavItem>
          <NavItem href="/p/medicacoes" label="Medicações" active={pathname.startsWith("/p/medicacoes")}>
            <Pill className="w-5 h-5" />
          </NavItem>
        </div>
      </nav>
    </div>
  )
}

function NavItem({
  href,
  label,
  active,
  children,
}: {
  href: string
  label: string
  active?: boolean
  children: React.ReactNode
}) {
  return (
    <Link
      href={href}
      className={`flex flex-col items-center gap-1 px-4 py-1 transition-colors ${
        active ? "text-primary" : "text-muted-foreground hover:text-foreground"
      }`}
    >
      {children}
      <span className="text-[10px]">{label}</span>
    </Link>
  )
}

function PortalFallback({ withNav }: { withNav?: boolean }) {
  return (
    <div className="min-h-screen bg-background flex flex-col max-w-md mx-auto">
      <div className="flex-1 p-4 pt-8 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-24 rounded-2xl" />
        <Skeleton className="h-24 rounded-2xl" />
      </div>
      {withNav && (
        <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md border-t bg-background/95 py-2" />
      )}
    </div>
  )
}
