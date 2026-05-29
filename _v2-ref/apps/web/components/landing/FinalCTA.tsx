'use client'

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export function FinalCTA() {
  const sectionRef = useRef<HTMLElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        contentRef.current,
        { opacity: 0, y: 25 },
        {
          opacity: 1,
          y: 0,
          duration: 0.6,
          ease: "power2.out",
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top 80%",
            once: true,
          },
        }
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="w-full border-t border-[#00D9C0]/10 py-24 md:py-32 bg-[#111818]"
      style={{
        background:
          "radial-gradient(ellipse 60% 50% at 50% 50%, rgba(0, 217, 192, 0.06) 0%, transparent 70%), #111818",
      }}
    >
      <div
        ref={contentRef}
        className="max-w-[720px] mx-auto px-6 md:px-12 text-center opacity-0"
      >
        <span className="font-mono text-xs tracking-[0.08em] uppercase text-[#00D9C0] mb-4 block">
          PRÓXIMA CONSULTA
        </span>
        <h2 className="text-3xl md:text-4xl lg:text-[48px] font-bold leading-tight tracking-[-0.02em] mb-5">
          <span className="text-[#F5F7F7]">Cuidado entre </span>
          <span className="text-[#00D9C0]">linhas.</span>
          <br />
          <span className="text-[#F5F7F7]">Não entre </span>
          <span className="text-[#00D9C0]">silêncios.</span>
        </h2>
        <p className="text-base text-[#9AA8A8] max-w-[520px] mx-auto mb-10">
          Comece com sua clínica em piloto fechado. Sem cartão, sem fricção —
          só conversa com nosso time clínico.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <a
            href="/login"
            className="inline-flex items-center bg-[#00D9C0] text-[#0A0E0E] px-8 py-4 rounded-xl font-semibold text-base hover:scale-[1.02] hover:shadow-glow transition-all duration-200 w-full sm:w-auto justify-center"
          >
            Marcar conversa →
          </a>
          <a
            href="/privacidade"
            className="inline-flex items-center border border-[#00D9C0]/15 text-[#F5F7F7] px-8 py-4 rounded-xl font-medium text-base hover:border-[#00D9C0] hover:text-[#00D9C0] transition-all duration-200 w-full sm:w-auto justify-center"
          >
            Como tratamos os dados →
          </a>
        </div>
      </div>
    </section>
  );
}
