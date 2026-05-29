'use client'

import { useEffect, useRef } from "react";
import { DashboardFullPreview } from './DashboardFullPreview'
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Calendar, TrendingUp, Bell, Sparkles } from "lucide-react";

gsap.registerPlugin(ScrollTrigger);

const callouts = [
  {
    icon: Calendar,
    text: "Timeline clínica unificada",
    position: "top-left" as const,
  },
  {
    icon: TrendingUp,
    text: "Gráficos de humor em tempo real",
    position: "top-right" as const,
  },
  {
    icon: Bell,
    text: "Alertas de adesão inteligentes",
    position: "bottom-left" as const,
  },
  {
    icon: Sparkles,
    text: "Resumo pré-consulta com IA",
    position: "bottom-right" as const,
  },
];

export function ProductPreview() {
  const sectionRef = useRef<HTMLElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLDivElement>(null);
  const calloutsRef = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        headerRef.current,
        { opacity: 0, y: 20 },
        {
          opacity: 1,
          y: 0,
          duration: 0.5,
          ease: "power2.out",
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top 85%",
            once: true,
          },
        }
      );

      gsap.fromTo(
        imageRef.current,
        { opacity: 0, scale: 0.95 },
        {
          opacity: 1,
          scale: 1,
          duration: 0.8,
          ease: "power2.out",
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top 80%",
            once: true,
          },
        }
      );

      calloutsRef.current.forEach((callout, i) => {
        if (!callout) return;
        gsap.fromTo(
          callout,
          { opacity: 0, y: 15 },
          {
            opacity: 1,
            y: 0,
            duration: 0.4,
            delay: 0.2 + i * 0.1,
            ease: "power2.out",
            scrollTrigger: {
              trigger: sectionRef.current,
              start: "top 75%",
              once: true,
            },
          }
        );
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} id="medicos" className="py-24 md:py-32 bg-[#0A0E0E]">
      <div className="max-w-[1200px] mx-auto px-6 md:px-12">
        {/* Header */}
        <div ref={headerRef} className="text-center mb-12 opacity-0">
          <span className="font-mono text-xs tracking-[0.08em] uppercase text-[#00D9C0] mb-4 block">
            O PRODUTO
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-[48px] font-bold leading-tight tracking-[-0.02em] mb-4">
            <span className="text-[#F5F7F7]">Veja a clínica em </span>
            <span className="text-[#00D9C0]">uma só página</span>
          </h2>
          <p className="text-base text-[#9AA8A8] max-w-[560px] mx-auto">
            Timeline unificada, gráficos de humor em tempo real, alertas de
            adesão e resumo pré-consulta com IA. Tudo que seu paciente vive,
            você vê.
          </p>
        </div>

        {/* Dashboard + Callouts */}
        <div className="relative">
          {/* Dashboard Image */}
          <div
            ref={imageRef}
            className="rounded-2xl overflow-hidden border border-[#00D9C0]/10 shadow-dashboard-lg opacity-0"
          >
            <DashboardFullPreview />
          </div>

          {/* Feature Callouts - Desktop */}
          <div className="hidden lg:block">
            {callouts.map((callout, i) => {
              const Icon = callout.icon;
              const positions: Record<string, string> = {
                "top-left": "-top-6 -left-4",
                "top-right": "-top-6 -right-4",
                "bottom-left": "-bottom-6 -left-4",
                "bottom-right": "-bottom-6 -right-4",
              };
              return (
                <div
                  key={callout.text}
                  ref={(el) => { calloutsRef.current[i] = el; }}
                  className={`absolute ${positions[callout.position]} bg-[#111818] border border-[#00D9C0]/10 rounded-xl px-4 py-3 flex items-center gap-3 shadow-card hover:shadow-card-hover hover:border-[#00D9C0]/25 transition-all duration-300 opacity-0`}
                >
                  <Icon size={18} className="text-[#00D9C0] flex-shrink-0" />
                  <span className="text-sm text-[#F5F7F7] whitespace-nowrap">
                    {callout.text}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Mobile Callouts Grid */}
        <div className="grid grid-cols-2 gap-3 mt-10 lg:hidden">
          {callouts.map((callout) => {
            const Icon = callout.icon;
            return (
              <div
                key={callout.text}
                className="bg-[#111818] border border-[#00D9C0]/10 rounded-xl px-4 py-3 flex items-center gap-3"
              >
                <Icon size={16} className="text-[#00D9C0] flex-shrink-0" />
                <span className="text-xs text-[#F5F7F7]">{callout.text}</span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
