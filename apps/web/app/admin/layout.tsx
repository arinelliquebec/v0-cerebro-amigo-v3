import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { gateway, GatewayError } from "@/lib/gateway"
import { AdminSidebar } from "@/components/admin/admin-sidebar"

interface MeResponse {
  id: string
  nome: string
  email: string
  role: string
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies()
  const token = cookieStore.get("auth_token")?.value

  if (!token) {
    redirect("/login")
  }

  try {
    const me = await gateway.get<MeResponse>("/api/v1/auth/me")
    if (me.role !== "owner" && me.role !== "admin") {
      redirect("/dashboard")
    }
  } catch (err) {
    if (err instanceof GatewayError && (err.status === 401 || err.status === 403)) {
      redirect("/login")
    }
    redirect("/dashboard")
  }

  return (
    <div className="theme-noir min-h-screen bg-background text-foreground">
      <AdminSidebar />
      <main className="pl-60 min-h-screen">
        <div className="relative">{children}</div>
      </main>
    </div>
  )
}
