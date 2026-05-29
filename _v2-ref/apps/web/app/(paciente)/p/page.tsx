import { Suspense } from 'react'
import Link from 'next/link'
import { Pill, BookOpen, ArrowUpRight, Smile, Sparkles } from 'lucide-react'
import { fetchPaciente } from '@/lib/api-paciente'
import { PushSubscribeBanner } from '@/components/PushSubscribeBanner'
import { PaperCard, PaperCardHeader } from '@/components/paciente/paper-card'
import { cn } from '@/lib/utils'

type Home = {
  perfil: { nome: string; nomeMedico: string }
  tomadasHoje: Array<{
    id: string
    horarioPrevisto: string
    status: string
    medicamento: string
    dose: string
  }>
  proxConsulta: { iniciaEm: string; modalidade: string; status: string } | null
  ultimoHumor: number | null
  jaRegistrouHumorHoje: boolean
}

function HojeFormatado() {
  const fmt = new Intl.DateTimeFormat('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
  })
  const d = fmt.format(new Date())
  return d.charAt(0).toUpperCase() + d.slice(1)
}

async function Conteudo() {
  const data = await fetchPaciente<Home>('/api/v1/portal/paciente/home')
  const primeiroNome = data.perfil.nome?.split(' ')[0] ?? ''

  return (
    <div className="space-y-6 px-5 pt-5">
      {/* ============================ HERO ============================ */}
      <section className="relative pt-2">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-[#00D9C0]" />
          <span className="text-[13px] font-medium text-[#00D9C0]/70">
            <HojeFormatado />
          </span>
        </div>

        <h1 className="mt-3 text-[2.5rem] font-bold leading-[1.05] tracking-tight text-[#F5F7F7]">
          Olá,<br />
          <span
            className="text-[#00D9C0]"
            style={{ textShadow: '0 0 30px rgba(0, 217, 192, 0.4)' }}
          >
            {primeiroNome}.
          </span>
        </h1>

        <p className="mt-3 text-[15px] leading-relaxed text-[#D0D5D5]/80">
          Cuidado de hoje, em uma só página. Acompanhamento clínico com{' '}
          <span className="font-medium text-[#F5F7F7]">{data.perfil.nomeMedico}</span>.
        </p>
      </section>

      <PushSubscribeBanner />

      {/* ====================== HUMOR — CTA HERO ====================== */}
      {!data.jaRegistrouHumorHoje && (
        <Link
          href="/p/humor"
          className="group relative block overflow-hidden rounded-2xl border border-[#00D9C0]/25 p-6 text-[#F5F7F7] transition-all duration-500 hover:-translate-y-1 hover:border-[#00D9C0]/40"
          style={{
            background: 'linear-gradient(135deg, #111818 0%, #0A0E0E 100%)',
            boxShadow: '0 0 40px rgba(0, 217, 192, 0.12), 0 4px 24px -4px rgba(0, 0, 0, 0.5)',
          }}
        >
          {/* Glow accents */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-90"
            style={{
              background: `
                radial-gradient(400px 250px at 90% 20%, rgba(0, 217, 192, 0.18), transparent 60%),
                radial-gradient(300px 200px at 10% 100%, rgba(168, 85, 247, 0.12), transparent 60%)
              `,
            }}
          />

          {/* Top accent line */}
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#00D9C0]/50 to-transparent" />

          <div className="relative flex items-start justify-between gap-4">
            <div className="max-w-[20rem]">
              <span className="text-[13px] font-medium text-[#00D9C0]">
                Check-in · ≈ 30s
              </span>
              <h2 className="mt-3 text-[28px] font-bold leading-tight tracking-tight text-[#F5F7F7]">
                Como você está{' '}
                <span className="text-[#00D9C0]">hoje</span>?
              </h2>
              <p className="mt-2 text-[15px] leading-relaxed text-[#D0D5D5]/80">
                Mover algumas barras é o suficiente. Sem julgamento.
              </p>
            </div>
            <span
              className="grid h-12 w-12 shrink-0 place-items-center rounded-xl border border-[#00D9C0]/30 bg-[#00D9C0]/10 text-[#00D9C0] transition-all duration-300 group-hover:border-[#00D9C0]/50 group-hover:bg-[#00D9C0]/20"
              style={{ boxShadow: '0 0 16px rgba(0, 217, 192, 0.15)' }}
            >
              <Smile size={22} strokeWidth={2} />
            </span>
          </div>
          <div className="relative mt-6 flex items-center gap-2 text-[14px] font-medium text-[#00D9C0]">
            <Sparkles size={14} />
            Registrar humor
            <ArrowUpRight
              size={16}
              className="transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
            />
          </div>
        </Link>
      )}

      {/* ===================== MEDICAÇÕES DE HOJE ===================== */}
      <PaperCard>
        <PaperCardHeader
          numeral="01"
          eyebrow="Medicações"
          title="Hoje"
          italic="lembretes"
        />
        <div className="mt-4 px-5 pb-5">
          {data.tomadasHoje.length === 0 ? (
            <p className="text-[15px] leading-relaxed text-[#D0D5D5]/80">
              Nada programado para hoje. Aproveite o respiro.
            </p>
          ) : (
            <ul className="divide-y divide-[#00D9C0]/[0.06]">
              {data.tomadasHoje.map((t) => {
                const horario = new Date(t.horarioPrevisto).toLocaleTimeString(
                  'pt-BR',
                  { hour: '2-digit', minute: '2-digit' },
                )
                return (
                  <li
                    key={t.id}
                    className="flex items-center justify-between gap-4 py-3"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <Pill size={16} strokeWidth={2} className="text-[#00D9C0]" />
                        <span className="text-[16px] font-semibold leading-tight text-[#F5F7F7]">
                          {t.medicamento}
                        </span>
                      </div>
                      <div className="ml-6 mt-0.5 text-[13px] text-[#9AA8A8]">{t.dose}</div>
                    </div>
                    <div className="shrink-0 text-right">
                      <div className="text-[15px] font-semibold tabular-nums text-[#D0D5D5]">
                        {horario}
                      </div>
                      <StatusBadge status={t.status} />
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </PaperCard>

      {/* =================== PRÓXIMA CONSULTA =================== */}
      {data.proxConsulta && (
        <PaperCard>
          <PaperCardHeader
            numeral="02"
            eyebrow="Agenda"
            title="Próxima"
            italic="consulta"
          />
          <div className="mx-5 mt-4 mb-5 border-l-2 border-[#00D9C0]/40 pl-5">
            <div className="text-[20px] font-semibold leading-tight tracking-tight text-[#F5F7F7]">
              {new Date(data.proxConsulta.iniciaEm).toLocaleDateString('pt-BR', {
                weekday: 'long',
                day: '2-digit',
                month: 'long',
              })}
            </div>
            <div className="mt-1.5 text-[15px] tabular-nums text-[#00D9C0]">
              {new Date(data.proxConsulta.iniciaEm).toLocaleTimeString('pt-BR', {
                hour: '2-digit',
                minute: '2-digit',
              })}
              {' '}·{' '}
              <span className="capitalize text-[#D0D5D5]">{data.proxConsulta.modalidade}</span>
            </div>
          </div>
        </PaperCard>
      )}

      {/* =================== ATALHO PARA DIÁRIO =================== */}
      <Link
        href="/p/diario/nova"
        className="group relative block overflow-hidden rounded-2xl border border-[#00D9C0]/[0.08] bg-[#111818] p-5 transition-all duration-500 hover:-translate-y-0.5 hover:border-[#00D9C0]/25"
        style={{ transition: 'all 0.5s' }}
      >
        <div className="flex items-start gap-4">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#00D9C0]/10 border border-[#00D9C0]/20 text-[#00D9C0]">
            <BookOpen size={20} strokeWidth={2} />
          </span>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00D9C0]" />
              <span className="text-[13px] font-medium text-[#00D9C0]/70">
                Diário
              </span>
            </div>
            <h3 className="mt-1.5 text-[20px] font-bold leading-tight tracking-tight text-[#F5F7F7]">
              Escrever uma <span className="text-[#00D9C0]">página</span>
            </h3>
            <p className="mt-1 text-[15px] leading-relaxed text-[#D0D5D5]/80">
              Pensamentos, eventos, qualquer coisa para guardar.
            </p>
          </div>
          <ArrowUpRight
            size={20}
            className="text-[#9AA8A8] transition-all duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-[#00D9C0]"
          />
        </div>
      </Link>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    pendente: {
      label: '· pendente',
      cls: 'bg-amber-500/10 text-amber-300 border-amber-500/25',
    },
    tomada: {
      label: '✓ tomada',
      cls: 'bg-[#00D9C0]/10 text-[#00D9C0] border-[#00D9C0]/25',
    },
    esquecida: {
      label: '· esquecida',
      cls: 'bg-[#0A0E0E] text-[#9AA8A8] border-white/10',
    },
    pulou: {
      label: '× pulada',
      cls: 'bg-red-500/10 text-red-300 border-red-500/25',
    },
  }
  const { label, cls } = map[status] ?? {
    label: status,
    cls: 'bg-[#0A0E0E] text-[#9AA8A8] border-white/10',
  }
  return (
    <span
      className={cn(
        'mt-1 inline-block rounded-md px-2 py-0.5 text-[12px] font-medium border',
        cls,
      )}
    >
      {label}
    </span>
  )
}

function ConteudoSkeleton() {
  return (
    <div className="space-y-6 px-5 pt-8">
      <div className="space-y-3">
        <div className="h-3 w-24 rounded bg-[#111818] animate-pulse" />
        <div className="h-12 w-48 rounded bg-[#111818] animate-pulse" />
        <div className="h-4 w-72 rounded bg-[#111818] animate-pulse" />
      </div>
      <div className="h-40 rounded-2xl bg-[#111818] border border-[#00D9C0]/[0.05] animate-pulse" />
      <div className="h-56 rounded-2xl bg-[#111818] border border-[#00D9C0]/[0.05] animate-pulse" />
      <div className="h-24 rounded-2xl bg-[#111818] border border-[#00D9C0]/[0.05] animate-pulse" />
    </div>
  )
}

export default function HomePaciente() {
  return (
    <Suspense fallback={<ConteudoSkeleton />}>
      <Conteudo />
    </Suspense>
  )
}
