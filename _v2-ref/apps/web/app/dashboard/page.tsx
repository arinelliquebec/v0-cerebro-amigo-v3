import { Suspense } from 'react'
import { fetchApi } from '@/lib/api'
import {
  Activity,
  MessageSquare,
  DollarSign,
  Bot,
  Users,
  TrendingUp,
} from 'lucide-react'

export const metadata = { title: 'Visão geral' }

type Metricas = {
  conversasHoje: number
  conversasMes: number
  custoLlmHoje: number
  custoLlmMes: number
  taxaAutonoma: number
  totalClientes: number
}

async function MetricasCards() {
  const data = await fetchApi<Metricas>('/api/v1/metricas')

  const stats = [
    {
      label: 'Conversas hoje',
      value: data.conversasHoje.toString(),
      sub: 'tempo real',
      icon: MessageSquare,
    },
    {
      label: 'Conversas no mês',
      value: data.conversasMes.toString(),
      sub: 'acumulado',
      icon: Activity,
    },
    {
      label: 'Custo LLM hoje',
      value: `US$ ${data.custoLlmHoje.toFixed(2)}`,
      sub: `mês: US$ ${data.custoLlmMes.toFixed(2)}`,
      icon: DollarSign,
    },
    {
      label: 'Taxa autônoma',
      value: `${data.taxaAutonoma}%`,
      sub: 'sem intervenção humana',
      icon: Bot,
      highlight: true,
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((s) => (
        <StatCard key={s.label} {...s} />
      ))}
    </div>
  )
}

function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  highlight,
}: {
  label: string
  value: string
  sub?: string
  icon: React.ElementType
  highlight?: boolean
}) {
  return (
    <div
      className="group relative overflow-hidden rounded-2xl bg-[#111818] border border-[#00D9C0]/[0.08] p-6 transition-all duration-300 hover:border-[#00D9C0]/25"
      style={{
        boxShadow: highlight
          ? '0 0 24px rgba(0, 217, 192, 0.08)'
          : undefined,
      }}
    >
      {/* Top accent line */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#00D9C0]/30 to-transparent" />

      <div className="flex items-start justify-between mb-4">
        <div
          className={`flex h-11 w-11 items-center justify-center rounded-xl border ${
            highlight
              ? 'bg-[#00D9C0]/15 border-[#00D9C0]/30'
              : 'bg-[#00D9C0]/10 border-[#00D9C0]/15'
          }`}
        >
          <Icon size={20} className="text-[#00D9C0]" />
        </div>
      </div>

      <div className="text-[13px] font-medium text-[#D0D5D5]/80 mb-2">
        {label}
      </div>
      <div className="text-[36px] font-bold tracking-tight text-[#F5F7F7] leading-none tabular-nums">
        {value}
      </div>
      {sub && (
        <div className="mt-3 text-[13px] text-[#9AA8A8]">{sub}</div>
      )}

      {/* Hover scan line */}
      <div
        aria-hidden
        className="absolute inset-x-6 -bottom-px h-px origin-left scale-x-0 bg-gradient-to-r from-[#00D9C0] via-[#00D9C0]/60 to-transparent transition-transform duration-700 group-hover:scale-x-100"
      />
    </div>
  )
}

function MetricasSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="h-[148px] rounded-2xl bg-[#111818] border border-[#00D9C0]/[0.05] animate-pulse"
        />
      ))}
    </div>
  )
}

export default function DashboardHome() {
  return (
    <div className="p-8 space-y-10 max-w-[1400px] mx-auto">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <span className="w-1.5 h-1.5 rounded-full bg-[#00D9C0]" />
          <span className="text-[13px] font-medium text-[#00D9C0]/70">
            Painel
          </span>
        </div>
        <h1 className="text-[32px] font-bold tracking-tight text-[#F5F7F7]">
          Visão <span className="text-[#00D9C0]">geral</span>
        </h1>
        <p className="mt-2 text-[15px] text-[#D0D5D5]/80 max-w-2xl">
          Métricas e indicadores do sistema em tempo real.
        </p>
      </div>

      {/* Métricas reais via API */}
      <Suspense fallback={<MetricasSkeleton />}>
        <MetricasCards />
      </Suspense>

      {/* Quick Stats Section */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp size={18} className="text-[#00D9C0]" />
          <h2 className="text-[20px] font-semibold tracking-tight text-[#F5F7F7]">
            Atividade do mês
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <QuickStatCard
            icon={MessageSquare}
            label="Mensagens processadas"
            trend="+12%"
            trendUp
          />
          <QuickStatCard
            icon={Bot}
            label="Respostas automáticas"
            trend="+8%"
            trendUp
          />
          <QuickStatCard
            icon={Users}
            label="Pacientes ativos"
            trend="+3%"
            trendUp
          />
        </div>
      </div>
    </div>
  )
}

function QuickStatCard({
  icon: Icon,
  label,
  trend,
  trendUp,
}: {
  icon: React.ElementType
  label: string
  trend: string
  trendUp: boolean
}) {
  return (
    <div className="group relative overflow-hidden rounded-2xl bg-[#111818] border border-[#00D9C0]/[0.08] p-5 transition-all duration-300 hover:border-[#00D9C0]/20">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#00D9C0]/20 to-transparent" />

      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#00D9C0]/10 border border-[#00D9C0]/15 shrink-0">
          <Icon size={20} className="text-[#00D9C0]" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[15px] text-[#F5F7F7] font-medium truncate">
            {label}
          </div>
          <div
            className={`text-[13px] ${
              trendUp ? 'text-emerald-400' : 'text-red-400'
            }`}
          >
            {trend} este mês
          </div>
        </div>
      </div>
    </div>
  )
}
