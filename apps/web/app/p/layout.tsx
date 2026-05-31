import { Suspense } from "react"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import Link from "next/link"
import { BookText, Heart, Pill } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <Suspense fallback={<PortalLayoutSkeleton />}>
      <PortalLayoutInner>{children}</PortalLayoutInner>
    </Suspense>
  )
}

async function PortalLayoutInner({
  children,
}: {
  children: React.ReactNode
}) {
  const cookieStore = await cookies()
  if (!cookieStore.get("paciente_token")) {
    redirect("/p/entrar")
  }

  return (
    <div className="min-h-screen bg-background flex flex-col max-w-md mx-auto">
      <main className="flex-1 pb-20">{children}</main>

      {/* Bottom nav mobile */}
      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md border-t bg-background/95 backdrop-blur">
        <div className="flex justify-around py-2">
          <NavItem href="/p" label="Início">
            <Heart className="w-5 h-5" />
          </NavItem>
          <NavItem href="/p/diario" label="Diário">
            <BookText className="w-5 h-5" />
          </NavItem>
          <NavItem href="/p/medicacoes" label="Medicações">
            <Pill className="w-5 h-5" />
          </NavItem>
        </div>
      </nav>
    </div>
  )
}

function PortalLayoutSkeleton() {
  return (
    <div className="min-h-screen bg-background flex flex-col max-w-md mx-auto">
      <main className="flex-1 pb-20 p-4 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-24 rounded-xl" />
        <Skeleton className="h-24 rounded-xl" />
      </main>
      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md border-t bg-background/95 backdrop-blur">
        <div className="flex justify-around py-2">
          <div className="flex flex-col items-center gap-1 px-4 py-1">
            <Skeleton className="h-5 w-5 rounded-full" />
            <Skeleton className="h-2.5 w-8" />
          </div>
          <div className="flex flex-col items-center gap-1 px-4 py-1">
            <Skeleton className="h-5 w-5 rounded-full" />
            <Skeleton className="h-2.5 w-8" />
          </div>
          <div className="flex flex-col items-center gap-1 px-4 py-1">
            <Skeleton className="h-5 w-5 rounded-full" />
            <Skeleton className="h-2.5 w-8" />
          </div>
        </div>
      </nav>
    </div>
  )
}

function NavItem({
  href,
  label,
  children,
}: {
  href: string
  label: string
  children: React.ReactNode
}) {
  return (
    <Link
      href={href}
      className="flex flex-col items-center gap-1 px-4 py-1 text-muted-foreground hover:text-foreground transition-colors"
    >
      {children}
      <span className="text-[10px]">{label}</span>
    </Link>
  )
}
