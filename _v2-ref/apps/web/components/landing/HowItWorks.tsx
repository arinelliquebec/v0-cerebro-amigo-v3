'use client'

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const steps = [
  {
    number: "01",
    title: "Cadastro da clínica",
    body: "Seu time recebe credenciais em menos de 24h. Nenhuma instalação, nenhuma configuração complexa.",
  },
  {
    number: "02",
    title: "Convide seus pacientes",
    body: "Envie links de acesso direto por WhatsApp ou e-mail. Pacientes entram sem baixar nada — tudo pelo navegador.",
  },
  {
    number: "03",
    title: "Acompanhe em tempo real",
    body: "Veja humor, adesão e diários na timeline. Receba alertas inteligentes e chegue à consulta sabendo tudo.",
  },
];

export function HowItWorks() {
  const sectionRef = useRef<HTMLElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const stepsRef = useRef<(HTMLDivElement | null)[]>([]);
  const lineRef = useRef<HTMLDivElement>(null);

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

      // Timeline line animation
      if (lineRef.current) {
        gsap.fromTo(
          lineRef.current,
          { scaleY: 0 },
          {
            scaleY: 1,
            duration: 1.5,
            ease: "power2.out",
            scrollTrigger: {
              trigger: sectionRef.current,
              start: "top 70%",
              end: "bottom 50%",
              scrub: 1,
            },
          }
        );
      }

      stepsRef.current.forEach((step, i) => {
        if (!step) return;
        gsap.fromTo(
          step,
          { opacity: 0, x: 20 },
          {
            opacity: 1,
            x: 0,
            duration: 0.5,
            delay: i * 0.2,
            ease: "power2.out",
            scrollTrigger: {
              trigger: sectionRef.current,
              start: "top 80%",
              once: true,
            },
          }
        );
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="py-24 md:py-32 bg-[#0A0E0E]">
      <div className="max-w-[1000px] mx-auto px-6 md:px-12">
        {/* Header */}
        <div ref={headerRef} className="text-center mb-16 opacity-0">
          <span className="font-mono text-xs tracking-[0.08em] uppercase text-[#00D9C0] mb-4 block">
            COMO FUNCIONA
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-[48px] font-bold leading-tight tracking-[-0.02em]">
            <span className="text-[#F5F7F7]">Três passos, </span>
            <span className="text-[#00D9C0]">zero fricção</span>
          </h2>
        </div>

        {/* Timeline */}
        <div className="relative">
          {/* Vertical line - desktop only */}
          <div
            ref={lineRef}
            className="hidden md:block absolute left-[60px] top-0 bottom-0 w-0.5 bg-gradient-to-b from-[#00D9C0] via-[#00D9C0]/50 to-transparent origin-top"
          />

          <div className="flex flex-col gap-12">
            {steps.map((step, i) => (
              <div
                key={step.number}
                ref={(el) => { stepsRef.current[i] = el; }}
                className="relative flex flex-col md:flex-row items-start gap-4 md:gap-8 opacity-0"
              >
                {/* Step number + dot */}
                <div className="flex items-center gap-4 md:w-[120px] flex-shrink-0">
                  <span className="font-mono text-2xl text-[#00D9C0] font-medium">
                    {step.number}
                  </span>
                  {/* Mobile line segment */}
                  {i < steps.length - 1 && (
                    <div className="md:hidden flex-1 h-0.5 bg-gradient-to-r from-[#00D9C0]/50 to-transparent" />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 bg-[#111818] border border-[#00D9C0]/[0.08] rounded-2xl p-6 md:p-8 hover:border-[#00D9C0]/25 transition-all duration-300">
                  <h3 className="text-xl font-semibold text-[#F5F7F7] mb-2">
                    {step.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-[#9AA8A8] max-w-[500px]">
                    {step.body}
                  </p>
                </div>

                {/* Dot on timeline - desktop */}
                <div className="hidden md:block absolute left-[56px] top-8 w-3 h-3 rounded-full bg-[#00D9C0] shadow-glow" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
