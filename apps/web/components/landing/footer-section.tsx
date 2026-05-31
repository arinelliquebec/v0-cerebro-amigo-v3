'use cache'

import { cacheLife } from 'next/cache'
import Link from "next/link"
import { Logo } from "@/components/logo"

export async function FooterSection() {
  cacheLife('days')

  return (
    <footer className="py-12 bg-navy-light border-t border-white/5">
      <div className="container mx-auto max-w-7xl px-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
          <div>
            <Logo size="md" variant="light" />
            <p className="text-white/35 text-sm mt-2.5 max-w-xs leading-relaxed">
              Acompanhamento entre consultas para psiquiatria e saúde mental.
            </p>
          </div>
          <div className="flex flex-col items-start md:items-end gap-2.5">
            <p className="text-white/35 text-sm">
              © 2026 Cérebro Amigo. Todos os direitos reservados.
            </p>
            <div className="flex items-center gap-5">
              <Link
                href="#"
                className="text-white/35 hover:text-white/65 text-xs transition-colors"
              >
                Privacidade
              </Link>
              <Link
                href="#"
                className="text-white/35 hover:text-white/65 text-xs transition-colors"
              >
                Termos de uso
              </Link>
              <Link
                href="/login"
                className="text-white/35 hover:text-white/65 text-xs transition-colors"
              >
                Entrar
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
