'use client'

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Heart, TrendingUp, Shield } from "lucide-react";

gsap.registerPlugin(ScrollTrigger);

const pillars = [
  {
    number: "01",
    label: "PACIENTE",
    title: "Para quem se cuida, um diário privado",
    body: "App leve no celular ou desktop. Registro de humor em segundos, lembrete de medicação, espaço para escrever — sem App Store, sem fricção.",
    icon: Heart,
    gradient: "from-[#00D9C0] to-[#00A896]",
  },
  {
    number: "02",
    label: "MÉDICO",
    title: "Para quem cuida, a clínica em uma página",
    body: "Timeline unificada por paciente, gráficos de humor e adesão, notificações priorizadas, resumo pré-consulta gerado por IA. Tudo no painel web.",
    icon: TrendingUp,
    gradient: "from-[#00D9C0] to-[#0084D9]",
  },
  {
    number: "03",
    label: "COMPLIANCE",
    title: "Segurança clínica auditada por psiquiatra",
    body: "Protocolo de crise revisado, LGPD categoria especial, dados em Azure Brazil South. A IA nunca diagnostica nem prescreve — só extensão administrativa.",
    icon: Shield,
    gradient: "from-[#00D9C0] to-[#7B61FF]",
  },
];

export function ThreePillars() {
  const sectionRef = useRef<HTMLElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<(HTMLDivElement | null)[]>([]);

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

      cardsRef.current.forEach((card, i) => {
        if (!card) return;
        gsap.fromTo(
          card,
          { opacity: 0, y: 40 },
          {
            opacity: 1,
            y: 0,
            duration: 0.5,
            delay: i * 0.15,
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
    <section ref={sectionRef} id="pacientes" className="py-24 md:py-32 bg-[#0A0E0E]">
      <div className="max-w-[1200px] mx-auto px-6 md:px-12">
        {/* Header */}
        <div ref={headerRef} className="mb-12 opacity-0">
          <span className="font-mono text-xs tracking-[0.08em] uppercase text-[#00D9C0] mb-4 block">
            MANIFESTO
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-[48px] font-bold leading-tight tracking-[-0.02em]">
            <span className="text-[#F5F7F7]">Três pilares, </span>
            <span className="text-[#00D9C0]">uma só prática.</span>
          </h2>
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {pillars.map((pillar, i) => {
            const Icon = pillar.icon;
            return (
              <div
                key={pillar.number}
                ref={(el) => { cardsRef.current[i] = el; }}
                className="relative bg-[#111818] border border-[#00D9C0]/[0.08] rounded-2xl p-8 hover:border-[#00D9C0]/25 hover:shadow-card-hover hover:-translate-y-1 transition-all duration-300 opacity-0 group"
              >
                {/* Number watermark */}
                <span className="absolute top-4 right-6 text-5xl font-bold text-[#00D9C0]/10 select-none">
                  {pillar.number}
                </span>

                {/* Icon */}
                <div
                  className={`w-12 h-12 rounded-full bg-gradient-to-br ${pillar.gradient} flex items-center justify-center mb-6`}
                >
                  <Icon size={22} className="text-[#0A0E0E]" />
                </div>

                {/* Label */}
                <span className="font-mono text-[11px] tracking-[0.08em] text-[#00D9C0] uppercase block mb-3">
                  {pillar.label}
                </span>

                {/* Title */}
                <h3 className="text-xl font-semibold text-[#F5F7F7] mb-3 leading-snug">
                  {pillar.title}
                </h3>

                {/* Body */}
                <p className="text-sm leading-relaxed text-[#9AA8A8]">
                  {pillar.body}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
