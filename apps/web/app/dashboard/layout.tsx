import { Suspense } from "react"
import { Sidebar } from "@/components/sidebar"

function SidebarWrapper() {
  return (
    <Suspense fallback={<div className="fixed left-0 top-0 z-40 h-screen w-64 bg-card border-r border-border/60" />}>
      <Sidebar />
    </Suspense>
  )
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-background">
      <div className="print:hidden">
        <SidebarWrapper />
      </div>
      <main className="pl-64 min-h-screen transition-all duration-300 print:pl-0">
        <div className="relative">
          <Suspense fallback={<div className="min-h-[60vh]" />}>
            {children}
          </Suspense>
        </div>
      </main>
    </div>
  )
}
