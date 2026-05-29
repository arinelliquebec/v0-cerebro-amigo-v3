'use client'

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export function Manifesto() {
  const sectionRef = useRef<HTMLElement>(null);
  const leftRef = useRef<HTMLDivElement>(null);
  const rightRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        leftRef.current,
        { opacity: 0, x: -30 },
        {
          opacity: 1,
          x: 0,
          duration: 0.6,
          ease: "power2.out",
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top 80%",
            once: true,
          },
        }
      );

      gsap.fromTo(
        rightRef.current,
        { opacity: 0, x: 30 },
        {
          opacity: 1,
          x: 0,
          duration: 0.6,
          delay: 0.2,
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
      id="funcionalidades"
      className="py-24 md:py-32 bg-[#0A0E0E]"
    >
      <div className="max-w-[1200px] mx-auto px-6 md:px-12">
        <div className="flex flex-col-reverse lg:flex-row items-center gap-12 lg:gap-20">
          {/* Left - Text */}
          <div ref={leftRef} className="flex-1 lg:max-w-[440px] opacity-0">
            <span className="font-mono text-xs tracking-[0.08em] uppercase text-[#00D9C0] mb-4 block">
              O QUE É
            </span>
            <h2 className="text-3xl md:text-4xl font-semibold leading-tight tracking-[-0.01em] mb-4">
              <span className="text-[#F5F7F7]">
                Uma camada de cuidado entre a{" "}
              </span>
              <span className="text-[#00D9C0]">sessão de hoje</span>
              <span className="text-[#F5F7F7]"> e a </span>
              <span className="text-[#00D9C0]">próxima.</span>
            </h2>
            <span className="font-mono text-xs tracking-wide text-[#9AA8A8]/80 block mb-6">
              ↳ médicos · pacientes · LGPD
            </span>
            <p className="text-base leading-relaxed text-[#9AA8A8] max-w-[400px]">
              A lacuna entre consultas é onde o risco vive. O Cérebro Amigo
              preenche esse espaço com dados, empatia e segurança — para que
              nenhum paciente se sinta sozinho na jornada.
            </p>
          </div>

          {/* Right - Illustration */}
          <div ref={rightRef} className="flex-1 opacity-0">
            <div className="rounded-2xl overflow-hidden border border-[#00D9C0]/10 shadow-card">
              <img
                src="/assets/manifesto-illustration.jpg"
                alt="Ilustração abstrata representando conexão empática entre paciente e cuidador"
                className="w-full h-auto"
                loading="lazy"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
