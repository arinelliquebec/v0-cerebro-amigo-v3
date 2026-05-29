'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'motion/react'
import { Loader2, Check, AlertCircle } from 'lucide-react'
import { PageHeader } from '@/components/paciente/page-header'
import { PaperCard } from '@/components/paciente/paper-card'
import { MoodSlider } from '@/components/paciente/mood-slider'

const EMOJIS = ['😢', '😟', '😕', '😐', '🙂', '😊', '😄', '🤩']

export default function HumorPage() {
  const router = useRouter()
  const [humor, setHumor] = useState(5)
  const [ansiedade, setAnsiedade] = useState(5)
  const [sonoHoras, setSonoHoras] = useState(7)
  const [energia, setEnergia] = useState(5)
  const [nota, setNota] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  async function salvar(e: React.FormEvent) {
    e.preventDefault()
    setSalvando(true)
    setErro(null)
    try {
      const res = await fetch('/api/paciente/humor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          humor,
          ansiedade,
          sonoHoras,
          energia,
          nota: nota || null,
        }),
      })
      if (!res.ok) {
        setErro('Não consegui salvar. Tente novamente.')
        return
      }
      router.push('/p')
    } catch {
      setErro('Falha de conexão.')
    } finally {
      setSalvando(false)
    }
  }

  const emojiHumor = EMOJIS[Math.min(Math.floor(humor / 1.4), EMOJIS.length - 1)]

  return (
    <>
      <PageHeader
        eyebrow="Check-in"
        title="Como você"
        italic="está hoje?"
        kicker="Mover algumas barras é o suficiente. Sem certo nem errado."
      />

      <form onSubmit={salvar} className="space-y-5 px-5 pb-6">
        <PaperCard className="px-5 py-6">
          <div className="space-y-7">
            <MoodSlider
              label="Humor geral"
              value={humor}
              onChange={setHumor}
              hints={['muito mal', 'estável', 'muito bem']}
              emoji={emojiHumor}
            />
            <Divider />
            <MoodSlider
              label="Ansiedade"
              value={ansiedade}
              onChange={setAnsiedade}
              hints={['nenhuma', 'média', 'pânico']}
            />
            <Divider />
            <MoodSlider
              label="Horas de sono"
              value={sonoHoras}
              onChange={setSonoHoras}
              min={0}
              max={12}
              step={0.5}
              unit="h"
              hints={['—', '—', '—']}
            />
            <Divider />
            <MoodSlider
              label="Energia"
              value={energia}
              onChange={setEnergia}
              hints={['esgotado', 'média', 'cheio']}
            />
          </div>
        </PaperCard>

        <PaperCard className="px-5 py-5">
          <label className="block">
            <span className="text-[13px] font-medium text-[#D0D5D5]">
              Quer comentar algo? <span className="text-[#9AA8A8]">· opcional</span>
            </span>
            <textarea
              value={nota}
              onChange={(e) => setNota(e.target.value)}
              rows={4}
              placeholder="Algum acontecimento, gatilho ou observação que valha registrar."
              className="mt-2 w-full resize-y rounded-xl border border-[#00D9C0]/[0.15] bg-[#0A0E0E] px-4 py-3 text-[15px] leading-relaxed text-[#F5F7F7] outline-none transition-all placeholder:text-[#9AA8A8]/60 focus:border-[#00D9C0]/40 focus:shadow-[0_0_0_4px_rgba(0,217,192,0.08)]"
            />
          </label>
        </PaperCard>

        {erro && (
          <div className="flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-3.5 py-3 text-[14px] leading-relaxed text-red-200">
            <AlertCircle size={16} className="mt-0.5 shrink-0" />
            {erro}
          </div>
        )}

        <motion.button
          whileTap={{ scale: 0.985 }}
          type="submit"
          disabled={salvando}
          className="group inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-[#00D9C0]/40 bg-[#00D9C0]/10 py-3.5 text-[15px] font-semibold text-[#00D9C0] transition-all duration-300 hover:bg-[#00D9C0]/20 hover:border-[#00D9C0]/60 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-[#00D9C0]/10"
          style={{ boxShadow: salvando ? 'none' : '0 0 24px rgba(0, 217, 192, 0.12)' }}
        >
          {salvando ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Check size={16} className="transition-transform group-hover:scale-110" />
          )}
          {salvando ? 'Salvando…' : 'Registrar'}
        </motion.button>
      </form>
    </>
  )
}

function Divider() {
  return <div className="h-px bg-[#00D9C0]/[0.06]" />
}
