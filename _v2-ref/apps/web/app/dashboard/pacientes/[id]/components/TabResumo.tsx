import Link from 'next/link'
import { AlertTriangle, Calendar, FileText, Pill } from 'lucide-react'
import { fetchApi } from '@/lib/api'
import { ResumoPreConsultaSection } from './ResumoPreConsultaSection'

type Paciente = {
  numero: number
  nome: string | null
  cpf: string | null
  dataNascimento: string | null
  consentimentoLgpdEm: string | null
  prescricoesAtivas: number
}

type TimelineItem = {
  origem: 'patient' | 'system' | 'critical'
}

type ResumoDto = {
  id: string
  titulo: string
  conteudo: string
  severidade: string
  criadoEm: string
  validoAte: string | null
  qualidadeDados: string | null
  periodoDias: number | null
}

function calcIdade(dn: string): number {
  const nasc = new Date(dn)
  const hoje = new Date()
  let idade = hoje.getFullYear() - nasc.getFullYear()
  const mes = hoje.getMonth() - nasc.getMonth()
  if (mes < 0 || (mes === 0 && hoje.getDate() < nasc.getDate())) {
    idade--
  }
  return idade
}

export async function TabResumo({
  paciente,
  id,
}: {
  paciente: Paciente
  id: string
}) {
  const [timeline24h, resumoResp] = await Promise.all([
    fetchApi<TimelineItem[]>('/api/v1/pacientes/' + id + '/timeline?dias=1'),
    fetchApi<{ ultimo: ResumoDto | null }>(
      '/api/v1/pacientes/' + id + '/resumo-pre-consulta',
    ).catch(() => ({ ultimo: null })),
  ])

  const crises24h = timeline24h.filter((t) => t.origem === 'critical')
  const idade = paciente.dataNascimento ? calcIdade(paciente.dataNascimento) : null

  return (
    <div className="space-y-6">
      {crises24h.length > 0 && (
        <section className="rounded-2xl border border-red-500/30 bg-red-500/10 p-5">
          <div className="flex items-start gap-3">
            <AlertTriangle size={20} className="mt-0.5 shrink-0 text-red-400" />
            <div className="flex-1">
              <h2 className="text-[18px] font-semibold text-red-100">
                {crises24h.length === 1
                  ? '1 protocolo de crise nas últimas 24h'
                  : crises24h.length + ' protocolos de crise nas últimas 24h'}
              </h2>
              <p className="mt-1.5 text-[14px] text-red-200/90">
                Revise na aba <span className="font-medium text-red-100">Eventos</span> e tome ações conforme protocolo.
              </p>
            </div>
          </div>
        </section>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          icon={<Pill size={18} strokeWidth={2} />}
          label="Prescrições ativas"
          value={String(paciente.prescricoesAtivas)}
        />
        {idade !== null && (
          <StatCard
            icon={<Calendar size={18} strokeWidth={2} />}
            label="Idade"
            value={idade + ' anos'}
          />
        )}
        {paciente.consentimentoLgpdEm && (
          <StatCard
            icon={<FileText size={18} strokeWidth={2} />}
            label="LGPD"
            value={new Date(paciente.consentimentoLgpdEm).toLocaleDateString('pt-BR')}
            subtle
          />
        )}
      </div>

      <section className="rounded-2xl border border-[#00D9C0]/[0.08] bg-[#111818] p-6">
        <div className="flex items-center gap-2 mb-5">
          <span className="w-1.5 h-1.5 rounded-full bg-[#00D9C0]" />
          <h2 className="text-[13px] font-medium text-[#00D9C0]/70">Dados pessoais</h2>
        </div>
        <dl className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <Field label="Nome completo" value={paciente.nome ?? '—'} />
          <Field
            label="Data de nascimento"
            value={
              paciente.dataNascimento
                ? new Date(paciente.dataNascimento).toLocaleDateString('pt-BR')
                : '—'
            }
            tabular
          />
          <Field
            label="Consentimento LGPD"
            value={
              paciente.consentimentoLgpdEm
                ? new Date(paciente.consentimentoLgpdEm).toLocaleDateString('pt-BR')
                : 'Pendente'
            }
            warn={!paciente.consentimentoLgpdEm}
          />
        </dl>
      </section>

      <ResumoPreConsultaSection pacienteId={id} resumoInicial={resumoResp.ultimo} />
    </div>
  )
}

function StatCard({
  icon,
  label,
  value,
  subtle = false,
}: {
  icon: React.ReactNode
  label: string
  value: string
  subtle?: boolean
}) {
  return (
    <div className="rounded-2xl border border-[#00D9C0]/[0.08] bg-[#111818] p-5">
      <div className="flex items-center gap-2 text-[13px] font-medium text-[#9AA8A8]">
        <span className="text-[#00D9C0]">{icon}</span>
        {label}
      </div>
      <div
        className={
          'mt-3 text-[28px] font-bold tracking-tight tabular-nums ' +
          (subtle ? 'text-[#D0D5D5]' : 'text-[#F5F7F7]')
        }
      >
        {value}
      </div>
    </div>
  )
}

function Field({
  label,
  value,
  tabular = false,
  warn = false,
}: {
  label: string
  value: string
  tabular?: boolean
  warn?: boolean
}) {
  return (
    <div>
      <dt className="text-[13px] font-medium text-[#9AA8A8]">
        {label}
      </dt>
      <dd
        className={
          'mt-1.5 text-[15px] ' +
          (tabular ? 'tabular-nums ' : '') +
          (warn ? 'text-amber-300 font-medium' : 'text-[#F5F7F7]')
        }
      >
        {value}
      </dd>
    </div>
  )
}
