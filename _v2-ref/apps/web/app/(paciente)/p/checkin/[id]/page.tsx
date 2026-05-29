'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'motion/react'
import { Check, X, MinusCircle, Loader2 } from 'lucide-react'
import { PageHeader } from '@/components/paciente/page-header'
import { PaperCard } from '@/components/paciente/paper-card'
import { MoodSlider } from '@/components/paciente/mood-slider'
import { cn } from '@/lib/utils'

type Checkin = {
  id: string
  tipo: string
  payloadJson: string
  agendadoPara: string
  enviadoEm: string | null
}

export default function CheckinPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const router = useRouter()
  const [checkin, setCheckin] = useState<Checkin | null>(null)
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)

  useEffect(() => {
    fetch(`/api/paciente/checkins/${id}`)
      .then(async (r) => {
        if (!r.ok) {
          setErro(
            r.status === 404
              ? 'Check-in não encontrado ou já respondido.'
              : 'Erro ao carregar.',
          )
          return null
        }
        return r.json()
      })
      .then((data) => setCheckin(data))
      .finally(() => setCarregando(false))
  }, [id])

  async function responder(resposta: any) {
    const res = await fetch(`/api/paciente/checkins/${id}/responder`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ resposta }),
    })
    if (res.ok) router.push('/p?ok=1')
    else alert('Erro ao salvar resposta. Tente novamente.')
  }

  if (carregando) {
    return (
      <div className="grid min-h-[60vh] place-items-center text-[#00D9C0]">
        <Loader2 size={26} className="animate-spin" />
      </div>
    )
  }

  if (erro || !checkin) {
    return (
      <div className="px-5 pt-12 text-center">
        <p className="font-bold tracking-tight text-2xl text-[#F5F7F7]">{erro ?? 'Indisponível.'}</p>
        <button
          onClick={() => router.push('/p')}
          className="mt-6 rounded-full bg-[#00D9C0] px-5 py-2.5 text-[11px] uppercase tracking-[0.2em] text-[#0A0E0E] transition-colors hover:bg-[#00D9C0]/90"
        >
          voltar pro início
        </button>
      </div>
    )
  }

  const payload = (() => {
    try {
      return JSON.parse(checkin.payloadJson)
    } catch {
      return {}
    }
  })()

  return (
    <div>
      {checkin.tipo === 'medicacao' && (
        <CheckinMedicacao payload={payload} responder={responder} />
      )}
      {checkin.tipo === 'humor_diario' && (
        <CheckinHumor responder={responder} />
      )}
      {(checkin.tipo === 'questionario_phq9' ||
        checkin.tipo === 'questionario_gad7') && (
        <CheckinQuestionario tipo={checkin.tipo} responder={responder} />
      )}
      {checkin.tipo === 'efeito_colateral' && (
        <CheckinEfeito payload={payload} responder={responder} />
      )}
    </div>
  )
}

// =============================================================================
// MEDICAÇÃO — 3 botões grandes
// =============================================================================

