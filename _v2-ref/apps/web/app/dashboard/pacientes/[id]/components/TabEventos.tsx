import { AlertTriangle, Activity, Pill, MessageSquare, Calendar } from 'lucide-react'
import { fetchApi } from '@/lib/api'
import { cn } from '@/lib/utils'

type TimelineItem = {
  tipo: 'mensagem' | 'sintoma' | 'evento' | 'crise' | 'tomada'
  quando: string
  titulo: string
  descricao: string
  intensidade: number | null
  origem: 'patient' | 'system' | 'critical'
}

export async function TabEventos({ id }: { id: string }) {
  const itens = await fetchApi<TimelineItem[]>(
    '/api/v1/pacientes/' + id + '/timeline?dias=30',
  )

  if (itens.length === 0) {
    return (
      <section className="rounded-2xl border border-[#00D9C0]/[0.08] bg-[#111818] p-12 text-center">
        <Calendar size={32} className="mx-auto text-[#00D9C0]/60" />
        <p className="mt-5 text-[18px] font-semibold text-[#F5F7F7]">
          Sem atividade nos últimos 30 dias
        </p>
        <p className="mt-2 text-[14px] text-[#9AA8A8]">
          Quando houver mensagens, sintomas ou eventos clínicos, aparecem aqui.
        </p>
      </section>
    )
  }

  return (
    <div className="space-y-4">
      <header className="flex items-end justify-between">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-[#00D9C0]" />
          <h2 className="text-[13px] font-medium text-[#00D9C0]/70">
            Histórico clínico · últimos 30 dias
          </h2>
        </div>
        <span className="text-[13px] text-[#9AA8A8]">
          {itens.length} {itens.length === 1 ? 'evento' : 'eventos'}
        </span>
      </header>

      <div className="space-y-3">
        {itens.map((item, i) => (
          <TimelineRow key={i} item={item} />
        ))}
      </div>
    </div>
  )
}

function TimelineRow({ item }: { item: TimelineItem }) {
  const isCrise = item.origem === 'critical'
  const isPatient = item.origem === 'patient'

  const icon = isCrise ? (
    <AlertTriangle size={16} strokeWidth={2} className="text-red-400" />
  ) : item.tipo === 'sintoma' ? (
    <Activity size={16} strokeWidth={2} className="text-[#00D9C0]" />
  ) : item.tipo === 'tomada' ? (
    <Pill size={16} strokeWidth={2} className="text-emerald-400" />
  ) : item.tipo === 'mensagem' ? (
    <MessageSquare
      size={16}
      strokeWidth={2}
      className={isPatient ? 'text-[#9AA8A8]' : 'text-[#00D9C0]'}
    />
  ) : (
    <Calendar size={16} strokeWidth={2} className="text-[#9AA8A8]" />
  )

  return (
    <article
      className={cn(
        'flex gap-3 rounded-xl border p-4 transition-colors',
        isCrise
          ? 'border-red-500/30 bg-red-500/10'
          : isPatient
            ? 'border-white/[0.05] bg-[#0A0E0E]/60'
            : 'border-[#00D9C0]/[0.08] bg-[#111818]',
      )}
    >
      <div className="mt-0.5 shrink-0">{icon}</div>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <h3
            className={cn(
              'text-[15px] font-semibold',
              isCrise ? 'text-red-100' : 'text-[#F5F7F7]',
            )}
          >
            {item.titulo}
          </h3>
          <time className="shrink-0 text-[13px] tabular-nums text-[#9AA8A8]">
            {new Date(item.quando).toLocaleString('pt-BR', {
              day: '2-digit',
              month: 'short',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </time>
        </div>
        {item.descricao && (
          <p
            className={cn(
              'mt-1.5 whitespace-pre-wrap text-[14px] leading-relaxed',
              isCrise ? 'text-red-200/90' : 'text-[#D0D5D5]',
            )}
          >
            {item.descricao}
          </p>
        )}
        {item.intensidade != null && (
          <div className="mt-2.5">
            <span
              className={cn(
                'inline-flex items-center rounded-md px-2.5 py-1 text-[12px] font-medium tabular-nums',
                item.intensidade >= 7
                  ? 'bg-red-500/15 text-red-300 border border-red-500/25'
                  : item.intensidade >= 4
                    ? 'bg-amber-500/15 text-amber-300 border border-amber-500/25'
                    : 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/25',
              )}
            >
              Intensidade {item.intensidade}/10
            </span>
          </div>
        )}
      </div>
    </article>
  )
}
