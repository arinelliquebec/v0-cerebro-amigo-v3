import Link from 'next/link'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { LogOut } from 'lucide-react'
import { PWARegister } from '@/components/pwa-register'
import { BottomNav } from '@/components/paciente/bottom-nav'

export default async function PortalPacienteLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const cookieStore = await cookies()
  const token = cookieStore.get('paciente_token')
  if (!token) redirect('/p/entrar')

  return (
    <div className="relative min-h-screen bg-[#0A0E0E] text-[#F5F7F7]">
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute -top-40 right-0 h-96 w-96 rounded-full bg-[#00D9C0]/10 blur-[100px]" />
        <div className="absolute -bottom-20 -left-20 h-80 w-80 rounded-full bg-purple-500/8 blur-[80px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[600px] w-[600px] rounded-full bg-[#00D9C0]/5 blur-[150px]" />
      </div>

      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10 opacity-[0.02]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(0, 217, 192, 0.5) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0, 217, 192, 0.5) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
        }}
      />

      <header className="sticky top-0 z-20 border-b border-[#00D9C0]/[0.08] bg-[#0A0E0E]/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-5 py-3">
          <Link href="/p" className="group flex items-center gap-2.5">
            <svg
              width="32"
              height="32"
              viewBox="0 0 28 28"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="shrink-0 transition-transform duration-300 group-hover:scale-105"
              style={{ filter: 'drop-shadow(0 0 6px rgba(0, 217, 192, 0.35))' }}
            >
              <path d="M14 2L3 9V19L14 26L25 19V9L14 2Z" stroke="#00D9C0" strokeWidth="1.5" fill="rgba(0, 217, 192, 0.08)" />
              <text x="14" y="18" textAnchor="middle" fill="#00D9C0" fontSize="12" fontFamily="Inter, sans-serif" fontWeight="700">C</text>
            </svg>
            <span className="text-[15px] font-semibold tracking-tight text-[#F5F7F7]">
              Cérebro<span className="text-[#00D9C0]"> Amigo</span>
            </span>
          </Link>

          <form action="/api/paciente/logout" method="POST">
            <button
              type="submit"
              className="group inline-flex items-center gap-1.5 rounded-lg border border-[#00D9C0]/[0.15] bg-[#111818] px-3 py-1.5 text-[13px] font-medium text-[#9AA8A8] transition-all hover:border-red-400/40 hover:bg-red-500/10 hover:text-red-400"
            >
              <LogOut size={14} className="transition-transform group-hover:-translate-x-0.5" />
              Sair
            </button>
          </form>
        </div>
      </header>

      <main className="mx-auto max-w-3xl pb-32">{children}</main>

      <BottomNav />
      <PWARegister />
    </div>
  )
}
