import { Suspense } from "react"
import { headers } from "next/headers"
import { Sidebar } from "@/components/sidebar"
import { PresencaHeartbeat } from "@/components/rede/presenca-heartbeat"
import { Toaster } from "@/components/ui/sonner"

function SidebarWrapper() {
  return (
    <Suspense fallback={<div className="fixed left-0 top-0 z-40 h-screen w-64 bg-card border-r border-border/60" />}>
      <Sidebar />
    </Suspense>
  )
}

export default async function RedeLayout({ children }: { children: React.ReactNode }) {
  // Páginas públicas de auth da rede (médico ainda não logado) não têm sidebar.
  const pathname = (await headers()).get("x-pathname") ?? ""
  if (pathname === "/rede/login" || pathname === "/rede/cadastro") {
    return (
      <div className="theme-noir min-h-screen bg-background text-foreground">
        {children}
        <Toaster />
      </div>
    )
  }

  return (
    <div className="theme-noir min-h-screen bg-background text-foreground">
      <div className="print:hidden">
        <SidebarWrapper />
      </div>
      <main className="pl-64 min-h-screen transition-all duration-300 print:pl-0">
        <div className="relative">
          <Suspense fallback={<div className="min-h-[60vh]" />}>{children}</Suspense>
        </div>
      </main>
      <PresencaHeartbeat />
      <Toaster />
    </div>
  )
}
