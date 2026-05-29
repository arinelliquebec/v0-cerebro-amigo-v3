'use client'

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ChevronDown } from "lucide-react";

gsap.registerPlugin(ScrollTrigger);

const faqs = [
  {
    question: "O Cérebro Amigo substitui a consulta presencial?",
    answer:
      "De forma alguma. Somos uma ferramenta de continuidade do cuidado — um complemento que preenche o espaço entre consultas. O diagnóstico e a prescrição permanecem sob responsabilidade exclusiva do médico.",
  },
  {
    question: "Meus dados estão seguros?",
    answer:
      "Sim. Operamos sob LGPD categoria especial (dados de saúde), com criptografia AES-256, armazenamento em Azure Brazil South e auditoria contínua. Nenhum dado sai do Brasil.",
  },
  {
    question: "Preciso instalar algum aplicativo?",
    answer:
      "Não. Tanto o portal do paciente quanto o painel do médico funcionam no navegador — celular, tablet ou desktop. Zero fricção, zero instalações.",
  },
  {
    question: "Como funciona o resumo pré-consulta com IA?",
    answer:
      "Nossa IA analisa os dados registrados pelo paciente (humor, adesão, diário) e gera um resumo estruturado para o médico consultar antes da sessão. A IA nunca diagnostica nem prescreve.",
  },
  {
    question: "Posso usar em piloto antes de contratar?",
    answer:
      "Sim. Oferecemos um piloto fechado de 30 dias para clínicas, sem necessidade de cartão de crédito. É só marcar uma conversa com nosso time clínico.",
  },
];

export function FAQ() {
  const sectionRef = useRef<HTMLElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const itemsRef = useRef<(HTMLDivElement | null)[]>([]);
  const [openIndex, setOpenIndex] = useState<number | null>(null);

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

      itemsRef.current.forEach((item, i) => {
        if (!item) return;
        gsap.fromTo(
          item,
          { opacity: 0, y: 15 },
          {
            opacity: 1,
            y: 0,
            duration: 0.3,
            delay: i * 0.08,
            ease: "power2.out",
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

  const toggleItem = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section ref={sectionRef} className="py-24 md:py-32 bg-[#0A0E0E]">
      <div className="max-w-[800px] mx-auto px-6 md:px-12">
        {/* Header */}
        <div ref={headerRef} className="text-center mb-12 opacity-0">
          <span className="font-mono text-xs tracking-[0.08em] uppercase text-[#00D9C0] mb-4 block">
            DÚVIDAS
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-[48px] font-bold leading-tight tracking-[-0.02em] text-[#F5F7F7]">
            Perguntas frequentes
          </h2>
        </div>

        {/* Accordion */}
        <div className="flex flex-col">
          {faqs.map((faq, i) => {
            const isOpen = openIndex === i;
            return (
              <div
                key={i}
                ref={(el) => { itemsRef.current[i] = el; }}
                className="border-b border-[#00D9C0]/[0.08] opacity-0"
              >
                <button
                  onClick={() => toggleItem(i)}
                  className="w-full flex items-center justify-between py-6 text-left group focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00D9C0]/50 rounded-lg"
                >
                  <span className="text-base font-medium text-[#F5F7F7] pr-4 group-hover:text-[#00D9C0] transition-colors duration-200">
                    {faq.question}
                  </span>
                  <ChevronDown
                    size={20}
                    className={`text-[#00D9C0] flex-shrink-0 transition-transform duration-200 ${
                      isOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>
                <div
                  className={`overflow-hidden transition-all duration-300 ${
                    isOpen ? "max-h-[400px] pb-6" : "max-h-0"
                  }`}
                >
                  <p className="text-sm leading-relaxed text-[#9AA8A8] max-w-[90%]">
                    {faq.answer}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
