import { Suspense } from 'react'
import { ArrowUpRight } from 'lucide-react'
import { fetchPaciente } from '@/lib/api-paciente'
import { PageHeader } from '@/components/paciente/page-header'
import { PaperCard, PaperCardHeader } from '@/components/paciente/paper-card'

type Perfil = {
  id: string
  nome: string | null
  email: string | null
  waId: string
  dataNascimento: string | null
  consentimentoLgpdEm: string | null
  nomeMedico: string
  crmMedico: string
}

async function Conteudo() {
  const p = await fetchPaciente<Perfil>('/api/v1/portal/paciente/perfil')

  return (
    <div className="space-y-5 px-5 pb-6">
      <PaperCard>
        <PaperCardHeader numeral="01" eyebrow="Você" title="Identidade" />
        <div className="mt-4 divide-y divide-[#00D9C0]/[0.06] px-5 pb-5">
          <Field label="Nome" value={p.nome ?? '—'} />
          <Field label="WhatsApp" value={p.waId} tabular />
          <Field label="E-mail" value={p.email ?? '—'} />
          {p.dataNascimento && (
            <Field
              label="Nascimento"
              value={new Date(p.dataNascimento).toLocaleDateString('pt-BR')}
              tabular
            />
          )}
        </div>
      </PaperCard>

      <PaperCard>
        <PaperCardHeader numeral="02" eyebrow="Acompanhamento" title="Médico(a)" />
        <div className="mt-4 divide-y divide-[#00D9C0]/[0.06] px-5 pb-5">
          <Field label="Nome" value={p.nomeMedico} />
          <Field label="CRM" value={p.crmMedico} tabular />
        </div>
      </PaperCard>

      <PaperCard>
        <PaperCardHeader numeral="03" eyebrow="Seus dados" title="Privacidade" italic="& LGPD" />
        <div className="px-5 pb-5">
          {p.consentimentoLgpdEm && (
            <p className="mt-4 text-[15px] leading-relaxed text-[#D0D5D5]/80">
              Você aceitou os termos de privacidade em{' '}
              <span className="font-medium tabular-nums text-[#F5F7F7]">
                {new Date(p.consentimentoLgpdEm).toLocaleDateString('pt-BR')}
              </span>
              .
            </p>
          )}
          <div className="mt-5 space-y-2">
            <ExternalLink href="/privacidade">
              Ler política de privacidade
            </ExternalLink>
            <ExternalLink href="mailto:privacidade@seudominio.com.br">
              Solicitar exclusão dos meus dados (LGPD)
            </ExternalLink>
          </div>
        </div>
      </PaperCard>
    </div>
  )
}

function Field({
  label,
  value,
  tabular,
}: {
  label: string
  value: string
  tabular?: boolean
}) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-3 first:pt-0">
      <span className="text-[13px] font-medium text-[#9AA8A8]">
        {label}
      </span>
      <span className={`text-right text-[15px] text-[#F5F7F7] ${tabular ? 'tabular-nums' : ''}`}>
        {value}
      </span>
    </div>
  )
}

function ExternalLink({
  href,
  children,
}: {
  href: string
  children: React.ReactNode
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="group flex items-center justify-between rounded-xl border border-[#00D9C0]/[0.15] bg-[#0A0E0E] px-4 py-3 text-[14px] font-medium text-[#F5F7F7] transition-all duration-300 hover:border-[#00D9C0]/35 hover:bg-[#00D9C0]/[0.06]"
    >
      <span>{children}</span>
      <ArrowUpRight
        size={16}
        className="text-[#9AA8A8] transition-all duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-[#00D9C0]"
      />
    </a>
  )
}

function ConteudoSkeleton() {
  return (
    <div className="space-y-5 px-5 pb-6">
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-44 rounded-2xl bg-[#111818] border border-[#00D9C0]/[0.05] animate-pulse" />
      ))}
    </div>
  )
}

export default function PerfilPage() {
  return (
    <>
      <PageHeader eyebrow="Perfil" title="Sobre" italic="você" kicker="Suas informações no acompanhamento." />
      <Suspense fallback={<ConteudoSkeleton />}>
        <Conteudo />
      </Suspense>
    </>
  )
}
