'use client'

import {
  ExternalLink,
  Pill,
  Stethoscope,
  AlertCircle,
  FileText,
} from 'lucide-react'
import type { Medicamento } from '@/lib/catalogo-medicamentos'

type Props = {
  med: Medicamento
  compact?: boolean
}

function urlAnvisa(nome: string): string {
  const termo = nome.split(/\s+\d/)[0].trim() || nome
  return `https://consultas.anvisa.gov.br/#/bulario/q/?nomeProduto=${encodeURIComponent(termo)}`
}

export function MedicamentoDetalheCard({ med, compact }: Props) {
  const termoBusca = med.principioAtivo ?? med.nome
  const anvisaHref = urlAnvisa(termoBusca)

  if (compact) {
    return (
      <a href={anvisaHref} target="_blank" rel="noopener noreferrer" title={`Ver bula oficial de ${termoBusca} no portal Anvisa`} className="inline-flex items-center gap-1.5 rounded-md border border-[#00D9C0]/30 bg-[#00D9C0]/10 px-2.5 py-1 text-[11px] font-medium text-[#00D9C0] transition-colors hover:border-[#00D9C0]/40 hover:bg-[#00D9C0]/20">
        <ExternalLink size={11} strokeWidth={2} />
        Bula Anvisa
      </a>
    )
  }

  return (
    <section className="rounded-xl border border-[#00D9C0]/15 bg-[#111818]/60 p-4">
      <header className="mb-3 flex items-center gap-2 border-b border-[#00D9C0]/10 pb-3">
        <Pill size={14} className="text-[#00D9C0]" strokeWidth={1.5} />
        <h3 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#9AA8A8]">
          Informação clínica
        </h3>
      </header>

      <div className="space-y-3 text-sm text-[#F5F7F7]">
        <div>
          <p className="font-medium text-[#F5F7F7]">{med.nome}</p>
          {med.principioAtivo && (
            <p className="mt-0.5 text-xs text-[#9AA8A8]">
              Princípio ativo: <span className="text-[#F5F7F7]">{med.principioAtivo}</span>
            </p>
          )}
        </div>

        {med.indicacoes && (
          <div className="flex items-start gap-2 rounded-lg bg-[#00D9C0]/10 p-2.5">
            <Stethoscope size={14} className="mt-0.5 shrink-0 text-[#00D9C0]" strokeWidth={1.5} />
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#00D9C0]">
                Indicações principais
              </p>
              <p className="mt-1 text-xs leading-relaxed text-[#F5F7F7]">
                {med.indicacoes}
              </p>
            </div>
          </div>
        )}

        {med.apresentacoes.length > 0 && (
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#9AA8A8]">
              Apresentações
            </p>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {med.apresentacoes.map((apr) => (
                <span key={apr} className="inline-flex items-center rounded-md border border-[#00D9C0]/15 bg-[#111818]/40 px-2 py-0.5 text-[10px] text-[#F5F7F7]">
                  {apr}
                </span>
              ))}
            </div>
          </div>
        )}

        {med.avisos && med.avisos.length > 0 && (
          <div className="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-2.5">
            <AlertCircle size={14} className="mt-0.5 shrink-0 text-amber-300" strokeWidth={1.5} />
            <div className="min-w-0 space-y-0.5">
              {med.avisos.map((aviso, i) => (
                <p key={i} className="text-xs leading-relaxed text-amber-200">
                  {aviso}
                </p>
              ))}
            </div>
          </div>
        )}

        <div className="border-t border-[#00D9C0]/10 pt-3">
          <a href={anvisaHref} target="_blank" rel="noopener noreferrer" className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-[#00D9C0]/40 bg-[#00D9C0]/10 px-3 py-2 text-xs font-medium text-[#00D9C0] transition-all hover:border-[#00D9C0]/40 hover:bg-[#00D9C0]/20">
            <FileText size={13} strokeWidth={1.5} />
            Consultar bula oficial (Anvisa)
            <ExternalLink size={11} strokeWidth={2} className="opacity-60" />
          </a>
          <p className="mt-1.5 text-center text-[10px] text-[#9AA8A8]">
            Abre o Bulário Eletrônico em nova aba
          </p>
        </div>
      </div>
    </section>
  )
}

export function BotaoBulaAnvisa({ nomeMedicamento }: { nomeMedicamento: string }) {
  const href = urlAnvisa(nomeMedicamento)
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" title={`Buscar bula de ${nomeMedicamento} no portal Anvisa`} className="inline-flex items-center gap-1.5 rounded-md border border-[#00D9C0]/30 bg-[#00D9C0]/10 px-2 py-1 text-[10px] font-medium text-[#00D9C0] transition-colors hover:border-[#00D9C0]/40 hover:bg-[#00D9C0]/20">
      <ExternalLink size={10} strokeWidth={2} />
      Bula Anvisa
    </a>
  )
}
