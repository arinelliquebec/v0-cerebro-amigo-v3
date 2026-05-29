import * as React from 'react'
import { cn } from '@/lib/utils'

/**
 * Cartão padrão para o portal do paciente.
 * Visual cyan limpo + tipografia clínica.
 */
export function PaperCard({
  className,
  children,
  ...rest
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      {...rest}
      className={cn(
        'relative overflow-hidden rounded-2xl',
        'border border-[#00D9C0]/[0.08] bg-[#111818]',
        'transition-all duration-300',
        'hover:border-[#00D9C0]/20',
        className,
      )}
    >
      {/* Top accent line */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#00D9C0]/25 to-transparent pointer-events-none" />
      {children}
    </div>
  )
}

export function PaperCardHeader({
  numeral,
  eyebrow,
  title,
  italic,
}: {
  numeral?: string
  eyebrow?: string
  title?: string
  italic?: string
}) {
  return (
    <div className="flex items-start justify-between gap-3 px-5 pt-5">
      <div className="flex-1 min-w-0">
        {eyebrow && (
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00D9C0]" />
            <span className="text-[13px] font-medium text-[#00D9C0]/70">
              {eyebrow}
            </span>
          </div>
        )}
        {(title || italic) && (
          <h2 className="mt-2 text-[22px] font-bold tracking-tight leading-tight text-[#F5F7F7]">
            {title}
            {title && italic && ' '}
            {italic && <span className="text-[#00D9C0]">{italic}</span>}
          </h2>
        )}
      </div>
      {numeral && (
        <span className="shrink-0 text-[13px] font-medium tabular-nums text-[#9AA8A8]">
          #{numeral}
        </span>
      )}
    </div>
  )
}
