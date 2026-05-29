import { Suspense } from 'react'
import { fetchApi } from '@/lib/api'
import { NotificacoesClient, type Notificacao } from './NotificacoesClient'

export const metadata = { title: 'Notificações' }

async function Lista() {
  const [naoLidas, lidas] = await Promise.all([
    fetchApi<Notificacao[]>('/api/v1/notificacoes?apenasNaoLidas=true').catch(() => []),
    fetchApi<Notificacao[]>('/api/v1/notificacoes?apenasNaoLidas=false&apenasLidas=true').catch(() => []),
  ])
  return <NotificacoesClient naoLidas={naoLidas} lidas={lidas} />
}

function ListaSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="h-16 rounded-xl bg-[#111818] border border-[#00D9C0]/[0.05] animate-pulse"
        />
      ))}
    </div>
  )
}

export default function NotificacoesPage() {
  return (
    <div className="mx-auto max-w-[1400px] space-y-8 px-8 py-10">
      <header className="border-b border-[#00D9C0]/[0.08] pb-8">
        <div className="flex items-center gap-2 mb-3">
          <span className="w-1.5 h-1.5 rounded-full bg-[#00D9C0]" />
          <span className="text-[13px] font-medium text-[#00D9C0]/70">
            Pendências
          </span>
        </div>
        <h1 className="text-[32px] font-bold tracking-tight text-[#F5F7F7]">
          <span className="text-[#00D9C0]">Notificações</span>
        </h1>
        <p className="mt-2 max-w-2xl text-[15px] text-[#D0D5D5]/80">
          Avisos do agente clínico. Crises sempre no topo. Marque como lida quando der retorno ao paciente.
        </p>
      </header>

      <Suspense fallback={<ListaSkeleton />}>
        <Lista />
      </Suspense>
    </div>
  )
}
