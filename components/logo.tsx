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

  // Left hemisphere = navy, right hemisphere = teal (echoes "Cérebro" + "Amigo")
  const leftColor = variant === "light" ? "#FFFFFF" : "#0F2137"
  const rightColor = variant === "light" ? "#5EEAD4" : "#0D9488"

  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      {/* Neural circuit brain — split hemispheres with connected nodes */}
      <svg
        width={icon}
        height={icon}
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="flex-shrink-0"
        aria-hidden="true"
      >
        {/* Center divider */}
        <line x1="32" y1="11" x2="32" y2="53" stroke={rightColor} strokeWidth="2" strokeLinecap="round" />

        {/* ---------- LEFT HEMISPHERE ---------- */}
        <path
          d="M30 12.5C24.5 11 18.5 12.5 15 16.5C12.5 13.8 8 14.5 6.5 17.5C5 20.3 6.2 23.2 8.5 24.5C5.8 26.2 4.8 29.5 6.2 32.2C4.2 34 3.8 37.2 5.6 39.5C4.4 42.2 5.4 45.5 8.2 47C8 50.5 11 53.5 14.8 53C17 56 21.5 56.2 24.5 53.8C26.8 55.4 29.6 55 30 52.5"
          stroke={leftColor}
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        {/* Left inner connections */}
        <path d="M30 22C25 21 21 23 19 26" stroke={leftColor} strokeWidth="2" strokeLinecap="round" />
        <path d="M30 33C24 33 19 31 16 28" stroke={leftColor} strokeWidth="2" strokeLinecap="round" />
        <path d="M30 42C25 43 20 42 17 39" stroke={leftColor} strokeWidth="2" strokeLinecap="round" />
        {/* Left nodes */}
        <circle cx="15" cy="16.5" r="2.4" fill={leftColor} />
        <circle cx="8.5" cy="24.5" r="2.2" fill={leftColor} />
        <circle cx="19" cy="26" r="2" fill={leftColor} />
        <circle cx="16" cy="28" r="2" fill={leftColor} />
        <circle cx="8.2" cy="47" r="2.2" fill={leftColor} />
        <circle cx="17" cy="39" r="2" fill={leftColor} />

        {/* ---------- RIGHT HEMISPHERE ---------- */}
        <path
          d="M34 12.5C39.5 11 45.5 12.5 49 16.5C51.5 13.8 56 14.5 57.5 17.5C59 20.3 57.8 23.2 55.5 24.5C58.2 26.2 59.2 29.5 57.8 32.2C59.8 34 60.2 37.2 58.4 39.5C59.6 42.2 58.6 45.5 55.8 47C56 50.5 53 53.5 49.2 53C47 56 42.5 56.2 39.5 53.8C37.2 55.4 34.4 55 34 52.5"
          stroke={rightColor}
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        {/* Right inner connections */}
        <path d="M34 22C39 21 43 23 45 26" stroke={rightColor} strokeWidth="2" strokeLinecap="round" />
        <path d="M34 33C40 33 45 31 48 28" stroke={rightColor} strokeWidth="2" strokeLinecap="round" />
        <path d="M34 42C39 43 44 42 47 39" stroke={rightColor} strokeWidth="2" strokeLinecap="round" />
        {/* Right nodes */}
        <circle cx="49" cy="16.5" r="2.4" fill={rightColor} />
        <circle cx="55.5" cy="24.5" r="2.2" fill={rightColor} />
        <circle cx="45" cy="26" r="2" fill={rightColor} />
        <circle cx="48" cy="28" r="2" fill={rightColor} />
        <circle cx="55.8" cy="47" r="2.2" fill={rightColor} />
        <circle cx="47" cy="39" r="2" fill={rightColor} />
      </svg>

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
