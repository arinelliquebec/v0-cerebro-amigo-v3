import type { ReactNode } from "react"
import { PLAYFAIR_DISPLAY } from "@/lib/fonts"
import { cn } from "@/lib/utils"

type BrandWordmarkProps = {
  layout?: "stacked" | "inline"
  size?: "sm" | "md" | "lg" | "auth" | "hero"
  variant?: "default" | "light"
  className?: string
}

const sizeMap = {
  sm: { cerebro: "text-lg", amigo: "text-lg" },
  md: { cerebro: "text-xl", amigo: "text-xl" },
  lg: { cerebro: "text-2xl", amigo: "text-2xl" },
  auth: { cerebro: "text-4xl", amigo: "text-4xl" },
  hero: { cerebro: "text-5xl lg:text-6xl", amigo: "text-5xl lg:text-6xl" },
} as const

const playfairStyle = { fontFamily: PLAYFAIR_DISPLAY } as const

function BrandWord({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span className={cn("tracking-tight", className)} style={playfairStyle}>
      {children}
    </span>
  )
}

export function BrandWordmark({
  layout = "stacked",
  size = "hero",
  variant = "default",
  className,
}: BrandWordmarkProps) {
  const s = sizeMap[size]
  const navy = variant === "light" ? "text-white" : "text-[#0F2137]"
  const teal = variant === "light" ? "text-[#5EEAD4]" : "text-[#14B8A6]"

  if (layout === "inline") {
    return (
      <span className={cn("inline-flex items-baseline gap-1.5", className)}>
        <BrandWord className={cn(s.cerebro, navy, "font-normal")}>Cérebro</BrandWord>
        <BrandWord className={cn(s.amigo, teal, "font-medium")}>Amigo</BrandWord>
      </span>
    )
  }

  return (
    <span className={cn("text-balance", className)}>
      <BrandWord className={cn("block leading-[1.05]", s.cerebro, navy, "font-normal")}>
        Cérebro
      </BrandWord>
      <BrandWord className={cn("block leading-[1.05]", s.amigo, teal, "font-medium")}>
        Amigo
      </BrandWord>
    </span>
  )
}