function CheckinMedicacao({
  payload,
  responder,
}: {
  payload: any
  responder: (r: any) => void
}) {
  const [nota, setNota] = useState('')

  return (
    <>
      <PageHeader
        back="/p"
        eyebrow="check-in · medicação"
        title="Hora do"
        italic="remédio"
        kicker={
          <>
            Você tomou{' '}
            <strong className="text-[#F5F7F7]">
              {payload.medicamento ?? '(medicação)'}
            </strong>{' '}
            às{' '}
            <span className="tabular-nums text-[#00D9C0]">
              {payload.horario ?? '--:--'}
            </span>
            ?
          </>
        }
      />

      <div className="space-y-3 px-5 pb-6">
        <BigButton
          tone="violet"
          onClick={() => responder({ status: 'tomada', nota })}
          icon={<Check size={18} />}
          label="Tomei"
          hint="confirmar"
        />
        <BigButton
          tone="amber"
          onClick={() => responder({ status: 'esquecida', nota })}
          icon={<MinusCircle size={18} />}
          label="Esqueci"
          hint="sem problema"
        />
        <BigButton
          tone="ghost"
          onClick={() => responder({ status: 'pulou', nota })}
          icon={<X size={18} />}
          label="Pulei propositalmente"
          hint="por algum motivo"
        />

        <PaperCard className="px-5 py-4">
          <details>
            <summary className="cursor-pointer text-[10px] tracking-wide text-[#00D9C0] list-none">
              + adicionar uma nota (efeito colateral, motivo, etc)
            </summary>
            <textarea
              value={nota}
              onChange={(e) => setNota(e.target.value)}
              rows={3}
              placeholder="Ex: senti sono depois de tomar"
              className="mt-3 w-full resize-y rounded-xl border border-[#00D9C0]/[0.08] bg-[#0A0E0E] px-3 py-2.5 text-sm text-[#F5F7F7] outline-none transition-all placeholder:text-[#9AA8A8]/60 focus:border-[#00D9C0]/40 focus:bg-[#0A0E0E] focus:shadow-[0_0_0_4px_rgba(0,217,192,0.1)]"
            />
          </details>
        </PaperCard>
      </div>
    </>
  )
}

function BigButton({
  tone,
  onClick,
  icon,
  label,
  hint,
}: {
  tone: 'violet' | 'amber' | 'ghost'
  onClick: () => void
  icon: React.ReactNode
  label: string
  hint?: string
}) {
  const palette = {
    violet:
      'bg-[#00D9C0] text-[#0A0E0E] border-ink hover:bg-[#00D9C0]/90 hover:border-[#00D9C0] hover:shadow-[0_22px_44px_-22px_rgba(0,217,192,0.35)]',
    amber:
      'bg-amber-500/10 text-amber-200 border-amber-500/25 hover:bg-amber-500/20 hover:border-amber-500/40',
    ghost:
      'bg-[#111818] text-[#F5F7F7] border-[#00D9C0]/[0.12] hover:border-[#00D9C0]/40 hover:bg-[#00D9C0]/[0.06]',
  } as const

  return (
    <motion.button
      whileTap={{ scale: 0.985 }}
      onClick={onClick}
      className={cn(
        'group flex w-full items-center justify-between gap-4 rounded-2xl border px-5 py-5 text-left transition-all duration-300',
        palette[tone],
      )}
    >
      <span className="flex items-center gap-3">
        <span className="grid h-9 w-9 place-items-center rounded-full bg-current/10">
          {icon}
        </span>
        <span>
          <span className="font-bold tracking-tight block text-xl leading-none">
            {label}
          </span>
          {hint && (
            <span className="mt-1 block text-[10px] tracking-wide opacity-70">
              {hint}
            </span>
          )}
        </span>
      </span>
    </motion.button>
  )
}

// =============================================================================
// HUMOR — sliders
// =============================================================================

