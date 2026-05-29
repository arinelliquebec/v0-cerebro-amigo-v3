'use client'

import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";
import { Logo } from "@/components/landing/Logo";

const navLinks = [
  { label: "Funcionalidades", href: "#funcionalidades" },
  { label: "Para Médicos", href: "#medicos" },
  { label: "Para Pacientes", href: "#pacientes" },
  { label: "Segurança", href: "#seguranca" },
];

export function Navigation() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 100);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    const target = document.querySelector(href);
    if (target) {
      target.scrollIntoView({ behavior: "smooth" });
    }
    setIsMobileOpen(false);
  };

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-400 ${
          isScrolled
            ? "opacity-100 translate-y-0"
            : "opacity-0 -translate-y-full pointer-events-none"
        }`}
      >
        <div
          className={`border-b border-[#00D9C0]/5 transition-all duration-300 ${
            isScrolled ? "bg-[#0A0E0E]/85 backdrop-blur-nav" : ""
          }`}
        >
          <div className="max-w-[1200px] mx-auto px-6 md:px-12 h-16 flex items-center justify-between">
            <Logo />

            {/* Desktop Nav Links */}
            <div className="hidden lg:flex items-center gap-8">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={(e) => handleLinkClick(e, link.href)}
                  className="relative text-sm font-medium text-[#9AA8A8] hover:text-[#F5F7F7] transition-colors duration-200 group"
                >
                  {link.label}
                  <span className="absolute -bottom-1 left-0 w-0 h-[1.5px] bg-[#00D9C0] transition-all duration-200 group-hover:w-full" />
                </a>
              ))}
            </div>

            {/* Desktop CTAs */}
            <div className="hidden lg:flex items-center gap-4">
              <a
                href="/p/entrar"
                className="text-sm font-medium text-[#9AA8A8] hover:text-[#F5F7F7] transition-colors duration-200"
              >
                Sou paciente
              </a>
              <a
                href="/login"
                className="bg-[#00D9C0] text-[#0A0E0E] px-5 py-2 rounded-full text-sm font-semibold hover:brightness-110 transition-all duration-200 hover:shadow-glow"
              >
                Acesso médico
              </a>
            </div>

            {/* Mobile Menu Button */}
            <button
              className="lg:hidden text-[#F5F7F7] p-2"
              onClick={() => setIsMobileOpen(!isMobileOpen)}
              aria-label="Toggle menu"
            >
              {isMobileOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileOpen && (
          <div className="lg:hidden bg-[#0A0E0E]/95 backdrop-blur-nav border-b border-[#00D9C0]/10">
            <div className="px-6 py-6 flex flex-col gap-4">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={(e) => handleLinkClick(e, link.href)}
                  className="text-base font-medium text-[#9AA8A8] hover:text-[#F5F7F7] transition-colors py-2"
                >
                  {link.label}
                </a>
              ))}
              <div className="flex flex-col gap-3 pt-4 border-t border-[#00D9C0]/10">
                <a
                  href="/p/entrar"
                  className="text-base font-medium text-[#9AA8A8] hover:text-[#F5F7F7] transition-colors"
                >
                  Sou paciente
                </a>
                <a
                  href="/login"
                  className="bg-[#00D9C0] text-[#0A0E0E] px-5 py-3 rounded-xl text-base font-semibold text-center hover:brightness-110 transition-all"
                >
                  Acesso médico
                </a>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Static nav for initial view */}
      <div
        className={`fixed top-0 left-0 right-0 z-40 transition-opacity duration-400 ${
          isScrolled ? "opacity-0 pointer-events-none" : "opacity-100"
        }`}
      >
        <div className="max-w-[1200px] mx-auto px-6 md:px-12 h-16 flex items-center justify-between">
          <Logo />
          <div className="hidden lg:flex items-center gap-4">
            <a
              href="/privacidade"
              className="text-sm font-medium text-[#9AA8A8] hover:text-[#F5F7F7] transition-colors"
            >
              Privacidade
            </a>
            <a
              href="/p/entrar"
              className="text-sm font-medium text-[#9AA8A8] hover:text-[#F5F7F7] transition-colors"
            >
              Sou paciente
            </a>
            <a
              href="/login"
              className="bg-[#00D9C0] text-[#0A0E0E] px-5 py-2 rounded-full text-sm font-semibold hover:brightness-110 transition-all duration-200 hover:shadow-glow"
            >
              Acesso médico
            </a>
          </div>
          <button
            className="lg:hidden text-[#F5F7F7] p-2"
            onClick={() => setIsMobileOpen(!isMobileOpen)}
            aria-label="Toggle menu"
          >
            <Menu size={24} />
          </button>
        </div>
      </div>
    </>
  );
}
