import { fetchApi } from '@/lib/api'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'

type Detalhe = {
  conversa: {
    id: string
    status: string
    intencao: string | null
    criadaEm: string
  }
  cliente: {
    id: string
    nome: string | null
    waId: string
    email: string | null
  }
  mensagens: Array<{
    id: string
    papel: 'user' | 'assistant' | 'system'
    conteudo: string
    modeloUsado: string | null
    tokensIn: number | null
    tokensOut: number | null
    custoUsd: number | null
    criadaEm: string
  }>
}

export default async function ConversaDetalhe({
  params,
}: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const data = await fetchApi<Detalhe>(`/api/v1/conversas/${id}`)

  return (
    <div className="mx-auto max-w-[1100px] space-y-6 px-8 py-10">
      <Link
        href="/dashboard/conversas"
        className="inline-flex items-center gap-1.5 text-[13px] font-medium text-[#9AA8A8] transition-colors hover:text-[#00D9C0]"
      >
        <ChevronLeft size={16} strokeWidth={2} /> Voltar
      </Link>

      <header className="border-b border-[#00D9C0]/[0.08] pb-6">
        <div className="flex items-center gap-2 mb-3">
          <span className="w-1.5 h-1.5 rounded-full bg-[#00D9C0]" />
          <span className="text-[13px] font-medium text-[#00D9C0]/70">Conversa</span>
        </div>
        <h1 className="text-[28px] font-bold tracking-tight text-[#F5F7F7]">
          {data.cliente.nome ?? data.cliente.waId}
        </h1>
        <p className="mt-2 text-[14px] text-[#9AA8A8]">
          <span className="tabular-nums">{data.cliente.waId}</span> · iniciada em{' '}
          <span className="tabular-nums">
            {new Date(data.conversa.criadaEm).toLocaleString('pt-BR')}
          </span>
        </p>
      </header>

      <div className="space-y-3">
        {data.mensagens.map(m => (
          <div
            key={m.id}
            className={`rounded-xl px-4 py-3 max-w-[80%] ${
              m.papel === 'user'
                ? 'bg-[#111818] border border-[#00D9C0]/[0.08] mr-auto'
                : 'bg-[#00D9C0]/8 border border-[#00D9C0]/25 ml-auto'
            }`}
          >
            <div className="text-[14px] leading-relaxed whitespace-pre-wrap text-[#F5F7F7]">
              {m.conteudo}
            </div>
            <div className="mt-2 flex flex-wrap gap-2 text-[12px] text-[#9AA8A8]">
              <span className="tabular-nums">{new Date(m.criadaEm).toLocaleString('pt-BR')}</span>
              {m.modeloUsado && (
                <>
                  <span>·</span>
                  <span className="font-medium text-[#00D9C0]">{m.modeloUsado}</span>
                </>
              )}
              {m.custoUsd != null && (
                <>
                  <span>·</span>
                  <span className="tabular-nums">US$ {m.custoUsd.toFixed(4)}</span>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
