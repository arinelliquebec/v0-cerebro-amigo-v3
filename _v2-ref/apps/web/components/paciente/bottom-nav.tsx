'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'motion/react'
import { Home, MessageCircle, BookOpen, Smile, Pill, User } from 'lucide-react'
import { cn } from '@/lib/utils'

const ITEMS = [
  { href: '/p',            label: 'Hoje',      Icon: Home },
  { href: '/p/chat',       label: 'Conversar', Icon: MessageCircle },
  { href: '/p/diario',     label: 'Diário',    Icon: BookOpen },
  { href: '/p/humor',      label: 'Humor',     Icon: Smile },
  { href: '/p/medicacoes', label: 'Remédios',  Icon: Pill },
  { href: '/p/perfil',     label: 'Perfil',    Icon: User },
] as const

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav
      className={cn(
        'fixed inset-x-0 bottom-0 z-30',
        'border-t border-[#00D9C0]/[0.08] bg-[#0A0E0E]/90 backdrop-blur-xl',
        'pb-[max(env(safe-area-inset-bottom),0px)]',
      )}
      aria-label="Navegação principal"
    >
      {/* Top glow line */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#00D9C0]/30 to-transparent" />

      <ul className="mx-auto grid max-w-3xl grid-cols-6">
        {ITEMS.map(({ href, label, Icon }) => {
          const ativo =
            href === '/p' ? pathname === '/p' : pathname.startsWith(href)
          return (
            <li key={href} className="relative">
              <Link
                href={href}
                className={cn(
                  'relative flex flex-col items-center justify-center gap-1 py-3 text-[11px] transition-all',
                  ativo ? 'text-[#F5F7F7]' : 'text-[#9AA8A8] hover:text-[#D0D5D5]',
                )}
              >
                {ativo && (
                  <>
                    {/* Active pill background */}
                    <motion.span
                      layoutId="paciente-nav-pill"
                      className="absolute inset-x-2 top-1.5 -z-0 h-10 rounded-xl bg-[#00D9C0]/12 border border-[#00D9C0]/25"
                      transition={{ type: 'spring', stiffness: 460, damping: 36 }}
                    />
                    {/* Top glow indicator */}
                    <motion.span
                      layoutId="paciente-nav-glow"
                      className="absolute top-0 left-1/2 -translate-x-1/2 h-px w-8 bg-gradient-to-r from-transparent via-[#00D9C0] to-transparent"
                      style={{ boxShadow: '0 0 10px #00D9C0' }}
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    />
                  </>
                )}
                <Icon
                  size={20}
                  strokeWidth={ativo ? 2.25 : 2}
                  className={cn(
                    'relative z-10 transition-all',
                    ativo ? 'text-[#00D9C0]' : 'text-[#9AA8A8]',
                  )}
                  style={
                    ativo
                      ? { filter: 'drop-shadow(0 0 8px rgba(0, 217, 192, 0.5))' }
                      : undefined
                  }
                />
                <span
                  className={cn(
                    'relative z-10 font-medium',
                    ativo ? 'text-[#00D9C0]' : 'text-[#9AA8A8]',
                  )}
                >
                  {label}
                </span>
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
