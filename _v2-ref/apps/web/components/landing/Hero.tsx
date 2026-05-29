'use client'

import { useEffect, useRef } from "react";
import { DashboardMockupHero } from './DashboardMockupHero'
import { gsap } from "gsap";

export function Hero() {
  const sectionRef = useRef<HTMLElement>(null);
  const taglineRef = useRef<HTMLDivElement>(null);
  const headline1Ref = useRef<HTMLSpanElement>(null);
  const headline2Ref = useRef<HTMLSpanElement>(null);
  const descRef = useRef<HTMLParagraphElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const trustRef = useRef<HTMLDivElement>(null);
  const mockupRef = useRef<HTMLDivElement>(null);
  const orbRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

      tl.fromTo(
        taglineRef.current,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.5 },
        0.2
      )
        .fromTo(
          headline1Ref.current,
          { opacity: 0, y: 30 },
          { opacity: 1, y: 0, duration: 0.6 },
          0.4
        )
        .fromTo(
          headline2Ref.current,
          { opacity: 0, y: 30 },
          { opacity: 1, y: 0, duration: 0.6 },
          0.55
        )
        .fromTo(
          descRef.current,
          { opacity: 0, y: 20 },
          { opacity: 1, y: 0, duration: 0.5 },
          0.7
        )
        .fromTo(
          ctaRef.current,
          { opacity: 0, y: 15 },
          { opacity: 1, y: 0, duration: 0.4 },
          0.9
        )
        .fromTo(
          trustRef.current,
          { opacity: 0, y: 10 },
          { opacity: 1, y: 0, duration: 0.4 },
          1.1
        )
        .fromTo(
          mockupRef.current,
          { opacity: 0, x: 40, scale: 0.95 },
          { opacity: 1, x: 0, scale: 1, duration: 0.8 },
          0.6
        );

      // Floating animation for mockup
      gsap.to(mockupRef.current, {
        y: -8,
        duration: 3,
        ease: "sine.inOut",
        yoyo: true,
        repeat: -1,
      });

      // Pulsing orb
      gsap.to(orbRef.current, {
        scale: 1.1,
        opacity: 0.3,
        duration: 4,
        ease: "sine.inOut",
        yoyo: true,
        repeat: -1,
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative min-h-[100dvh] flex items-center overflow-hidden bg-[#0A0E0E]"
      style={{
        background:
          "radial-gradient(ellipse 80% 60% at 70% 40%, rgba(0, 217, 192, 0.06) 0%, transparent 60%)",
      }}
    >
      {/* Watermark */}
      <div className="absolute top-10 right-4 md:right-10 text-[200px] md:text-[400px] font-bold text-[#00D9C0]/[0.03] leading-none pointer-events-none select-none z-0">
        01
      </div>

      {/* Cyan orb behind mockup */}
      <div
        ref={orbRef}
        className="absolute right-[5%] md:right-[15%] top-1/3 w-[200px] h-[200px] md:w-[300px] md:h-[300px] rounded-full pointer-events-none z-0"
        style={{
          background:
            "radial-gradient(circle, rgba(0, 217, 192, 0.12) 0%, transparent 70%)",
          filter: "blur(40px)",
        }}
      />

      <div className="relative z-10 max-w-[1200px] mx-auto px-6 md:px-12 py-24 w-full">
        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-8">
          {/* Left Column - Text */}
          <div className="flex-1 max-w-[580px] text-center lg:text-left">
            {/* Tagline */}
            <div
              ref={taglineRef}
              className="flex items-center justify-center lg:justify-start gap-2 mb-6 opacity-0"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#00D9C0]" />
              <span className="font-mono text-xs tracking-[0.08em] uppercase text-[#00D9C0]">
                PSIQUIATRIA · ENTRE CONSULTAS
              </span>
            </div>

            {/* Headline */}
            <h1 className="text-[40px] md:text-[56px] lg:text-[64px] font-bold leading-[1.05] tracking-[-0.03em] mb-6">
              <span ref={headline1Ref} className="block text-[#F5F7F7] opacity-0">
                Cuidado contínuo,
              </span>
              <span ref={headline2Ref} className="block text-[#00D9C0] opacity-0">
                entre as consultas.
              </span>
            </h1>

            {/* Description */}
            <p
              ref={descRef}
              className="text-base leading-relaxed text-[#9AA8A8] max-w-[480px] mx-auto lg:mx-0 mb-8 opacity-0"
            >
              Lembretes de medicação, registro de humor, diário do paciente,
              timeline clínica e protocolo de crise — em uma única plataforma que
              conecta paciente e psiquiatra sem ruído.
            </p>

            {/* CTAs */}
            <div
              ref={ctaRef}
              className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start mb-6 opacity-0"
            >
              <a
                href="/login"
                className="inline-flex items-center gap-2 bg-[#00D9C0] text-[#0A0E0E] px-7 py-3.5 rounded-xl font-semibold text-base hover:scale-[1.02] hover:shadow-glow transition-all duration-200 w-full sm:w-auto justify-center"
              >
                Sou psiquiatra
              </a>
              <a
                href="/p/entrar"
                className="inline-flex items-center gap-2 border border-[#00D9C0]/15 text-[#F5F7F7] px-7 py-3.5 rounded-xl font-medium text-base hover:border-[#00D9C0] hover:text-[#00D9C0] transition-all duration-200 w-full sm:w-auto justify-center"
              >
                Entrar como paciente →
              </a>
            </div>

            {/* Trust micro-bar */}
            <div
              ref={trustRef}
              className="flex flex-wrap items-center justify-center lg:justify-start gap-x-6 gap-y-2 opacity-0"
            >
              {[
                "LGPD Categoria Especial",
                "Dados no Brasil",
                "Auditado por psiquiatras",
              ].map((item) => (
                <span
                  key={item}
                  className="flex items-center gap-1.5 font-mono text-[11px] tracking-wide text-[#9AA8A8]/70"
                >
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 12 12"
                    fill="none"
                    className="text-[#00D9C0] flex-shrink-0"
                  >
                    <path
                      d="M2 6L5 9L10 3"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  {item}
                </span>
              ))}
            </div>
          </div>

          {/* Right Column - Dashboard Mockup */}
          <div className="flex-1 flex justify-center lg:justify-end w-full">
            <div
              ref={mockupRef}
              className="relative w-full max-w-[780px] opacity-0"
            >
              <div className="rounded-2xl overflow-hidden border border-[#00D9C0]/10 shadow-dashboard bg-[#111818]">
                <DashboardMockupHero />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
