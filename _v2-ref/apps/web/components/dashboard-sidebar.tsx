'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'motion/react'
import {
  LayoutDashboard,
  Users,
  Bell,
  BarChart3,
  Bot,
  Brain,
  LogOut,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const NAV = [
  { href: '/dashboard', label: 'Visão geral', Icon: LayoutDashboard, num: '01' },
  { href: '/dashboard/pacientes', label: 'Pacientes', Icon: Users, num: '02' },
  { href: '/dashboard/notificacoes', label: 'Notificações', Icon: Bell, num: '03' },
  { href: '/dashboard/insights', label: 'Insights', Icon: Brain, num: '04' },
  { href: '/dashboard/metricas', label: 'Métricas', Icon: BarChart3, num: '05' },
  { href: '/dashboard/agentes', label: 'Configuração IA', Icon: Bot, num: '06' },
] as const

export function DashboardSidebar() {
  const pathname = usePathname()

  return (
    <aside className="relative flex h-screen w-64 shrink-0 flex-col border-r border-[#00D9C0]/[0.08] bg-[#111818] text-[#F5F7F7]">
      {/* Glow effect de fundo */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        <div className="absolute -left-20 -top-20 h-40 w-40 rounded-full bg-[#00D9C0]/15 blur-3xl" />
        <div className="absolute -bottom-10 -left-10 h-32 w-32 rounded-full bg-purple-500/10 blur-3xl" />
      </div>

      {/* Brand */}
      <div className="relative z-10 flex items-center gap-2.5 px-6 pb-5 pt-6">
        <svg
          width="36"
          height="36"
          viewBox="0 0 28 28"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="shrink-0"
          style={{ filter: 'drop-shadow(0 0 8px rgba(0, 217, 192, 0.35))' }}
        >
          <path
            d="M14 2L3 9V19L14 26L25 19V9L14 2Z"
            stroke="#00D9C0"
            strokeWidth="1.5"
            fill="rgba(0, 217, 192, 0.08)"
          />
          <text
            x="14"
            y="18"
            textAnchor="middle"
            fill="#00D9C0"
            fontSize="12"
            fontFamily="Inter, sans-serif"
            fontWeight="700"
          >
            C
          </text>
        </svg>
        <div className="leading-tight">
          <div className="text-[19px] font-semibold tracking-tight text-[#F5F7F7]">
            Cérebro<span className="text-[#00D9C0]"> Amigo</span>
          </div>
          <div className="text-[13px] font-medium text-[#D0D5D5]/80">
            Painel clínico
          </div>
        </div>
      </div>

      {/* Divider com glow */}
      <div className="relative mx-6 h-px">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#00D9C0]/30 to-transparent" />
      </div>

      {/* Eyebrow nav */}
      <div className="relative z-10 px-6 pb-3 pt-5">
        <span className="text-[13px] font-medium text-[#00D9C0]/70">
          Navegação
        </span>
      </div>

      <nav className="relative z-10 flex-1 space-y-1 px-3">
        {NAV.map(({ href, label, Icon, num }) => {
          const ativo =
            href === '/dashboard'
              ? pathname === '/dashboard'
              : pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-[15px] font-medium transition-all duration-300',
                ativo
                  ? 'bg-[#00D9C0]/10 text-[#F5F7F7]'
                  : 'text-[#9AA8A8] hover:bg-[#00D9C0]/5 hover:text-[#F5F7F7]',
              )}
              style={
                ativo
                  ? { boxShadow: 'inset 0 0 0 1px rgba(0, 217, 192, 0.2), 0 0 12px rgba(0, 217, 192, 0.06)' }
                  : undefined
              }
            >
              {/* Glow bar quando ativo */}
              {ativo && (
                <motion.span
                  layoutId="nav-glow"
                  className="absolute -left-0.5 top-2 h-[calc(100%-1rem)] w-[2px] rounded-full bg-[#00D9C0]"
                  style={{ boxShadow: '0 0 10px #00D9C0' }}
                  transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                />
              )}
              <span
                className={cn(
                  'text-[13px] font-medium transition-colors',
                  ativo ? 'text-[#00D9C0]' : 'text-[#9AA8A8]',
                )}
              >
                {num}
              </span>
              <Icon
                size={17}
                className={cn(
                  'shrink-0 transition-colors',
                  ativo ? 'text-[#00D9C0]' : 'text-[#9AA8A8] group-hover:text-[#00D9C0]',
                )}
              />
              <span className="flex-1">{label}</span>

              {/* Hover shimmer effect */}
              <span
                className={cn(
                  'absolute inset-0 rounded-xl opacity-0 transition-opacity duration-300 group-hover:opacity-100 pointer-events-none',
                  'bg-gradient-to-r from-[#00D9C0]/0 via-[#00D9C0]/5 to-[#00D9C0]/0',
                )}
              />
            </Link>
          )
        })}
      </nav>

      {/* Divider */}
      <div className="relative mx-6 h-px">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      </div>

      <form action="/api/auth/logout" method="POST" className="relative z-10 px-3 py-3">
        <button
          type="submit"
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-[15px] font-medium text-[#9AA8A8] transition-all hover:bg-red-500/10 hover:text-red-400"
        >
          <LogOut size={17} className="text-[#9AA8A8]" />
          <span>Sair</span>
        </button>
      </form>
    </aside>
  )
}
