import { Mail, Phone, FileText } from 'lucide-react'

type Paciente = {
  numero: number
  nome: string | null
  email: string | null
  waId: string | null
  cpf: string | null
  dataNascimento: string | null
}

function iniciais(nome: string | null): string {
  if (!nome) return '?'
  const parts = nome.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

function primeiroNome(nome: string): string {
  const parts = nome.trim().split(/\s+/)
  return parts[0] ?? nome
}

function restoDoNome(nome: string): string {
  const parts = nome.trim().split(/\s+/)
  return parts.slice(1).join(' ')
}

function formatarTelefone(raw: string): string {
  const d = raw.replace(/\D/g, '')
  if (d.length === 11) return `${d.slice(0, 2)} ${d.slice(2, 7)} ${d.slice(7)}`
  if (d.length === 10) return `${d.slice(0, 2)} ${d.slice(2, 6)} ${d.slice(6)}`
  return raw
}

function formatarCpf(raw: string): string {
  const d = raw.replace(/\D/g, '')
  if (d.length !== 11) return raw
  return d.slice(0, 3) + '.' + d.slice(3, 6) + '.' + d.slice(6, 9) + '-' + d.slice(9)
}

export function Hero({ paciente }: { paciente: Paciente }) {
  const numeroFmt = String(paciente.numero).padStart(2, '0')

  return (
    <header className="border-b border-[#00D9C0]/[0.08] pb-8">
      <div className="flex items-center gap-2 mb-4">
        <span className="w-1.5 h-1.5 rounded-full bg-[#00D9C0]" />
        <span className="text-[13px] font-medium text-[#00D9C0]/70">
          Paciente
        </span>
      </div>

      <div className="flex items-start gap-5">
        <div
          aria-hidden
          className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl border border-[#00D9C0]/30 bg-[#00D9C0]/10 text-[24px] font-bold tabular-nums text-[#00D9C0]"
          style={{ boxShadow: '0 0 24px rgba(0, 217, 192, 0.08)' }}
        >
          {iniciais(paciente.nome)}
        </div>

        <div className="min-w-0 flex-1">
          <div className="text-[13px] font-medium tabular-nums text-[#9AA8A8]">
            #{numeroFmt}
          </div>

          <h1 className="mt-1 text-[40px] sm:text-[48px] font-bold tracking-tight leading-[1.05] text-[#F5F7F7]">
            {paciente.nome ? (
              <>
                {primeiroNome(paciente.nome)}{' '}
                <span className="text-[#00D9C0]">
                  {restoDoNome(paciente.nome) || ''}
                </span>
              </>
            ) : (
              <span className="italic font-normal text-[#9AA8A8]">
                Sem nome cadastrado
              </span>
            )}
          </h1>

          <dl className="mt-5 flex flex-wrap gap-2">
            {paciente.email && (
              <Chip icon={<Mail size={13} strokeWidth={2} />} label="email">
                {paciente.email}
              </Chip>
            )}
            {paciente.waId && (
              <Chip icon={<Phone size={13} strokeWidth={2} />} label="whatsapp">
                <span className="tabular-nums">{formatarTelefone(paciente.waId)}</span>
              </Chip>
            )}
            {paciente.cpf && (
              <Chip icon={<FileText size={13} strokeWidth={2} />} label="cpf">
                <span className="tabular-nums">{formatarCpf(paciente.cpf)}</span>
              </Chip>
            )}
          </dl>
        </div>
      </div>
    </header>
  )
}

function Chip({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="inline-flex items-center gap-1.5 rounded-full border border-[#00D9C0]/[0.15] bg-[#111818] px-3 py-1.5 text-[13px] text-[#D0D5D5]">
      <span className="text-[#00D9C0]">{icon}</span>
      <dt className="sr-only">{label}</dt>
      <dd>{children}</dd>
    </div>
  )
}
