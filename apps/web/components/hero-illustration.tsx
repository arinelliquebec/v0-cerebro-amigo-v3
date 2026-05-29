import Image from "next/image"

type HeroIllustrationProps = {
  className?: string
  priority?: boolean
}

/**
 * Ilustração do hero com patch sobre o CTA estático da imagem.
 * Usa blur + gradiente amostrado da arte para fundir com o fundo (sem “recorte branco”).
 */
export function HeroIllustration({ className, priority = true }: HeroIllustrationProps) {
  return (
    <div className={`relative isolate ${className ?? ""}`}>
      <Image
        src="/hero-illustration.png"
        alt="Profissional usando o Cérebro Amigo com agenda, lembretes, check-in e evolução do paciente"
        width={1254}
        height={1254}
        priority={priority}
        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 94vw, 65vw"
        className="h-auto w-full rounded-2xl shadow-2xl"
      />
      {/* Patch: posição calibrada no PNG 1254×1254 */}
      <div
        className="pointer-events-none absolute z-20 overflow-hidden"
        style={{
          left: "3.2%",
          top: "68.2%",
          width: "34.2%",
          height: "9.2%",
        }}
        aria-hidden
      >
        <div
          className="absolute inset-0 rounded-[1.15rem]"
          style={{
            background: `
              linear-gradient(
                165deg,
                rgba(244, 247, 250, 0.88) 0%,
                rgba(246, 248, 251, 0.92) 42%,
                rgba(236, 241, 248, 0.9) 100%
              )
            `,
            backdropFilter: "blur(10px) saturate(1.04)",
            WebkitBackdropFilter: "blur(10px) saturate(1.04)",
            boxShadow: `
              inset 0 1px 0 rgba(255, 255, 255, 0.45),
              0 0 0 1px rgba(245, 248, 252, 0.35),
              0 0 28px 14px rgba(247, 249, 253, 0.55),
              0 0 48px 26px rgba(245, 248, 252, 0.35)
            `,
            maskImage:
              "radial-gradient(ellipse 96% 88% at 50% 50%, #000 38%, transparent 100%)",
            WebkitMaskImage:
              "radial-gradient(ellipse 96% 88% at 50% 50%, #000 38%, transparent 100%)",
          }}
        />
      </div>
    </div>
  )
}
