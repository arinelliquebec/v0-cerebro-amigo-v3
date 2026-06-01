'use cache'

import { cacheLife } from 'next/cache'
import Link from "next/link"
import { Logo } from "@/components/logo"

export async function FooterSection() {
  cacheLife('days')

  return (
    <footer className="bg-navy-light border-t border-white/5">
      <div className="container mx-auto max-w-7xl px-6 py-14">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-10">
          <div>
            <Logo size="md" variant="light" />
            <p className="text-white/30 text-sm mt-3 max-w-xs leading-relaxed">
              Acompanhamento entre consultas para psiquiatria e saúde mental.
            </p>
          </div>
          <div className="flex flex-col items-start md:items-end gap-4">
            <div className="flex items-center gap-6">
              <Link
                href="/privacy"
                className="text-white/30 hover:text-white/70 text-sm transition-colors duration-200"
              >
                Privacidade
              </Link>
              <Link
                href="/terms"
                className="text-white/30 hover:text-white/70 text-sm transition-colors duration-200"
              >
                Termos de uso
              </Link>
              <Link
                href="/login"
                className="text-white/30 hover:text-white/70 text-sm transition-colors duration-200"
              >
                Entrar
              </Link>
            </div>
            <p className="text-white/20 text-xs">
              © 2026 Cérebro Amigo. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}
