import type { ReactNode } from 'react'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { cn } from '@/lib/utils'

export function PageHeader({
  back,
  eyebrow,
  title,
  italic,
  kicker,
  children,
  className,
}: {
  back?: string
  eyebrow?: string
  title?: string
  italic?: string
  kicker?: ReactNode
  children?: ReactNode
  className?: string
}) {
  return (
    <header className={cn('relative px-5 pt-6 pb-5', className)}>
      {back && (
        <Link
          href={back}
          className="mb-4 inline-flex items-center gap-1.5 text-[13px] font-medium text-[#9AA8A8] transition-colors hover:text-[#00D9C0]"
        >
          <ChevronLeft size={16} strokeWidth={2} />
          Voltar
        </Link>
      )}
      {eyebrow && (
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-[#00D9C0]" />
          <span className="text-[13px] font-medium text-[#00D9C0]/70">
            {eyebrow}
          </span>
        </div>
      )}
      {(title || italic) && (
        <h1 className="mt-2 text-[32px] font-bold leading-[1.05] tracking-tight text-[#F5F7F7]">
          {title}
          {title && italic && ' '}
          {italic && <span className="text-[#00D9C0]">{italic}</span>}
        </h1>
      )}
      {kicker && (
        <div className="mt-2 max-w-md text-[15px] leading-relaxed text-[#D0D5D5]/80">
          {kicker}
        </div>
      )}
      {children}
    </header>
  )
}
