'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'motion/react'
import { Loader2, Eye, EyeOff, AlertCircle } from 'lucide-react'
import { PageHeader } from '@/components/paciente/page-header'
import { PaperCard } from '@/components/paciente/paper-card'
import { MoodSlider } from '@/components/paciente/mood-slider'
import { cn } from '@/lib/utils'

export default function NovaEntradaPage() {
  const router = useRouter()
  const [titulo, setTitulo] = useState('')
  const [conteudo, setConteudo] = useState('')
  const [humor, setHumor] = useState<number | null>(null)
  const [tags, setTags] = useState('')
  const [compartilhar, setCompartilhar] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  async function salvar(e: React.FormEvent) {
    e.preventDefault()
    if (conteudo.trim().length < 1) return
    setSalvando(true)
    setErro(null)
    try {
      const tagsArr = tags.split(',').map((t) => t.trim()).filter(Boolean)
      const res = await fetch('/api/paciente/diario', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          titulo: titulo || null,
          conteudo,
          humor,
          tags: tagsArr,
          compartilharComMedico: compartilhar,
        }),
      })
      if (!res.ok) {
        setErro('Não consegui salvar. Tente novamente.')
        return
      }
      router.push('/p/diario')
    } catch {
      setErro('Falha de conexão.')
    } finally {
      setSalvando(false)
    }
  }

  return (
    <>
      <PageHeader back="/p/diario" eyebrow="Nova entrada" title="Comece a" italic="escrever" />

      <form onSubmit={salvar} className="space-y-5 px-5 pb-6">
        <PaperCard className="px-5 py-5">
          <input
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            placeholder="Um título — opcional"
            className="w-full bg-transparent text-[22px] font-bold tracking-tight text-[#F5F7F7] outline-none placeholder:text-[#9AA8A8]/60 placeholder:font-normal"
          />
          <div className="my-4 h-px bg-[#00D9C0]/[0.06]" />
          <textarea
            required
            value={conteudo}
            onChange={(e) => setConteudo(e.target.value)}
            placeholder="O que você quer registrar? Pensamento, evento do dia, sentimento, qualquer coisa…"
            rows={10}
            className="w-full resize-y bg-transparent text-[15px] leading-relaxed text-[#F5F7F7] outline-none placeholder:text-[#9AA8A8]/60"
          />
        </PaperCard>

        <PaperCard className="px-5 py-5 space-y-5">
          <div>
            <span className="text-[13px] font-medium text-[#D0D5D5]">
              Como está se sentindo agora? <span className="text-[#9AA8A8]">· opcional</span>
            </span>
            <div className="mt-3">
              <MoodSlider
                label="Humor"
                value={humor ?? 5}
                onChange={(v) => setHumor(v)}
                hints={['mal', 'estável', 'bem']}
              />
            </div>
          </div>

          <div className="h-px bg-[#00D9C0]/[0.06]" />

          <label className="block">
            <span className="text-[13px] font-medium text-[#D0D5D5]">
              Tags <span className="text-[#9AA8A8]">· separe por vírgula</span>
            </span>
            <input
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="ansiedade, trabalho, sono"
              className="mt-2 w-full rounded-xl border border-[#00D9C0]/[0.15] bg-[#0A0E0E] px-4 py-2.5 text-[15px] text-[#F5F7F7] outline-none transition-all placeholder:text-[#9AA8A8]/60 focus:border-[#00D9C0]/40 focus:shadow-[0_0_0_4px_rgba(0,217,192,0.08)]"
            />
          </label>
        </PaperCard>

        {/* Toggle compartilhar */}
        <button
          type="button"
          onClick={() => setCompartilhar((v) => !v)}
          className={cn(
            'group flex w-full items-start gap-3 rounded-2xl border px-4 py-4 text-left transition-all duration-300',
            compartilhar
              ? 'border-[#00D9C0]/40 bg-[#00D9C0]/10'
              : 'border-[#00D9C0]/[0.15] bg-[#111818] hover:border-[#00D9C0]/25',
          )}
          style={
            compartilhar
              ? { boxShadow: '0 0 0 4px rgba(0, 217, 192, 0.08)' }
              : undefined
          }
        >
          <span
            className={cn(
              'mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-md border transition-all',
              compartilhar
                ? 'border-[#00D9C0] bg-[#00D9C0] text-[#0A0E0E]'
                : 'border-[#00D9C0]/40',
            )}
          >
            {compartilhar ? <Eye size={11} strokeWidth={3} /> : <EyeOff size={11} className="text-[#9AA8A8]" />}
          </span>
          <div className="flex-1">
            <div className="text-[15px] font-semibold text-[#F5F7F7]">
              {compartilhar ? 'Visível para seu/sua médico(a)' : 'Privada — só você vê'}
            </div>
            <p className="mt-1 text-[13px] leading-relaxed text-[#D0D5D5]/80">
              {compartilhar
                ? 'Esta entrada vai aparecer no acompanhamento clínico.'
                : 'Por padrão, suas entradas são privadas. Toque para compartilhar esta entrada com quem acompanha você.'}
            </p>
          </div>
        </button>

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
          className="group inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-[#00D9C0]/40 bg-[#00D9C0]/10 py-3.5 text-[15px] font-semibold text-[#00D9C0] transition-all duration-300 hover:bg-[#00D9C0]/20 hover:border-[#00D9C0]/60 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-[#00D9C0]/10"
          style={{ boxShadow: salvando ? 'none' : '0 0 24px rgba(0, 217, 192, 0.12)' }}
        >
          {salvando && <Loader2 size={16} className="animate-spin" />}
          {salvando ? 'Salvando…' : 'Salvar página'}
        </motion.button>
      </form>
    </>
  )
}
