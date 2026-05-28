import { cn } from "@/lib/utils"

interface LogoProps {
  className?: string
  showText?: boolean
  size?: "sm" | "md" | "lg"
}

export function Logo({ className, showText = true, size = "md" }: LogoProps) {
  const sizes = {
    sm: { icon: 32, text: "text-lg" },
    md: { icon: 40, text: "text-xl" },
    lg: { icon: 56, text: "text-2xl" },
  }

  const { icon, text } = sizes[size]

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {/* Brain with Heart Logo */}
      <svg
        width={icon}
        height={icon}
        viewBox="0 0 56 56"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="flex-shrink-0"
      >
        {/* Brain outline */}
        <path
          d="M28 8C20 8 14 14 14 22C14 26 16 29 18 31C16 33 14 36 14 40C14 46 19 50 25 50"
          stroke="#0D9488"
          strokeWidth="2.5"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M28 8C36 8 42 14 42 22C42 26 40 29 38 31C40 33 42 36 42 40C42 46 37 50 31 50"
          stroke="#0D9488"
          strokeWidth="2.5"
          strokeLinecap="round"
          fill="none"
        />
        {/* Brain internal lines */}
        <path
          d="M28 12V24"
          stroke="#0D9488"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <path
          d="M20 18C24 18 26 20 28 20C30 20 32 18 36 18"
          stroke="#0D9488"
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M18 26C22 26 25 28 28 28C31 28 34 26 38 26"
          stroke="#0D9488"
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
        />
        {/* Heart at bottom */}
        <path
          d="M28 42L24 38C22 36 22 33 24 31C26 29 29 29 28 32C27 29 30 29 32 31C34 33 34 36 32 38L28 42Z"
          fill="#0D9488"
          stroke="#0D9488"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>

      {showText && (
        <div className={cn("flex items-baseline gap-1", text)}>
          <span className="font-serif italic font-semibold text-[#0F2137]">
            Cérebro
          </span>
          <span className="font-sans font-medium text-[#0D9488]">
            Amigo
          </span>
        </div>
      )}
    </div>
  )
}
