import * as React from 'react'
import { cn } from '@/lib/utils'

/* =============================================================================
   Card — Futuristic glassmorphism style
   - <Card><CardHeader>…</CardHeader><CardContent>…</CardContent></Card>
   - <Card label="…" value="…" hint="…" />     (legado / dashboard)
   ============================================================================= */

type StatProps = { label: string; value: string; hint?: string; index?: number }

type CardProps =
  | (React.HTMLAttributes<HTMLDivElement> & Partial<StatProps> & { label?: undefined })
  | (Omit<React.HTMLAttributes<HTMLDivElement>, 'children'> & StatProps)

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, ...props }, ref) => {
    if ('label' in props && props.label !== undefined && 'value' in props) {
      const { label, value, hint, index, ...rest } = props as StatProps & React.HTMLAttributes<HTMLDivElement>
      return (
        <div
          ref={ref}
          className={cn(
            'group relative overflow-hidden rounded-2xl',
            'bg-[#111818]/70 backdrop-blur-xl',
            'border border-[#00D9C0]/10',
            'p-6 transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]',
            'hover:-translate-y-1 hover:border-[#00D9C0]/30',
            'hover:shadow-[0_0_30px_oklch(0.65_0.22_195/0.2)]',
            className,
          )}
          {...rest}
        >
          {/* Top accent line */}
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#00D9C0]/40 to-transparent" />
          
          {/* Index number */}
          <div className="absolute right-5 top-5 text-[10px] tracking-[0.2em] text-[#00D9C0]/40">
            {typeof index === 'number' ? String(index).padStart(2, '0') : '—'}
          </div>
          
          {/* Label */}
          <div className="text-[11px] font-medium tracking-wide text-[#00D9C0]/70">{label}</div>
          
          {/* Value with glow */}
          <div className="num mt-3 text-4xl font-bold leading-none text-[#F5F7F7] [text-shadow:0_0_30px_rgba(0,217,192,0.3)]">
            {value}
          </div>
          
          {hint && <div className="mt-2 text-xs text-[#9AA8A8]">{hint}</div>}
          
          {/* Bottom scan line */}
          <div
            aria-hidden
            className="absolute inset-x-6 -bottom-px h-px origin-left scale-x-0 bg-gradient-to-r from-[#00D9C0] via-[#00D9C0]/70 to-transparent transition-transform duration-700 group-hover:scale-x-100"
          />
          
          {/* Corner accents */}
          <div className="absolute left-0 top-0 h-4 w-px bg-gradient-to-b from-[#00D9C0]/50 to-transparent" />
          <div className="absolute left-0 top-0 h-px w-4 bg-gradient-to-r from-[#00D9C0]/50 to-transparent" />
          <div className="absolute right-0 bottom-0 h-4 w-px bg-gradient-to-t from-[#00D9C0]/50 to-transparent" />
          <div className="absolute right-0 bottom-0 h-px w-4 bg-gradient-to-l from-[#00D9C0]/50 to-transparent" />
        </div>
      )
    }

    const rest = props as React.HTMLAttributes<HTMLDivElement>
    return (
      <div
        ref={ref}
        className={cn(
          'group relative overflow-hidden rounded-2xl',
          'bg-[#111818]/70 backdrop-blur-xl',
          'border border-[#00D9C0]/10',
          'shadow-[var(--shadow-card)]',
          'transition-[transform,box-shadow,border-color] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]',
          className,
        )}
        {...rest}
      />
    )
  },
)
Card.displayName = 'Card'

export const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex flex-col gap-1.5 p-6 pb-4', className)} {...props} />
  ),
)
CardHeader.displayName = 'CardHeader'

export const CardTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3 ref={ref} className={cn('text-2xl font-semibold leading-none text-[#F5F7F7]', className)} {...props} />
  ),
)
CardTitle.displayName = 'CardTitle'

export const CardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p ref={ref} className={cn('text-sm text-[#9AA8A8] leading-relaxed', className)} {...props} />
  ),
)
CardDescription.displayName = 'CardDescription'

export const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('p-6 pt-0', className)} {...props} />
  ),
)
CardContent.displayName = 'CardContent'

export const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex items-center p-6 pt-0', className)} {...props} />
  ),
)
CardFooter.displayName = 'CardFooter'
