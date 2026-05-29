import { fetchApi } from '@/lib/api'
import { GraficoHumor } from './GraficoHumor'

type PontoHumor = {
  data: string
  humor: number | null
  ansiedade: number | null
}

export async function TabAcompanhamento({ id }: { id: string }) {
  const dados = await fetchApi<PontoHumor[]>(
    '/api/v1/pacientes/' + id + '/humor?dias=30',
  )

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-[#00D9C0]/[0.08] bg-[#111818] p-6">
        <header className="mb-6 flex items-end justify-between">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00D9C0]" />
            <h2 className="text-[13px] font-medium text-[#00D9C0]/70">
              Humor &amp; ansiedade · últimos 30 dias
            </h2>
          </div>
          <span className="text-[13px] text-[#9AA8A8]">
            {dados.length} {dados.length === 1 ? 'registro' : 'registros'}
          </span>
        </header>

        {dados.length === 0 ? (
          <p className="text-[15px] text-[#D0D5D5]/80">
            Sem registros de humor nos últimos 30 dias.
          </p>
        ) : (
          <>
            <GraficoHumor dados={dados} />
            <div className="mt-5 flex gap-6 text-[13px]">
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-[#00D9C0]" />
                <span className="text-[#D0D5D5]">Humor</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
                <span className="text-[#D0D5D5]">Ansiedade</span>
              </span>
            </div>
          </>
        )}
      </section>

      <section className="rounded-2xl border border-[#00D9C0]/[0.08] bg-[#111818] p-6">
        <div className="flex items-center gap-2 mb-3">
          <span className="w-1.5 h-1.5 rounded-full bg-[#00D9C0]" />
          <h2 className="text-[13px] font-medium text-[#00D9C0]/70">
            Diário compartilhado &amp; padrões
          </h2>
        </div>
        <p className="text-[15px] leading-relaxed text-[#D0D5D5]/80">
          Em breve: entradas que o paciente escolheu compartilhar com você,
          padrões detectados pelo agente{' '}
          <code className="rounded bg-[#00D9C0]/10 px-1.5 py-0.5 text-[13px] text-[#00D9C0] font-medium tabular-nums">
            padroes
          </code>
          , e tendências dos checkins PHQ-9 / GAD-7.
        </p>
      </section>
    </div>
  )
}
