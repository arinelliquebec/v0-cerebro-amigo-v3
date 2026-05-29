import Link from "next/link"
import Image from "next/image"
import { Logo } from "@/components/logo"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
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
  Activity,
  ClipboardList,
  ShieldCheck,
  Sparkles,
  Clock,
  HeartHandshake,
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

const followUpFeatures = [
  {
    icon: Smile,
    title: "Check-ins de Humor",
    description: "Pacientes registram como estão se sentindo diariamente, criando um panorama emocional completo entre as sessões.",
  },
  {
    icon: Activity,
    title: "Monitoramento Contínuo",
    description: "Acompanhe tendências, padrões e sinais de alerta antes mesmo da próxima consulta presencial.",
  },
  {
    icon: Bell,
    title: "Lembretes Inteligentes",
    description: "Medicações, exercícios terapêuticos e tarefas personalizadas com notificações automáticas.",
  },
  {
    icon: ClipboardList,
    title: "Tarefas Terapêuticas",
    description: "Prescreva atividades entre consultas e acompanhe a adesão do paciente em tempo real.",
  },
  {
    icon: MessageSquare,
    title: "Canal Seguro",
    description: "Comunicação criptografada para dúvidas urgentes, sem expor dados em apps pessoais.",
  },
  {
    icon: TrendingUp,
    title: "Relatórios de Evolução",
    description: "Visualize o progresso do paciente com gráficos claros e insights acionáveis.",
  },
]

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
        <div className="container mx-auto px-6 lg:px-8 h-18 flex items-center justify-between">
          <Logo size="md" />
          <nav className="hidden md:flex items-center gap-10">
            <Link 
              href="#acompanhamento" 
              className="text-[15px] font-medium text-muted-foreground hover:text-[#0D9488] transition-colors tracking-tight"
            >
              Acompanhamento
            </Link>
            <Link 
              href="#features" 
              className="text-[15px] font-medium text-muted-foreground hover:text-[#0D9488] transition-colors tracking-tight"
            >
              Recursos
            </Link>
            <Link 
              href="#benefits" 
              className="text-[15px] font-medium text-muted-foreground hover:text-[#0D9488] transition-colors tracking-tight"
            >
              Benefícios
            </Link>
          </nav>
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              className="text-[#0F2137] hover:text-[#0D9488] font-medium tracking-tight" 
              asChild
            >
              <Link href="/login">Entrar</Link>
            </Button>
            <Button 
              className="bg-[#E57373] hover:bg-[#EF5350] text-white font-medium tracking-tight" 
              asChild
            >
              <Link href="/dashboard">
                Começar agora
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-16 pb-24 lg:pt-24 lg:pb-32">
        {/* Background decorative elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 right-[10%] w-96 h-96 bg-[#0D9488]/8 rounded-full blur-3xl" />
          <div className="absolute bottom-10 left-[5%] w-64 h-64 bg-[#E57373]/8 rounded-full blur-3xl" />
        </div>
        
        <div className="container mx-auto px-6 lg:px-8 relative">
          <div className="grid lg:grid-cols-2 gap-16 lg:gap-20 items-center">
            <div className="space-y-10">
              <div className="space-y-6">
                <h1 className="text-balance">
                  <span className="block text-5xl lg:text-7xl font-serif italic font-semibold text-[#0F2137] tracking-tight leading-none">
                    Cérebro
                  </span>
                  <span className="block text-5xl lg:text-7xl font-serif font-bold text-[#0D9488] tracking-tight leading-none mt-1">
                    Amigo
                  </span>
                </h1>
                <p className="text-xl lg:text-2xl text-[#0F2137] font-medium leading-snug tracking-tight">
                  O CRM que trabalha<br />
                  <span className="text-[#0D9488]">entre consultas</span>
                </p>
              </div>

              <div className="flex items-start gap-4 bg-[#F0F9F8] p-5 rounded-2xl border border-[#0D9488]/10">
                <div className="h-12 w-12 rounded-xl bg-white flex items-center justify-center flex-shrink-0 shadow-sm">
                  <Heart className="h-6 w-6 text-[#E57373]" />
                </div>
                <p className="text-[#0F2137]/80 leading-relaxed text-[15px]">
                  Acompanhe pacientes, organize condutas e fortaleça a continuidade do cuidado com mais eficiência e acolhimento.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  size="lg"
                  className="bg-[#E57373] hover:bg-[#EF5350] text-white text-base font-semibold px-8 h-14 rounded-xl shadow-lg shadow-[#E57373]/20 tracking-tight"
                  asChild
                >
                  <Link href="/dashboard">
                    Conheça uma nova forma de cuidar
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
              </div>
            </div>

            {/* Hero Image / Dashboard Preview */}
            <div className="relative lg:pl-8">
              <div className="relative z-10">
                <Image
                  src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/ChatGPT%20Image%2028%20de%20mai.%20de%202025%2C%2013_50_06-CKGJmYNSj9QuNoePU4CaJqqpOcf5q7.png"
                  alt="Cérebro Amigo Dashboard"
                  width={720}
                  height={540}
                  priority
                  unoptimized
                  className="rounded-2xl shadow-2xl w-full h-auto"
                />
              </div>
              {/* Decorative blur elements matching the image */}
              <div className="absolute -top-6 -right-6 w-80 h-80 bg-[#0D9488]/12 rounded-full blur-3xl -z-10" />
              <div className="absolute -bottom-6 -left-6 w-56 h-56 bg-[#E57373]/12 rounded-full blur-3xl -z-10" />
            </div>
          </div>
        </div>
      </section>

      {/* Acompanhamento entre Consultas - SEÇÃO DESTAQUE */}
      <section id="acompanhamento" className="py-24 lg:py-32 relative overflow-hidden">
        {/* Background with gradient and blur effects like hero */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#F0F9F8] via-[#F8FAFB] to-background" />
        <div className="absolute top-0 left-[20%] w-96 h-96 bg-[#0D9488]/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-[10%] w-72 h-72 bg-[#E57373]/8 rounded-full blur-3xl" />
        
        <div className="container mx-auto px-6 lg:px-8 relative">
          {/* Section Header */}
          <div className="max-w-3xl mx-auto text-center mb-16 lg:mb-20">
            <div className="inline-flex items-center gap-2 bg-[#0D9488]/10 text-[#0D9488] px-4 py-2 rounded-full mb-6">
              <Sparkles className="h-4 w-4" />
              <span className="text-sm font-semibold tracking-tight">Diferencial Principal</span>
            </div>
            <h2 className="text-3xl lg:text-5xl font-bold text-[#0F2137] mb-6 text-balance tracking-tight leading-tight">
              Acompanhamento<br />
              <span className="text-[#0D9488]">entre Consultas</span>
            </h2>
            <p className="text-muted-foreground text-lg lg:text-xl leading-relaxed max-w-2xl mx-auto">
              O cuidado não pode parar quando a consulta termina. Mantenha-se presente na jornada do paciente com ferramentas que fortalecem o vínculo terapêutico.
            </p>
          </div>

          {/* Main Feature Showcase */}
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center mb-20">
            {/* Image with hero-style treatment */}
            <div className="relative order-2 lg:order-1">
              <div className="relative z-10 bg-white rounded-2xl p-6 shadow-xl border border-[#E2E8F0]">
                <div className="aspect-[4/3] bg-gradient-to-br from-[#F0F9F8] to-[#E0F2F1] rounded-xl flex items-center justify-center overflow-hidden">
                  <Image
                    src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/ChatGPT%20Image%2028%20de%20mai.%20de%202025%2C%2013_50_06-CKGJmYNSj9QuNoePU4CaJqqpOcf5q7.png"
                    alt="Acompanhamento entre consultas"
                    width={640}
                    height={480}
                    unoptimized
                    className="w-full h-full object-cover rounded-xl opacity-90"
                  />
                </div>
                {/* Floating stats cards */}
                <div className="absolute -top-4 -right-4 bg-white rounded-xl p-4 shadow-lg border border-[#E2E8F0] z-20">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-[#F0F9F8] flex items-center justify-center">
                      <Activity className="h-5 w-5 text-[#0D9488]" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground font-medium">Check-ins</p>
                      <p className="text-lg font-bold text-[#0F2137] tracking-tight">+89%</p>
                    </div>
                  </div>
                </div>
                <div className="absolute -bottom-4 -left-4 bg-white rounded-xl p-4 shadow-lg border border-[#E2E8F0] z-20">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-[#FEF2F2] flex items-center justify-center">
                      <HeartHandshake className="h-5 w-5 text-[#E57373]" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground font-medium">Engajamento</p>
                      <p className="text-lg font-bold text-[#0F2137] tracking-tight">+95%</p>
                    </div>
                  </div>
                </div>
              </div>
              {/* Decorative blur elements */}
              <div className="absolute -top-8 -left-8 w-48 h-48 bg-[#0D9488]/15 rounded-full blur-3xl -z-10" />
              <div className="absolute -bottom-8 -right-8 w-40 h-40 bg-[#E57373]/15 rounded-full blur-3xl -z-10" />
            </div>

            {/* Content */}
            <div className="space-y-8 order-1 lg:order-2">
              <div className="space-y-4">
                <h3 className="text-2xl lg:text-3xl font-bold text-[#0F2137] tracking-tight leading-tight">
                  Cuidado que vai além do consultório
                </h3>
                <p className="text-muted-foreground text-lg leading-relaxed">
                  Entre uma consulta e outra, muito acontece na vida do paciente. Com o Cérebro Amigo, você acompanha cada passo dessa jornada.
                </p>
              </div>
              
              <div className="space-y-4">
                {[
                  { icon: Clock, text: "Acompanhamento diário sem aumentar sua carga de trabalho" },
                  { icon: Activity, text: "Identifique padrões e tendências antes da próxima sessão" },
                  { icon: HeartHandshake, text: "Fortaleça o vínculo terapêutico com presença constante" },
                ].map((item, index) => (
                  <div key={index} className="flex items-center gap-4 bg-white p-4 rounded-xl border border-[#E2E8F0] shadow-sm">
                    <div className="h-11 w-11 rounded-xl bg-[#F0F9F8] flex items-center justify-center flex-shrink-0">
                      <item.icon className="h-5 w-5 text-[#0D9488]" />
                    </div>
                    <p className="text-[#0F2137] font-medium text-[15px] leading-snug">{item.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Feature Cards Grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {followUpFeatures.map((feature, index) => (
              <Card 
                key={feature.title} 
                className="border-[#E2E8F0] bg-white hover:border-[#0D9488]/30 transition-all duration-300 hover:shadow-lg group"
              >
                <CardContent className="p-6 space-y-4">
                  <div className="relative">
                    <div className="h-14 w-14 rounded-2xl bg-[#F0F9F8] flex items-center justify-center group-hover:bg-[#0D9488]/10 transition-colors">
                      <feature.icon className="h-7 w-7 text-[#0D9488]" />
                    </div>
                    {/* Decorative blur on hover - same treatment as hero */}
                    <div className="absolute -top-2 -right-2 w-8 h-8 bg-[#0D9488]/20 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-lg font-semibold text-[#0F2137] tracking-tight">
                      {feature.title}
                    </h4>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 lg:py-24 bg-background">
        <div className="container mx-auto px-6 lg:px-8">
          <div className="max-w-2xl mx-auto text-center mb-12">
            <h2 className="text-2xl lg:text-3xl font-bold text-[#0F2137] mb-4 tracking-tight">
              Tudo em um só lugar
            </h2>
            <p className="text-muted-foreground text-base lg:text-lg">
              Recursos integrados para uma gestão clínica completa
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 lg:gap-6">
            {features.map((feature) => (
              <Card 
                key={feature.title} 
                className="border-[#E2E8F0] bg-white hover:border-[#0D9488]/30 transition-all duration-300 hover:shadow-md group"
              >
                <CardContent className="p-5 lg:p-6 text-center space-y-4">
                  <div className="relative mx-auto w-fit">
                    <div className="h-14 w-14 rounded-2xl bg-[#F0F9F8] flex items-center justify-center group-hover:bg-[#0D9488]/10 transition-colors">
                      <feature.icon className="h-6 w-6 text-[#0D9488]" />
                    </div>
                    {/* Hero-style decorative blur */}
                    <div className="absolute -top-1 -right-1 w-6 h-6 bg-[#0D9488]/20 rounded-full blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <h3 className="text-sm font-semibold text-[#0F2137] leading-tight tracking-tight">
                    {feature.title}
                  </h3>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section id="benefits" className="py-20 lg:py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-background to-[#F8FAFB]" />
        <div className="absolute bottom-0 left-[30%] w-80 h-80 bg-[#0D9488]/8 rounded-full blur-3xl" />
        
        <div className="container mx-auto px-6 lg:px-8 relative">
          <div className="max-w-3xl mx-auto text-center mb-14 lg:mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-[#0F2137] mb-5 text-balance tracking-tight">
              Tudo que você precisa para um cuidado{" "}
              <span className="text-[#0D9488]">humanizado</span>
            </h2>
            <p className="text-muted-foreground text-lg leading-relaxed">
              Ferramentas pensadas para facilitar o seu dia a dia e melhorar a experiência dos seus pacientes.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
            <Card className="border-[#E2E8F0] bg-white hover:border-[#0D9488]/30 transition-all duration-300 hover:shadow-lg group">
              <CardContent className="p-7 lg:p-8 space-y-5">
                <div className="relative">
                  <div className="h-16 w-16 rounded-2xl bg-[#F0F9F8] flex items-center justify-center group-hover:bg-[#0D9488]/10 transition-colors">
                    <Calendar className="h-8 w-8 text-[#0D9488]" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-10 h-10 bg-[#0D9488]/20 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <div className="space-y-3">
                  <h3 className="text-xl font-bold text-[#0F2137] tracking-tight">
                    Agenda Inteligente
                  </h3>
                  <p className="text-muted-foreground leading-relaxed text-[15px]">
                    Gerencie consultas, retornos e lembretes de forma prática. Nunca mais perca um compromisso importante.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-[#E2E8F0] bg-white hover:border-[#0D9488]/30 transition-all duration-300 hover:shadow-lg group">
              <CardContent className="p-7 lg:p-8 space-y-5">
                <div className="relative">
                  <div className="h-16 w-16 rounded-2xl bg-[#F0F9F8] flex items-center justify-center group-hover:bg-[#0D9488]/10 transition-colors">
                    <Smile className="h-8 w-8 text-[#0D9488]" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-10 h-10 bg-[#0D9488]/20 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <div className="space-y-3">
                  <h3 className="text-xl font-bold text-[#0F2137] tracking-tight">
                    Check-in de Humor
                  </h3>
                  <p className="text-muted-foreground leading-relaxed text-[15px]">
                    Acompanhe como seus pacientes estão se sentindo entre as consultas com check-ins simples e eficazes.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-[#E2E8F0] bg-white hover:border-[#0D9488]/30 transition-all duration-300 hover:shadow-lg group">
              <CardContent className="p-7 lg:p-8 space-y-5">
                <div className="relative">
                  <div className="h-16 w-16 rounded-2xl bg-[#F0F9F8] flex items-center justify-center group-hover:bg-[#0D9488]/10 transition-colors">
                    <Bell className="h-8 w-8 text-[#0D9488]" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-10 h-10 bg-[#0D9488]/20 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <div className="space-y-3">
                  <h3 className="text-xl font-bold text-[#0F2137] tracking-tight">
                    Lembretes Automáticos
                  </h3>
                  <p className="text-muted-foreground leading-relaxed text-[15px]">
                    Configure lembretes personalizados para medicações, tarefas terapêuticas e muito mais.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 lg:py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-[#0F2137]" />
        <div className="absolute top-0 right-[20%] w-96 h-96 bg-[#0D9488]/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-[10%] w-72 h-72 bg-[#E57373]/15 rounded-full blur-3xl" />
        
        <div className="container mx-auto px-6 lg:px-8 relative">
          <div className="max-w-3xl mx-auto text-center space-y-8">
            <h2 className="text-3xl lg:text-5xl font-bold text-white tracking-tight text-balance leading-tight">
              Comece a cuidar de forma{" "}
              <span className="text-[#0D9488]">diferente</span>
            </h2>
            <p className="text-white/70 text-lg lg:text-xl leading-relaxed max-w-2xl mx-auto">
              Transforme a forma como você acompanha seus pacientes. Experimente o Cérebro Amigo e descubra o poder do cuidado contínuo.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Button
                size="lg"
                className="bg-[#E57373] hover:bg-[#EF5350] text-white text-base font-semibold px-8 h-14 rounded-xl shadow-lg shadow-[#E57373]/30 tracking-tight w-full sm:w-auto"
                asChild
              >
                <Link href="/dashboard">
                  Começar gratuitamente
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-white/30 text-white hover:bg-white/10 text-base font-semibold px-8 h-14 rounded-xl tracking-tight w-full sm:w-auto"
                asChild
              >
                <Link href="#acompanhamento">
                  Saiba mais
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* LGPD Compliance */}
      <section className="py-6 border-t border-border bg-background">
        <div className="container mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-center gap-3 text-muted-foreground">
            <ShieldCheck className="h-5 w-5 text-[#10B981]" />
            <span className="text-sm font-medium tracking-tight">
              Segurança, privacidade e conformidade com a LGPD
            </span>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 lg:py-16 bg-[#0F2137] text-white">
        <div className="container mx-auto px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <Logo size="md" variant="light" />
            <p className="text-sm text-white/60 tracking-tight">
              © 2026 Cérebro Amigo. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
