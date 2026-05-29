'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { MessageCircle, Search, X, ArrowUpDown } from 'lucide-react'

export type PacienteRow = {
  numero: number
  id: string
  waId: string | null
  nome: string | null
  email: string | null
  cpf: string | null
  prescricoesAtivas: number
  ultimaMsg: string | null
}

type Ordem = 'alfabetica' | 'numero' | 'recente'

const ORDEM_LABELS: Record<Ordem, string> = {
  alfabetica: 'A → Z',
  numero: 'Cadastro',
  recente: 'Recentes',
}

export function PacientesListClient({ pacientes }: { pacientes: PacienteRow[] }) {
  const [busca, setBusca] = useState('')
  const [ordem, setOrdem] = useState<Ordem>('alfabetica')

  const filtrados = useMemo(() => {
    const q = busca.trim().toLowerCase()
    let arr = pacientes
    if (q) {
      arr = arr.filter((p) => {
        const nome = (p.nome ?? '').toLowerCase()
        const email = (p.email ?? '').toLowerCase()
        const cpf = (p.cpf ?? '').replace(/\D/g, '')
        const wa = (p.waId ?? '').replace(/\D/g, '')
        const qd = q.replace(/\D/g, '')
        return (
          nome.includes(q) ||
          email.includes(q) ||
          (qd.length >= 3 && (cpf.includes(qd) || wa.includes(qd)))
        )
      })
    }
    const sorted = [...arr]
    if (ordem === 'alfabetica') {
      sorted.sort((a, b) => {
        const an = (a.nome ?? '').toLocaleLowerCase('pt-BR')
        const bn = (b.nome ?? '').toLocaleLowerCase('pt-BR')
        if (!an && !bn) return 0
        if (!an) return 1
        if (!bn) return -1
        return an.localeCompare(bn, 'pt-BR')
      })
    } else if (ordem === 'numero') {
      sorted.sort((a, b) => a.numero - b.numero)
    } else {
      sorted.sort((a, b) => {
        const at = a.ultimaMsg ? new Date(a.ultimaMsg).getTime() : 0
        const bt = b.ultimaMsg ? new Date(b.ultimaMsg).getTime() : 0
        return bt - at
      })
    }
    return sorted
  }, [pacientes, busca, ordem])

  function cicloOrdem() {
    setOrdem((o) =>
      o === 'alfabetica' ? 'numero' : o === 'numero' ? 'recente' : 'alfabetica',
    )
  }

  if (pacientes.length === 0) {
    return (
      <div className="rounded-2xl border border-[#00D9C0]/[0.08] bg-[#111818] p-12 text-center">
        <p className="text-[18px] font-medium text-[#F5F7F7]">
          Nenhum paciente ainda
        </p>
        <p className="mt-2 text-[15px] text-[#D0D5D5]/80">
          Cadastre o primeiro pelo botão acima.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Toolbar: busca + ordenação */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search
            size={16}
            strokeWidth={2}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9AA8A8]"
          />
          <input
            type="search"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Busca por nome, email, CPF, WhatsApp…"
            className="w-full rounded-xl border border-[#00D9C0]/[0.12] bg-[#111818] py-2.5 pl-11 pr-9 text-[15px] text-[#F5F7F7] outline-none transition-all placeholder:text-[#9AA8A8]/60 focus:border-[#00D9C0]/40 focus:shadow-[0_0_0_4px_rgba(0,217,192,0.08)]"
          />
          {busca && (
            <button
              type="button"
              onClick={() => setBusca('')}
              aria-label="Limpar busca"
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-[#9AA8A8] transition-colors hover:bg-[#00D9C0]/10 hover:text-[#F5F7F7]"
            >
              <X size={14} />
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={cicloOrdem}
          className="inline-flex items-center gap-2 self-start rounded-xl border border-[#00D9C0]/[0.15] bg-[#111818] px-4 py-2.5 text-[13px] font-medium text-[#D0D5D5] transition-all hover:border-[#00D9C0]/30 hover:bg-[#00D9C0]/8 hover:text-[#00D9C0]"
        >
          <ArrowUpDown size={14} strokeWidth={2} />
          Ordenar: {ORDEM_LABELS[ordem]}
        </button>
      </div>

      {/* Contador */}
      <p className="text-[13px] text-[#9AA8A8]">
        {filtrados.length} de {pacientes.length} {pacientes.length === 1 ? 'paciente' : 'pacientes'}
      </p>

      {/* Tabela */}
      <div className="overflow-hidden rounded-2xl border border-[#00D9C0]/[0.08] bg-[#111818]">
        {filtrados.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-[18px] font-medium text-[#F5F7F7]">
              Nenhum paciente combina com sua busca
            </p>
            <p className="mt-2 text-[15px] text-[#D0D5D5]/80">
              Tente outras palavras ou{' '}
              <button
                type="button"
                onClick={() => setBusca('')}
                className="text-[#00D9C0] underline hover:text-[#00D9C0]/80"
              >
                limpar
              </button>
              .
            </p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="border-b border-[#00D9C0]/[0.08] bg-[#0A0E0E]/40">
              <tr>
                <th scope="col" className="w-16 px-5 py-4 text-left text-[13px] font-semibold text-[#9AA8A8]">
                  Nº
                </th>
                <th scope="col" className="px-5 py-4 text-left text-[13px] font-semibold text-[#9AA8A8]">
                  Paciente
                </th>
                <th scope="col" className="px-5 py-4 text-left text-[13px] font-semibold text-[#9AA8A8]">
                  WhatsApp
                </th>
                <th scope="col" className="w-36 px-5 py-4 text-left text-[13px] font-semibold text-[#9AA8A8]">
                  Prescrições
                </th>
                <th scope="col" className="px-5 py-4 text-left text-[13px] font-semibold text-[#9AA8A8]">
                  Última atividade
                </th>
              </tr>
            </thead>
            <tbody>
              {filtrados.map((p) => (
                <tr
                  key={p.id}
                  className="group border-b border-[#00D9C0]/[0.05] transition-colors last:border-0 hover:bg-[#00D9C0]/[0.04]"
                >
                  <td className="px-5 py-4 align-middle">
                    <span className="text-[16px] font-medium tabular-nums text-[#D0D5D5] transition-colors group-hover:text-[#00D9C0]">
                      {String(p.numero).padStart(2, '0')}
                    </span>
                  </td>
                  <td className="px-5 py-4 align-middle">
                    <Link
                      href={`/dashboard/pacientes/${p.id}`}
                      className="inline-block text-[16px] font-semibold tracking-tight text-[#F5F7F7] transition-colors hover:text-[#00D9C0]"
                    >
                      {p.nome ?? (
                        <span className="italic font-normal text-[#9AA8A8]">
                          sem nome
                        </span>
                      )}
                    </Link>
                    {p.email && (
                      <p className="mt-0.5 text-[13px] text-[#9AA8A8]">
                        {p.email}
                      </p>
                    )}
                  </td>
                  <td className="px-5 py-4 align-middle text-[14px] tabular-nums text-[#D0D5D5]">
                    {formatarTelefone(p.waId)}
                  </td>
                  <td className="px-5 py-4 align-middle">
                    <PrescricoesBadge n={p.prescricoesAtivas} />
                  </td>
                  <td className="px-5 py-4 align-middle text-[13px] text-[#9AA8A8]">
                    {p.ultimaMsg ? (
                      <span className="inline-flex items-center gap-1.5">
                        <MessageCircle
                          size={13}
                          strokeWidth={2}
                          className="text-[#00D9C0]/70 transition-colors group-hover:text-[#00D9C0]"
                        />
                        {new Date(p.ultimaMsg).toLocaleString('pt-BR', {
                          day: '2-digit',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    ) : (
                      <span>—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

function PrescricoesBadge({ n }: { n: number }) {
  if (n === 0) {
    return (
      <span className="text-[13px] text-[#9AA8A8]">
        Nenhuma
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-[#00D9C0]/30 bg-[#00D9C0]/10 px-2.5 py-1 text-[13px] font-medium tabular-nums text-[#00D9C0]">
      <span className="h-1.5 w-1.5 rounded-full bg-[#00D9C0]" aria-hidden />
      {n} ativa{n === 1 ? '' : 's'}
    </span>
  )
}

function formatarTelefone(raw: string | null): string {
  if (!raw) return '—'
  const d = raw.replace(/\D/g, '')
  if (d.length === 11) return `${d.slice(0, 2)} ${d.slice(2, 7)} ${d.slice(7)}`
  if (d.length === 10) return `${d.slice(0, 2)} ${d.slice(2, 6)} ${d.slice(6)}`
  return raw
}
