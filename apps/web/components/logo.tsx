import Image from "next/image"
import { cn } from "@/lib/utils"

interface LogoProps {
  className?: string
  showText?: boolean
  size?: "sm" | "md" | "lg"
  /** Use light colors for dark backgrounds */
  variant?: "default" | "light"
}

export function Logo({ className, showText = true, size = "md", variant = "default" }: LogoProps) {
  const sizes = {
    sm: { icon: 32, text: "text-lg" },
    md: { icon: 40, text: "text-xl" },
    lg: { icon: 56, text: "text-2xl" },
  }

  const { icon, text } = sizes[size]

  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      {/* Exact brain icon extracted from the Cérebro Amigo hero artwork */}
      <Image
        src="/brain-logo.png"
        alt="Cérebro Amigo"
        width={icon}
        height={icon}
        priority
        className={cn(
          "flex-shrink-0 object-contain",
          // On dark surfaces, render the brain as a clean light silhouette so it stays legible
          variant === "light" && "[filter:brightness(0)_invert(1)]"
        )}
      />

      {showText && (
        <div className={cn("flex items-baseline gap-1.5 tracking-tight", text)}>
          <span className={cn("font-serif italic font-semibold", variant === "light" ? "text-white" : "text-[#0F2137]")}>
            Cérebro
          </span>
          <span className={cn("font-sans font-medium", variant === "light" ? "text-[#14B8A6]" : "text-[#0D9488]")}>
            Amigo
          </span>
        </div>
      )}
    </div>
  )
}
