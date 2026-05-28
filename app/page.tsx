import Link from "next/link"
import { Logo } from "@/components/logo"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Shield,
  FileText,
  TrendingUp,
  MessageSquare,
  Heart,
  Users,
  CheckCircle,
  ArrowRight,
  Calendar,
  Bell,
  Smile,
} from "lucide-react"

const features = [
  {
    icon: FileText,
    title: "Prontuário completo e seguro",
  },
  {
    icon: Users,
    title: "Histórico clínico organizado",
  },
  {
    icon: TrendingUp,
    title: "Acompanhamento de evolução",
  },
  {
    icon: MessageSquare,
    title: "Comunicação segura",
  },
  {
    icon: Heart,
    title: "Cuidado contínuo e humanizado",
  },
]

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Logo size="md" />
          <nav className="hidden md:flex items-center gap-8">
            <Link href="#features" className="text-sm font-medium text-muted-foreground hover:text-[#0D9488] transition-colors">
              Recursos
            </Link>
            <Link href="#benefits" className="text-sm font-medium text-muted-foreground hover:text-[#0D9488] transition-colors">
              Benefícios
            </Link>
            <Link href="#about" className="text-sm font-medium text-muted-foreground hover:text-[#0D9488] transition-colors">
              Sobre
            </Link>
          </nav>
          <div className="flex items-center gap-3">
            <Button variant="ghost" className="text-[#0F2137] hover:text-[#0D9488]" asChild>
              <Link href="/login">Entrar</Link>
            </Button>
            <Button className="bg-[#E57373] hover:bg-[#EF5350] text-white" asChild>
              <Link href="/dashboard">
                Começar agora
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 lg:py-32">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="space-y-4">
                <h1 className="text-balance">
                  <span className="block text-5xl lg:text-6xl font-serif italic font-semibold text-[#0F2137]">
                    Cérebro
                  </span>
                  <span className="block text-5xl lg:text-6xl font-sans font-semibold text-[#0D9488]">
                    Amigo
                  </span>
                </h1>
                <p className="text-xl lg:text-2xl text-[#0F2137] font-medium">
                  O CRM que trabalha<br />entre consultas
                </p>
              </div>

              <div className="flex items-start gap-3">
                <Heart className="h-6 w-6 text-[#E57373] mt-1 flex-shrink-0" />
                <p className="text-muted-foreground leading-relaxed max-w-md">
                  Acompanhe pacientes, organize condutas e fortaleça a continuidade do cuidado com mais eficiência e acolhimento.
                </p>
              </div>

              <Button
                size="lg"
                className="bg-[#E57373] hover:bg-[#EF5350] text-white text-lg px-8 py-6 rounded-xl shadow-lg shadow-[#E57373]/25"
                asChild
              >
                <Link href="/dashboard">
                  Conheça uma nova forma de cuidar
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </div>

            {/* Hero Image / Dashboard Preview */}
            <div className="relative">
              <div className="relative z-10">
                <img
                  src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/ChatGPT%20Image%2028%20de%20mai.%20de%202026%2C%2013_50_06-CKGJmYNSj9QuNoePU4CaJqqpOcf5q7.png"
                  alt="Cérebro Amigo Dashboard"
                  className="rounded-2xl shadow-2xl"
                  crossOrigin="anonymous"
                />
              </div>
              {/* Decorative elements */}
              <div className="absolute -top-4 -right-4 w-72 h-72 bg-[#0D9488]/10 rounded-full blur-3xl" />
              <div className="absolute -bottom-4 -left-4 w-48 h-48 bg-[#E57373]/10 rounded-full blur-2xl" />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
            {features.map((feature) => (
              <Card key={feature.title} className="border-0 bg-card shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-6 text-center space-y-3">
                  <div className="h-12 w-12 mx-auto rounded-xl bg-[#F0F9F8] flex items-center justify-center">
                    <feature.icon className="h-6 w-6 text-[#0D9488]" />
                  </div>
                  <h3 className="text-sm font-medium text-[#0F2137] leading-tight">
                    {feature.title}
                  </h3>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section id="benefits" className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-semibold text-[#0F2137] mb-4 text-balance">
              Tudo que você precisa para um cuidado <span className="text-[#0D9488]">humanizado</span>
            </h2>
            <p className="text-muted-foreground text-lg">
              Ferramentas pensadas para facilitar o seu dia a dia e melhorar a experiência dos seus pacientes.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="border-border/50 hover:border-[#0D9488]/50 transition-colors">
              <CardContent className="p-8 space-y-4">
                <div className="h-14 w-14 rounded-2xl bg-[#F0F9F8] flex items-center justify-center">
                  <Calendar className="h-7 w-7 text-[#0D9488]" />
                </div>
                <h3 className="text-xl font-semibold text-[#0F2137]">
                  Agenda Inteligente
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  Gerencie consultas, retornos e lembretes de forma prática. Nunca mais perca um compromisso importante.
                </p>
              </CardContent>
            </Card>

            <Card className="border-border/50 hover:border-[#0D9488]/50 transition-colors">
              <CardContent className="p-8 space-y-4">
                <div className="h-14 w-14 rounded-2xl bg-[#F0F9F8] flex items-center justify-center">
                  <Smile className="h-7 w-7 text-[#0D9488]" />
                </div>
                <h3 className="text-xl font-semibold text-[#0F2137]">
                  Check-in de Humor
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  Acompanhe como seus pacientes estão se sentindo entre as consultas com check-ins simples e eficazes.
                </p>
              </CardContent>
            </Card>

            <Card className="border-border/50 hover:border-[#0D9488]/50 transition-colors">
              <CardContent className="p-8 space-y-4">
                <div className="h-14 w-14 rounded-2xl bg-[#F0F9F8] flex items-center justify-center">
                  <Bell className="h-7 w-7 text-[#0D9488]" />
                </div>
                <h3 className="text-xl font-semibold text-[#0F2137]">
                  Lembretes Automáticos
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  Configure lembretes personalizados para medicações, tarefas terapêuticas e muito mais.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* LGPD Compliance */}
      <section className="py-8 border-t border-border">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center gap-3 text-muted-foreground">
            <CheckCircle className="h-5 w-5 text-[#10B981]" />
            <span className="text-sm font-medium">
              Segurança, privacidade e conformidade com a LGPD
            </span>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-[#0F2137] text-white">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <Logo size="md" variant="light" />
            <p className="text-sm text-white/60">
              © 2026 Cérebro Amigo. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
