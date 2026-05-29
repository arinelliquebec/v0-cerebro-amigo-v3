import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

/**
 * Button — Futuristic neon style with glass effects
 */
const buttonVariants = cva(
  [
    'inline-flex items-center justify-center gap-2 select-none',
    'rounded-xl font-medium tracking-tight',
    'transition-all duration-300',
    'ease-[cubic-bezier(0.22,1,0.36,1)]',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
    'focus-visible:ring-[#00D9C0] focus-visible:ring-offset-[#0A0E0E]',
    'disabled:opacity-50 disabled:pointer-events-none',
    'whitespace-nowrap',
    'relative overflow-hidden',
  ].join(' '),
  {
    variants: {
      variant: {
        primary: [
          'bg-[#00D9C0] text-[#0A0E0E] border border-[#00D9C0]',
          'hover:bg-[#00D9C0] hover:-translate-y-0.5',
          'hover:[box-shadow:0_0_30px_oklch(0.65_0.22_195/0.5),0_0_60px_oklch(0.65_0.22_195/0.2)]',
          'active:translate-y-0',
          '[text-shadow:0_1px_2px_oklch(0_0_0/0.3)]',
        ].join(' '),
        violet: [
          'text-[#F5F7F7] border border-[#00D9C0]/50',
          'bg-gradient-to-r from-[#00D9C0] to-[#00D9C0]/70',
          'hover:-translate-y-0.5 hover:[box-shadow:0_0_40px_oklch(0.65_0.22_195/0.4)]',
          'hover:border-[#00D9C0]',
          'active:translate-y-0',
        ].join(' '),
        outline: [
          'bg-transparent text-[#F5F7F7] border border-[#00D9C0]/30',
          'hover:bg-[#00D9C0]/10 hover:border-[#00D9C0]/50 hover:text-[#00D9C0]',
          'hover:[box-shadow:0_0_20px_oklch(0.65_0.22_195/0.2)]',
        ].join(' '),
        ghost: [
          'bg-transparent text-[#9AA8A8]',
          'hover:bg-[#00D9C0]/10 hover:text-[#F5F7F7]',
        ].join(' '),
        link: [
          'bg-transparent text-[#00D9C0] underline-offset-4',
          'hover:underline hover:text-[#00D9C0]',
        ].join(' '),
        danger: [
          'bg-purple-600 text-[#F5F7F7] border border-purple-500',
          'hover:bg-purple-500 hover:-translate-y-0.5',
          'hover:[box-shadow:0_0_30px_oklch(0.60_0.24_320/0.4)]',
          'active:translate-y-0',
        ].join(' '),
      },
      size: {
        sm: 'h-9 px-4 text-sm',
        md: 'h-11 px-6 text-sm',
        lg: 'h-14 px-8 text-base',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  },
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, children, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    >
      {children}
      {/* Shimmer overlay effect */}
      <span
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background: 'linear-gradient(90deg, transparent, oklch(1 0 0 / 0.1), transparent)',
          transform: 'translateX(-100%)',
        }}
      />
    </button>
  ),
)
Button.displayName = 'Button'

export { buttonVariants }
