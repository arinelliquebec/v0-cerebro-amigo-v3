'use client'

import { motion } from 'motion/react'
import { cn } from '@/lib/utils'

/**
 * Slider customizado. Agnóstico do contexto (humor, ansiedade, sono…).
 */
export function MoodSlider({
  label,
  hints,
  value,
  min = 0,
  max = 10,
  step = 1,
  unit = '',
  emoji,
  onChange,
}: {
  label: string
  hints?: [string, string, string]
  value: number
  min?: number
  max?: number
  step?: number
  unit?: string
  emoji?: string
  onChange: (v: number) => void
}) {
  const pct = ((value - min) / (max - min)) * 100

  return (
    <div className="relative space-y-3">
      <div className="flex items-baseline justify-between">
        <label className="text-[15px] font-medium text-[#F5F7F7]">{label}</label>
        <div className="flex items-baseline gap-2">
          {emoji && (
            <motion.span
              key={emoji}
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="text-2xl"
            >
              {emoji}
            </motion.span>
          )}
          <span className="text-[26px] font-bold tabular-nums text-[#00D9C0]">
            {value}
            <span className="ml-0.5 text-[13px] font-medium text-[#9AA8A8]">{unit}</span>
          </span>
        </div>
      </div>

      <div className="relative h-7">
        {/* track base */}
        <div className="absolute inset-x-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-white/[0.06]" />
        {/* progresso cyan */}
        <div
          className="absolute left-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-gradient-to-r from-[#00D9C0]/70 to-[#00D9C0]"
          style={{
            width: `${pct}%`,
            boxShadow: '0 0 14px rgba(0, 217, 192, 0.4)',
          }}
        />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className={cn(
            'relative z-10 h-7 w-full cursor-pointer appearance-none bg-transparent',
            // thumb webkit
            '[&::-webkit-slider-thumb]:appearance-none',
            '[&::-webkit-slider-thumb]:h-7 [&::-webkit-slider-thumb]:w-7',
            '[&::-webkit-slider-thumb]:rounded-full',
            '[&::-webkit-slider-thumb]:bg-[#F5F7F7]',
            '[&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-[#00D9C0]',
            '[&::-webkit-slider-thumb]:[box-shadow:0_2px_12px_rgba(0,217,192,0.4)]',
            '[&::-webkit-slider-thumb]:transition-transform',
            'active:[&::-webkit-slider-thumb]:scale-110',
            // thumb firefox
            '[&::-moz-range-thumb]:appearance-none',
            '[&::-moz-range-thumb]:h-7 [&::-moz-range-thumb]:w-7',
            '[&::-moz-range-thumb]:rounded-full',
            '[&::-moz-range-thumb]:bg-[#F5F7F7]',
            '[&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-[#00D9C0]',
          )}
        />
      </div>

      {hints && (
        <div className="flex justify-between text-[12px] font-medium text-[#9AA8A8]">
          <span>{hints[0]}</span>
          <span>{hints[1]}</span>
          <span className="text-right">{hints[2]}</span>
        </div>
      )}
    </div>
  )
}
