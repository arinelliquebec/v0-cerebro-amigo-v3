import Link from 'next/link'
import { Suspense } from 'react'
import { fetchApi } from '@/lib/api'
import { MessageSquare } from 'lucide-react'

export const metadata = { title: 'Conversas' }

type ConversaItem = {
  id: string
  status: string
  intencao: string | null
  criadaEm: string
  cliente: { id: string; nome: string | null; waId: string }
}

type Page = {
  total: number
  page: number
  pageSize: number
  items: ConversaItem[]
}

async function Lista({ page }: { page: number }) {
  const data = await fetchApi<Page>(`/api/v1/conversas?page=${page}&pageSize=20`)

  if (data.items.length === 0) {
    return (
      <div className="rounded-2xl border border-[#00D9C0]/[0.08] bg-[#111818] p-12 text-center">
        <MessageSquare size={32} className="mx-auto mb-4 text-[#00D9C0]/60" />
        <p className="text-[18px] font-semibold text-[#F5F7F7]">
          Nenhuma conversa ainda
        </p>
        <p className="mt-2 text-[15px] text-[#D0D5D5]/80">
          As conversas aparecem aqui assim que entrarem no sistema.
        </p>
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-[#00D9C0]/[0.08] bg-[#111818]">
      <table className="w-full">
        <thead className="border-b border-[#00D9C0]/[0.08] bg-[#0A0E0E]/40">
          <tr>
            <th className="text-left px-5 py-4 text-[13px] font-semibold text-[#9AA8A8]">Cliente</th>
            <th className="text-left px-5 py-4 text-[13px] font-semibold text-[#9AA8A8]">Intenção</th>
            <th className="text-left px-5 py-4 text-[13px] font-semibold text-[#9AA8A8]">Status</th>
            <th className="text-left px-5 py-4 text-[13px] font-semibold text-[#9AA8A8]">Data</th>
          </tr>
        </thead>
        <tbody>
          {data.items.map(c => (
            <tr key={c.id} className="group border-b border-[#00D9C0]/[0.05] transition-colors last:border-0 hover:bg-[#00D9C0]/[0.04]">
              <td className="px-5 py-4">
                <Link href={`/dashboard/conversas/${c.id}`} className="text-[15px] font-medium text-[#F5F7F7] hover:text-[#00D9C0] transition-colors">
                  {c.cliente.nome ?? c.cliente.waId}
                </Link>
              </td>
              <td className="px-5 py-4 text-[14px] text-[#D0D5D5]">{c.intencao ?? '—'}</td>
              <td className="px-5 py-4">
                <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[12px] font-medium ${
                  c.status === 'aberta'
                    ? 'border-emerald-500/30 bg-emerald-500/15 text-emerald-300'
                    : 'border-[#00D9C0]/[0.15] bg-[#0A0E0E] text-[#9AA8A8]'
                }`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${c.status === 'aberta' ? 'bg-emerald-400' : 'bg-[#9AA8A8]'}`} />
                  {c.status}
                </span>
              </td>
              <td className="px-5 py-4 text-[13px] tabular-nums text-[#9AA8A8]">
                {new Date(c.criadaEm).toLocaleDateString('pt-BR')}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default async function ConversasPage({
  searchParams,
}: { searchParams: Promise<{ page?: string }> }) {
  const sp = await searchParams
  const page = Number(sp.page ?? '1')

  return (
    <div className="mx-auto max-w-[1400px] space-y-8 px-8 py-10">
      <div>
        <div className="flex items-center gap-2 mb-3">
          <span className="w-1.5 h-1.5 rounded-full bg-[#00D9C0]" />
          <span className="text-[13px] font-medium text-[#00D9C0]/70">Histórico</span>
        </div>
        <h1 className="text-[32px] font-bold tracking-tight text-[#F5F7F7]">
          <span className="text-[#00D9C0]">Conversas</span>
        </h1>
        <p className="mt-2 max-w-2xl text-[15px] text-[#D0D5D5]/80">
          Mensagens trocadas com os agentes de IA. Clique para ver o detalhe completo.
        </p>
      </div>

      <Suspense fallback={
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-14 rounded-xl bg-[#111818] border border-[#00D9C0]/[0.05] animate-pulse" />
          ))}
        </div>
      }>
        <Lista page={page} />
      </Suspense>
    </div>
  )
}
