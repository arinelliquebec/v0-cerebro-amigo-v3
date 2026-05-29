'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'

const TABS = [
  { value: 'resumo', label: 'Resumo' },
  { value: 'tratamento', label: 'Tratamento' },
  { value: 'prescricoes', label: 'Prescrições' },
  { value: 'acompanhamento', label: 'Acompanhamento' },
  { value: 'eventos', label: 'Eventos' },
  { value: 'notas', label: 'Notas' },
] as const

type TabValue = (typeof TABS)[number]['value']

type Props = Record<TabValue, React.ReactNode>

export function FichaTabs(props: Props) {
  const [active, setActive] = useState<TabValue>('resumo')

  return (
    <div>
      <nav
        role="tablist"
        className="sticky top-0 z-10 -mx-8 mb-6 flex gap-1 overflow-x-auto border-b border-[#00D9C0]/[0.08] bg-[#0A0E0E]/90 px-8 backdrop-blur-md"
      >
        {TABS.map((t) => {
          const isActive = active === t.value
          return (
            <button
              key={t.value}
              role="tab"
              type="button"
              aria-selected={isActive}
              onClick={() => setActive(t.value)}
              className={cn(
                'relative whitespace-nowrap border-b-2 px-4 py-3 text-[14px] font-medium transition-colors',
                isActive
                  ? 'border-[#00D9C0] text-[#00D9C0]'
                  : 'border-transparent text-[#9AA8A8] hover:text-[#F5F7F7]',
              )}
              style={
                isActive
                  ? { textShadow: '0 0 12px rgba(0, 217, 192, 0.3)' }
                  : undefined
              }
            >
              {t.label}
            </button>
          )
        })}
      </nav>

      {TABS.map((t) => (
        <div
          key={t.value}
          role="tabpanel"
          aria-hidden={active !== t.value}
          className={cn(active === t.value ? 'block' : 'hidden')}
        >
          {props[t.value]}
        </div>
      ))}
    </div>
  )
}
