import Link from "next/link"
import { Logo } from "@/components/logo"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"

export async function NavHeader() {
  return (
    <header className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
      <div className="container mx-auto max-w-7xl px-6 h-16 flex items-center justify-between">
        <Logo size="md" />
        <nav className="hidden md:flex items-center gap-8">
          <Link
            href="#como-funciona"
            className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
          >
            Como funciona
          </Link>
          <Link
            href="#recursos"
            className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
          >
            Recursos
          </Link>
          <Link
            href="#seguranca"
            className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
          >
            Segurança
          </Link>
        </nav>
        <div className="flex items-center gap-3">
          <Button variant="ghost" className="text-navy hover:text-primary" asChild>
            <Link href="/login">Entrar</Link>
          </Button>
          <Button className="bg-coral hover:bg-coral-dark text-white" asChild>
            <Link href="/dashboard">
              Ver demonstração
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </header>
  )
}
