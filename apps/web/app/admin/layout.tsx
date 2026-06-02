import { AdminSidebar } from "@/components/admin/admin-sidebar"

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="theme-noir min-h-screen bg-background text-foreground">
      <AdminSidebar />
      <main className="pl-60 min-h-screen">
        <div className="relative">{children}</div>
      </main>
    </div>
  )
}