function CheckinHumor({ responder }: { responder: (r: any) => void }) {
  const [humor, setHumor] = useState(5)
  const [ansiedade, setAnsiedade] = useState(5)
  const [sono, setSono] = useState(7)
  const [energia, setEnergia] = useState(5)
  const [nota, setNota] = useState('')

  return (
    <>
      <PageHeader
        back="/p"
        eyebrow="check-in · humor"
        title="Como você"
        italic="está?"
        kicker="Mova as barras como melhor representar seu dia."
      />
      <div className="space-y-5 px-5 pb-6">
        <PaperCard className="space-y-7 px-5 py-6">
          <MoodSlider
            label="Humor"
            value={humor}
            onChange={setHumor}
            hints={['muito mal', 'ok', 'muito bem']}
          />
          <MoodSlider
            label="Ansiedade"
            value={ansiedade}
            onChange={setAnsiedade}
            hints={['calmo', 'média', 'muito ansioso']}
          />
          <MoodSlider
            label="Horas de sono"
            value={sono}
            onChange={setSono}
            min={0}
            max={12}
            step={0.5}
            unit="h"
          />
          <MoodSlider
            label="Energia"
            value={energia}
            onChange={setEnergia}
            hints={['exausto', 'média', 'cheio de energia']}
          />
        </PaperCard>

        <PaperCard className="px-5 py-5">
          <label className="block">
            <span className="text-[10px] tracking-wide text-[#9AA8A8]">
              algo a comentar? · opcional
            </span>
            <textarea
              value={nota}
              onChange={(e) => setNota(e.target.value)}
              rows={3}
              className="mt-2 w-full resize-y rounded-xl border border-[#00D9C0]/[0.08] bg-[#0A0E0E] px-3 py-2.5 text-sm text-[#F5F7F7] outline-none transition-all placeholder:text-[#9AA8A8]/60 focus:border-[#00D9C0]/40 focus:bg-[#0A0E0E] focus:shadow-[0_0_0_4px_rgba(0,217,192,0.1)]"
            />
          </label>
        </PaperCard>

        <button
          onClick={() =>
            responder({ humor, ansiedade, sono_horas: sono, energia, nota })
          }
          className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#00D9C0] py-3.5 text-xs tracking-wide text-[#0A0E0E] transition-all hover:bg-[#00D9C0]/90 hover:shadow-[0_18px_40px_-18px_rgba(0,217,192,0.35)]"
        >
          salvar
        </button>
      </div>
    </>
  )
}

// =============================================================================
// QUESTIONÁRIO — likert grid
// =============================================================================

function CheckinQuestionario({
  tipo,
  responder,
}: {
  tipo: string
  responder: (r: any) => void
}) {
  const codigo = tipo.replace('questionario_', '').toUpperCase()
  const perguntas = codigo === 'PHQ9' ? PERGUNTAS_PHQ9 : PERGUNTAS_GAD7

  const [respostas, setRespostas] = useState<Record<string, number>>({})
  const completo = perguntas.length === Object.keys(respostas).length
  const restantes = perguntas.length - Object.keys(respostas).length

  return (
    <>
      <PageHeader
        back="/p"
        eyebrow={`questionário · ${codigo.toLowerCase()}`}
        title="Últimas"
        italic="2 semanas"
        kicker={
          codigo === 'PHQ9'
            ? 'Com que frequência você foi incomodado(a) por:'
            : 'Com que frequência você foi incomodado(a) pelos seguintes problemas:'
        }
      />

      <div className="space-y-3 px-5 pb-6">
        {perguntas.map((p, i) => {
          const respondida = respostas[`q${i + 1}`] !== undefined
          return (
            <PaperCard
              key={i}
              className={cn(
                'px-5 py-5 transition-all duration-300',
                respondida && 'border-[#00D9C0]/20 bg-[#00D9C0]/[0.06]',
              )}
            >
              <div className="flex items-baseline gap-3">
                <span className="tabular-nums text-[10px] tracking-wide text-[#9AA8A8]/70">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <p className="font-bold tracking-tight text-lg leading-snug text-[#F5F7F7]">
                  {p}
                </p>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-1.5 sm:grid-cols-4">
                {OPCOES_LIKERT.map((op, valor) => {
                  const ativo = respostas[`q${i + 1}`] === valor
                  return (
                    <button
                      key={valor}
                      onClick={() =>
                        setRespostas({ ...respostas, [`q${i + 1}`]: valor })
                      }
                      className={cn(
                        'rounded-xl border px-3 py-2.5 text-xs font-medium transition-all duration-200',
                        ativo
                          ? 'border-[#00D9C0] bg-[#00D9C0] text-[#0A0E0E] shadow-[0_8px_20px_-8px_rgba(0,217,192,0.3)]'
                          : 'border-[#00D9C0]/[0.08] bg-[#111818] text-[#F5F7F7] hover:border-[#00D9C0]/30 hover:bg-[#00D9C0]/10',
                      )}
                    >
                      {op}
                    </button>
                  )
                })}
              </div>
            </PaperCard>
          )
        })}

        <button
          onClick={() => responder({ respostas })}
          disabled={!completo}
          className={cn(
            'mt-2 inline-flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 text-xs tracking-wide transition-all duration-300',
            completo
              ? 'bg-[#00D9C0] text-[#0A0E0E] hover:bg-[#00D9C0]/90 hover:shadow-[0_18px_40px_-18px_rgba(0,217,192,0.35)]'
              : 'cursor-not-allowed bg-[#00D9C0]/10 text-[#9AA8A8]',
          )}
        >
          {completo ? 'enviar respostas' : `faltam ${restantes} ·`}
        </button>
      </div>
    </>
  )
}

