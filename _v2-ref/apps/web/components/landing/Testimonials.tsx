'use client'

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const testimonials = [
  {
    quote:
      "O Cérebro Amigo transformou minha prática. Pela primeira vez, tenho visibilidade do que acontece com meus pacientes entre as sessões. Os gráficos de humor me deram insights que nunca teria em consulta.",
    name: "Dra. Marina Costa",
    role: "PSIQUIATRA · SP",
    gradient: "from-[#00D9C0] to-[#00A896]",
  },
  {
    quote:
      "Sinto que meu médico realmente me acompanha agora. O lembrete de medicação salvou meu tratamento várias vezes, e registrar meu humor me ajudou a entender meus próprios padrões.",
    name: "Ricardo M.",
    role: "PACIENTE · RJ",
    gradient: "from-[#E8D5F0] to-[#0084D9]",
  },
  {
    quote:
      "Implementamos em toda a clínica. A adesão ao tratamento aumentou 40% no primeiro trimestre. A segurança de dados e o compliance com LGPD foram decisivos na escolha.",
    name: "Dr. Felipe Andrade",
    role: "DIRETOR CLÍNICO · MG",
    gradient: "from-[#00D9C0] to-[#7B61FF]",
  },
];

export function Testimonials() {
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
          { opacity: 0, y: 30 },
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
    <section ref={sectionRef} className="py-24 md:py-32 bg-[#0A0E0E]">
      <div className="max-w-[1200px] mx-auto px-6 md:px-12">
        {/* Header */}
        <div ref={headerRef} className="text-center mb-12 opacity-0">
          <span className="font-mono text-xs tracking-[0.08em] uppercase text-[#00D9C0] mb-4 block">
            QUEM USA
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-[48px] font-bold leading-tight tracking-[-0.02em]">
            <span className="text-[#F5F7F7]">Confiança de quem </span>
            <span className="text-[#00D9C0]">cuida</span>
            <span className="text-[#F5F7F7]"> e de quem </span>
            <span className="text-[#00D9C0]">se cuida</span>
          </h2>
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <div
              key={t.name}
              ref={(el) => { cardsRef.current[i] = el; }}
              className="relative bg-[#111818] border border-[#00D9C0]/[0.08] rounded-2xl p-8 opacity-0"
            >
              {/* Quote mark */}
              <span className="text-5xl text-[#00D9C0]/20 leading-none select-none">
                &#x275D;
              </span>

              {/* Quote text */}
              <p className="text-base text-[#F5F7F7] italic leading-relaxed mt-4 mb-6">
                "{t.quote}"
              </p>

              {/* Author */}
              <div className="flex items-center gap-3">
                <div
                  className={`w-11 h-11 rounded-full bg-gradient-to-br ${t.gradient} flex items-center justify-center`}
                >
                  <span className="text-sm font-semibold text-[#0A0E0E]">
                    {t.name.charAt(0)}
                  </span>
                </div>
                <div>
                  <div className="text-sm font-semibold text-[#F5F7F7]">
                    {t.name}
                  </div>
                  <div className="font-mono text-[11px] text-[#9AA8A8] tracking-wide">
                    {t.role}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
