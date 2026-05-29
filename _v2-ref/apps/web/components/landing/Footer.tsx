'use client'

import { Logo } from "@/components/landing/Logo";

export function Footer() {
  return (
    <footer className="w-full bg-[#0A0E0E] border-t border-[#00D9C0]/[0.08]">
      <div className="max-w-[1200px] mx-auto px-6 md:px-12 py-12">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Left */}
          <div className="flex flex-col items-center md:items-start gap-2">
            <Logo />
            <span className="text-xs text-[#9AA8A8]/70">
              Cuidado psiquiátrico contínuo · CNPJ 65.703.101/0001-74
            </span>
          </div>

          {/* Right */}
          <div className="flex flex-col items-center md:items-end gap-4">
            <div className="flex items-center gap-6">
              <a
                href="/privacidade"
                className="text-sm text-[#9AA8A8] hover:text-[#00D9C0] transition-colors duration-200"
              >
                Privacidade
              </a>
              <a
                href="/p/entrar"
                className="text-sm text-[#9AA8A8] hover:text-[#00D9C0] transition-colors duration-200"
              >
                Portal do paciente
              </a>
              <a
                href="/login"
                className="text-sm text-[#9AA8A8] hover:text-[#00D9C0] transition-colors duration-200"
              >
                Acesso médico
              </a>
            </div>
            <span className="text-xs text-[#9AA8A8]/50">© 2026</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