// =============================================================================
// EFEITO COLATERAL — texto livre
// =============================================================================

function CheckinEfeito({
  payload,
  responder,
}: {
  payload: any
  responder: (r: any) => void
}) {
  const [texto, setTexto] = useState('')
  return (
    <>
      <PageHeader
        back="/p"
        eyebrow="check-in · efeitos"
        title="Como tem"
        italic="sido?"
        kicker={
          <>
            Sua experiência com{' '}
            <strong className="text-[#F5F7F7]">
              {payload.medicamento ?? 'a medicação'}
            </strong>
            . Sentiu efeitos colaterais ou mudanças?
          </>
        }
      />
      <div className="space-y-4 px-5 pb-6">
        <PaperCard className="px-5 py-5">
          <textarea
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            rows={6}
            placeholder="Ex: senti enjoo nos primeiros dias, mas melhorou…"
            className="w-full resize-y rounded-xl border border-[#00D9C0]/[0.08] bg-[#0A0E0E] px-3 py-2.5 text-base leading-relaxed text-[#F5F7F7] outline-none transition-all placeholder:text-[#9AA8A8]/60 focus:border-[#00D9C0]/40 focus:bg-[#0A0E0E] focus:shadow-[0_0_0_4px_rgba(0,217,192,0.1)]"
          />
        </PaperCard>
        <button
          onClick={() => responder({ relato: texto })}
          disabled={texto.trim().length < 3}
          className={cn(
            'inline-flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 text-xs tracking-wide transition-all duration-300',
            texto.trim().length >= 3
              ? 'bg-[#00D9C0] text-[#0A0E0E] hover:bg-[#00D9C0]/90 hover:shadow-[0_18px_40px_-18px_rgba(0,217,192,0.35)]'
              : 'cursor-not-allowed bg-[#00D9C0]/10 text-[#9AA8A8]',
          )}
        >
          enviar
        </button>
      </div>
    </>
  )
}

// =============================================================================
// CONSTANTES
// =============================================================================

const OPCOES_LIKERT = [
  'Nunca',
  'Vários dias',
  'Mais da metade',
  'Quase todo dia',
]

const PERGUNTAS_PHQ9 = [
  'Pouco interesse ou prazer em fazer as coisas',
  'Sentir-se desanimado(a), deprimido(a) ou sem esperança',
  'Dificuldade para pegar no sono, continuar dormindo ou dormir demais',
  'Sentir-se cansado(a) ou com pouca energia',
  'Falta de apetite ou comer em excesso',
  'Sentir-se mal consigo mesmo(a) — ou achar que é um fracasso',
  'Dificuldade de se concentrar (ler, ver TV)',
  'Movimentar-se ou falar tão devagar que outras pessoas notaram — ou o oposto, agitação',
  'Pensar que seria melhor estar morto(a) ou se machucar de alguma forma',
]

const PERGUNTAS_GAD7 = [
  'Sentir-se nervoso(a), ansioso(a) ou no limite',
  'Não conseguir parar ou controlar as preocupações',
  'Preocupar-se demais com coisas variadas',
  'Dificuldade de relaxar',
  'Inquietação a ponto de não conseguir ficar parado',
  'Ficar facilmente irritado(a) ou aborrecido(a)',
  'Sentir medo, como se algo terrível pudesse acontecer',
]
