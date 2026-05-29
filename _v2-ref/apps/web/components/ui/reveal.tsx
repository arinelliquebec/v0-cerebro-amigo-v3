'use client'

import * as React from 'react'
import { motion, useReducedMotion, type HTMLMotionProps, type Variants } from 'motion/react'
import { cn } from '@/lib/utils'

/* =============================================================================
   Reveal & friends — motion utilities sobre `motion/react`.
   Stagger reveals editoriais: blur + lift + fade.
   ============================================================================= */

const easeEditorial = [0.22, 1, 0.36, 1] as const

const fadeRise: Variants = {
  hidden: { opacity: 0, y: 18, filter: 'blur(8px)' },
  show:   { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.85, ease: easeEditorial } },
}

export function Reveal({
  className,
  delay = 0,
  as = 'div',
  children,
  ...rest
}: {
  className?: string
  delay?: number
  as?: 'div' | 'section' | 'span' | 'p' | 'h1' | 'h2' | 'h3' | 'header' | 'footer' | 'main'
  children: React.ReactNode
} & Omit<HTMLMotionProps<'div'>, 'children'>) {
  const reduce = useReducedMotion()
  const Comp = motion[as] as typeof motion.div

  return (
    <Comp
      className={className}
      initial={reduce ? false : 'hidden'}
      animate="show"
      variants={fadeRise}
      transition={{ delay, duration: 0.85, ease: easeEditorial }}
      {...rest}
    >
      {children}
    </Comp>
  )
}

/* Stagger container — anima filhos diretos com delay incremental. */
export function Stagger({
  className,
  delay = 0.1,
  step = 0.08,
  children,
}: {
  className?: string
  delay?: number
  step?: number
  children: React.ReactNode
}) {
  const reduce = useReducedMotion()
  return (
    <motion.div
      className={className}
      initial={reduce ? false : 'hidden'}
      animate="show"
      variants={{
        hidden: {},
        show: {
          transition: { delayChildren: delay, staggerChildren: step },
        },
      }}
    >
      {children}
    </motion.div>
  )
}

export function StaggerItem({
  className,
  children,
  ...rest
}: {
  className?: string
  children: React.ReactNode
} & Omit<HTMLMotionProps<'div'>, 'children'>) {
  return (
    <motion.div className={className} variants={fadeRise} {...rest}>
      {children}
    </motion.div>
  )
}

/* -----------------------------------------------------------------------------
   SplitWords — quebra texto em palavras animadas individualmente.
   Usado no hero. Preserva acessibilidade — texto inteiro continua selecionável.
   ----------------------------------------------------------------------------- */
export function SplitWords({
  text,
  className,
  delay = 0,
}: {
  text: string
  className?: string
  delay?: number
}) {
  const reduce = useReducedMotion()
  const words = text.split(' ')
  return (
    <span className={cn('inline-block', className)} aria-label={text}>
      {words.map((w, i) => (
        <span key={`${w}-${i}`} aria-hidden className="inline-block overflow-hidden align-baseline">
          <motion.span
            className="inline-block"
            initial={reduce ? false : { y: '110%', opacity: 0 }}
            animate={{ y: '0%', opacity: 1 }}
            transition={{
              delay: delay + i * 0.06,
              duration: 0.75,
              ease: easeEditorial,
            }}
          >
            {w}
            {i < words.length - 1 ? '\u00A0' : ''}
          </motion.span>
        </span>
      ))}
    </span>
  )
}

/* -----------------------------------------------------------------------------
   Magnetic — wrap em torno de CTAs para hover atraente.
   ----------------------------------------------------------------------------- */
export function Magnetic({
  children,
  strength = 0.25,
  className,
}: {
  children: React.ReactNode
  strength?: number
  className?: string
}) {
  const ref = React.useRef<HTMLDivElement>(null)
  const reduce = useReducedMotion()

  function onMove(e: React.MouseEvent<HTMLDivElement>) {
    if (reduce || !ref.current) return
    const r = ref.current.getBoundingClientRect()
    const x = (e.clientX - (r.left + r.width / 2)) * strength
    const y = (e.clientY - (r.top + r.height / 2)) * strength
    ref.current.style.transform = `translate(${x}px, ${y}px)`
  }

  function onLeave() {
    if (!ref.current) return
    ref.current.style.transform = 'translate(0,0)'
  }

  return (
    <div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      className={cn('inline-block transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]', className)}
    >
      {children}
    </div>
  )
}
