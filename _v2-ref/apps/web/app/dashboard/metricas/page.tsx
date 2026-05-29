import { Suspense } from 'react'
import { fetchApi } from '@/lib/api'
import { MessageSquare, DollarSign, Users, TrendingUp, Activity } from 'lucide-react'

export const metadata = { title: 'Métricas' }

type Metricas = {
  conversasHoje: number
  conversasMes: number
  custoLlmHoje: number
  custoLlmMes: number
  taxaAutonoma: number
  totalClientes: number
}

function StatCard({
  label,
  value,
  sub,
  icon: Icon,
}: {
  label: string
  value: string
  sub?: string
  icon: React.ElementType
}) {
  return (
    <div className="group relative overflow-hidden rounded-2xl bg-[#111818] border border-[#00D9C0]/[0.08] p-6 transition-all duration-300 hover:border-[#00D9C0]/25">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#00D9C0]/30 to-transparent" />
      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#00D9C0]/10 border border-[#00D9C0]/15 mb-4">
        <Icon size={20} className="text-[#00D9C0]" />
      </div>
      <div className="text-[13px] font-medium text-[#D0D5D5]/80 mb-2">{label}</div>
      <div className="text-[32px] font-bold tracking-tight text-[#F5F7F7] leading-none tabular-nums">{value}</div>
      {sub && <div className="mt-2 text-[13px] text-[#9AA8A8]">{sub}</div>}
    </div>
  )
}

async function MetricasGrid() {
  const data = await fetchApi<Metricas>('/api/v1/metricas')

  return (
    <div className="space-y-8">
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Activity size={18} className="text-[#00D9C0]" />
          <h2 className="text-[20px] font-semibold tracking-tight text-[#F5F7F7]">Hoje</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard icon={MessageSquare} label="Conversas" value={data.conversasHoje.toString()} sub="tempo real" />
          <StatCard icon={DollarSign} label="Custo LLM" value={`US$ ${data.custoLlmHoje.toFixed(2)}`} sub="hoje" />
          <StatCard icon={Users} label="Total de clientes" value={data.totalClientes.toString()} sub="cadastrados" />
        </div>
      </section>

      <section>
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp size={18} className="text-[#00D9C0]" />
          <h2 className="text-[20px] font-semibold tracking-tight text-[#F5F7F7]">Este mês</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard icon={MessageSquare} label="Conversas" value={data.conversasMes.toString()} sub="acumulado" />
          <StatCard icon={DollarSign} label="Custo LLM total" value={`US$ ${data.custoLlmMes.toFixed(2)}`} sub="acumulado" />
          <StatCard icon={TrendingUp} label="Taxa autônoma" value={`${data.taxaAutonoma}%`} sub="resolvido sem humano" />
        </div>
      </section>
    </div>
  )
}

function GridSkeleton() {
  return (
    <div className="space-y-8">
      {[1, 2].map((i) => (
        <div key={i} className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((j) => (
            <div key={j} className="h-[148px] rounded-2xl bg-[#111818] border border-[#00D9C0]/[0.05] animate-pulse" />
          ))}
        </div>
      ))}
    </div>
  )
}

export default function MetricasPage() {
  return (
    <div className="mx-auto max-w-[1400px] space-y-8 px-8 py-10">
      <div>
        <div className="flex items-center gap-2 mb-3">
          <span className="w-1.5 h-1.5 rounded-full bg-[#00D9C0]" />
          <span className="text-[13px] font-medium text-[#00D9C0]/70">Dados do sistema</span>
        </div>
        <h1 className="text-[32px] font-bold tracking-tight text-[#F5F7F7]">
          <span className="text-[#00D9C0]">Métricas</span>
        </h1>
        <p className="mt-2 max-w-2xl text-[15px] text-[#D0D5D5]/80">
          Volumes de conversas, custos de LLM e taxa de resolução autônoma.
        </p>
      </div>

      <Suspense fallback={<GridSkeleton />}>
        <MetricasGrid />
      </Suspense>
    </div>
  )
}
