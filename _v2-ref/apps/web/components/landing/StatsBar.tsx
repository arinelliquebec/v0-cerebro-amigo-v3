'use client'

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const stats = [
  { value: "24/7", label: "CONTINUIDADE ENTRE CONSULTAS" },
  { value: "< 30s", label: "PARA REGISTRAR HUMOR" },
  { value: "LGPD", label: "CATEGORIA ESPECIAL" },
];

export function StatsBar() {
  const sectionRef = useRef<HTMLElement>(null);
  const statsRef = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const ctx = gsap.context(() => {
      statsRef.current.forEach((stat, i) => {
        if (!stat) return;
        const valueEl = stat.querySelector(".stat-value");
        const labelEl = stat.querySelector(".stat-label");

        gsap.fromTo(
          valueEl,
          { opacity: 0, scale: 0.8 },
          {
            opacity: 1,
            scale: 1,
            duration: 0.8,
            delay: i * 0.2,
            ease: "back.out(1.7)",
            scrollTrigger: {
              trigger: sectionRef.current,
              start: "top 85%",
              once: true,
            },
          }
        );

        gsap.fromTo(
          labelEl,
          { opacity: 0 },
          {
            opacity: 1,
            duration: 0.4,
            delay: i * 0.2 + 0.3,
            scrollTrigger: {
              trigger: sectionRef.current,
              start: "top 85%",
              once: true,
            },
          }
        );
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="seguranca"
      className="w-full bg-[#111818] border-y border-[#00D9C0]/10 py-16 md:py-20"
    >
      <div className="max-w-[1200px] mx-auto px-6 md:px-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8">
          {stats.map((stat, i) => (
            <div
              key={stat.label}
              ref={(el) => { statsRef.current[i] = el; }}
              className="flex items-start gap-4 justify-center"
            >
              {/* Decorative line */}
              <div className="hidden md:block w-0.5 h-10 bg-[#00D9C0]/50 mt-2" />
              <div className="text-center md:text-left">
                <div className="stat-value text-5xl md:text-6xl lg:text-7xl font-bold text-[#00D9C0] tracking-[-0.03em] opacity-0">
                  {stat.value}
                </div>
                <div className="stat-label font-mono text-[11px] tracking-[0.08em] text-[#9AA8A8] mt-2 opacity-0">
                  {stat.label}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
