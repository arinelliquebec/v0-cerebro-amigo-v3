import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { DashboardSidebar } from '@/components/dashboard-sidebar'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const cookieStore = await cookies()
  const token = cookieStore.get('auth_token')
  if (!token) redirect('/login')

  return (
    <div className="flex h-screen bg-[#0A0E0E] text-[#F5F7F7]">
      <DashboardSidebar />
      <main className="relative flex-1 overflow-y-auto">
        {/* Ambient glow effects */}
        <div
          aria-hidden
          className="pointer-events-none fixed inset-0 -z-0"
        >
          <div className="absolute -top-40 right-1/4 h-96 w-96 rounded-full bg-[#00D9C0]/8 blur-[120px]" />
          <div className="absolute bottom-0 left-1/3 h-80 w-80 rounded-full bg-purple-500/6 blur-[100px]" />
        </div>
        
        {/* Grid pattern */}
        <div
          aria-hidden
          className="pointer-events-none fixed inset-0 -z-0 opacity-[0.015]"
          style={{
            backgroundImage: `
              linear-gradient(rgba(0, 217, 192, 0.5) 1px, transparent 1px),
              linear-gradient(90deg, rgba(0, 217, 192, 0.5) 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px',
          }}
        />
        
        <div className="relative z-10">{children}</div>
      </main>
    </div>
  )
}
