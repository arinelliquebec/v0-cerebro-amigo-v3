'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'motion/react'
import {
  Loader2, Eye, EyeOff, Pencil, Trash2, X, Check, AlertTriangle, AlertCircle,
} from 'lucide-react'
import { PageHeader } from '@/components/paciente/page-header'
import { PaperCard } from '@/components/paciente/paper-card'
import { MoodSlider } from '@/components/paciente/mood-slider'
import { cn } from '@/lib/utils'

type Entrada = {
  id: string
  titulo: string | null
  conteudo: string
  humor: number | null
  tags: string[]
  compartilhadaComMedico: boolean
  criadaEm: string
  atualizadaEm: string
}

function formatDate(iso: string) {
  const d = new Date(iso)
  return d.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function EntradaClient({ entrada: initial }: { entrada: Entrada }) {
  const router = useRouter()
  const [entrada, setEntrada] = useState(initial)
  const [editMode, setEditMode] = useState(false)

  const [titulo, setTitulo] = useState(initial.titulo ?? '')
  const [conteudo, setConteudo] = useState(initial.conteudo)
  const [humor, setHumor] = useState<number | null>(initial.humor)
  const [tags, setTags] = useState(initial.tags.join(', '))
  const [compartilhar, setCompartilhar] = useState(initial.compartilhadaComMedico)

  const [salvando, setSalvando] = useState(false)
  const [apagando, setApagando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)

  async function salvar(e: React.FormEvent) {
    e.preventDefault()
    if (conteudo.trim().length < 1) return
    setSalvando(true)
    setErro(null)
    try {
      const tagsArr = tags.split(',').map((t) => t.trim()).filter(Boolean)
      const res = await fetch(`/api/paciente/diario/${entrada.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          titulo: titulo.trim() || null,
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
      setEntrada({
        ...entrada,
        titulo: titulo.trim() || null,
        conteudo,
        humor,
        tags: tagsArr,
        compartilhadaComMedico: compartilhar,
        atualizadaEm: new Date().toISOString(),
      })
      setEditMode(false)
    } catch {
      setErro('Falha de conexão.')
    } finally {
      setSalvando(false)
    }
  }

  function cancelarEdit() {
    setTitulo(entrada.titulo ?? '')
    setConteudo(entrada.conteudo)
    setHumor(entrada.humor)
    setTags(entrada.tags.join(', '))
    setCompartilhar(entrada.compartilhadaComMedico)
    setEditMode(false)
    setErro(null)
  }

  async function apagar() {
    setApagando(true)
    setErro(null)
    try {
      const res = await fetch(`/api/paciente/diario/${entrada.id}`, { method: 'DELETE' })
      if (!res.ok) {
        setErro('Não consegui apagar. Tente novamente.')
        setApagando(false)
        setConfirmDelete(false)
        return
      }
      router.push('/p/diario')
      router.refresh()
    } catch {
      setErro('Falha de conexão.')
      setApagando(false)
      setConfirmDelete(false)
    }
  }

  return (
    <>
      <PageHeader
        back="/p/diario"
        eyebrow={formatDate(entrada.criadaEm)}
        title={editMode ? 'Editando' : entrada.titulo || 'Entrada'}
        italic={editMode ? 'entrada' : entrada.titulo ? undefined : 'sem título'}
      />

      <div className="px-5 pb-6">
        <AnimatePresence mode="wait">
          {!editMode ? (
            <motion.div
              key="view"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="space-y-5"
            >
              <PaperCard className="px-5 py-5">
                {entrada.titulo && (
                  <h2 className="text-[22px] font-bold tracking-tight leading-tight text-[#F5F7F7]">
                    {entrada.titulo}
                  </h2>
                )}
                <div
                  className={cn(
                    'whitespace-pre-wrap text-[15px] leading-relaxed text-[#F5F7F7]',
                    entrada.titulo && 'mt-3',
                  )}
                >
                  {entrada.conteudo}
                </div>
              </PaperCard>

              {(entrada.humor !== null || entrada.tags.length > 0 || entrada.compartilhadaComMedico) && (
                <PaperCard className="space-y-4 px-5 py-5">
                  {entrada.humor !== null && (
                    <div>
                      <span className="text-[13px] font-medium text-[#9AA8A8]">
                        Humor registrado
                      </span>
                      <div className="mt-2 flex items-baseline gap-2">
                        <div className="text-[32px] font-bold tabular-nums text-[#00D9C0]">
                          {entrada.humor}
                        </div>
                        <div className="text-[14px] font-medium text-[#9AA8A8]">/ 10</div>
                      </div>
                    </div>
                  )}

                  {entrada.tags.length > 0 && (
                    <>
                      {entrada.humor !== null && <div className="h-px bg-[#00D9C0]/[0.06]" />}
                      <div>
                        <span className="text-[13px] font-medium text-[#9AA8A8]">Tags</span>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {entrada.tags.map((t) => (
                            <span
                              key={t}
                              className="rounded-full border border-[#00D9C0]/25 bg-[#00D9C0]/10 px-3 py-1 text-[13px] font-medium text-[#00D9C0]"
                            >
                              {t}
                            </span>
                          ))}
                        </div>
                      </div>
                    </>
                  )}

                  {entrada.compartilhadaComMedico && (
                    <>
                      <div className="h-px bg-[#00D9C0]/[0.06]" />
                      <div className="flex items-start gap-2 text-[14px] font-medium text-[#00D9C0]">
                        <Eye size={16} className="mt-0.5 shrink-0" />
                        <span>Visível para seu/sua médico(a)</span>
                      </div>
                    </>
                  )}
                </PaperCard>
              )}

              {erro && (
                <div className="flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-3.5 py-3 text-[14px] leading-relaxed text-red-200">
                  <AlertCircle size={16} className="mt-0.5 shrink-0" />
                  {erro}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setEditMode(true)}
                  className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-[#00D9C0]/40 bg-[#00D9C0]/10 py-3.5 text-[15px] font-semibold text-[#00D9C0] transition-all duration-300 hover:border-[#00D9C0]/60 hover:bg-[#00D9C0]/20"
                >
                  <Pencil size={16} />
                  Editar
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmDelete(true)}
                  className="flex items-center justify-center gap-2 rounded-2xl border border-red-500/30 bg-red-500/10 px-5 py-3.5 text-[15px] font-semibold text-red-300 transition-all duration-300 hover:border-red-500/50 hover:bg-red-500/15"
                  aria-label="Apagar entrada"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.form
              key="edit"
              onSubmit={salvar}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="space-y-5"
            >
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
                  rows={10}
                  className="w-full resize-y bg-transparent text-[15px] leading-relaxed text-[#F5F7F7] outline-none placeholder:text-[#9AA8A8]/60"
                />
              </PaperCard>

              <PaperCard className="space-y-5 px-5 py-5">
                <div>
                  <span className="text-[13px] font-medium text-[#D0D5D5]">
                    Humor <span className="text-[#9AA8A8]">· opcional</span>
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

              <button
                type="button"
                onClick={() => setCompartilhar((v) => !v)}
                className={cn(
                  'group flex w-full items-start gap-3 rounded-2xl border px-4 py-4 text-left transition-all duration-300',
                  compartilhar
                    ? 'border-[#00D9C0]/40 bg-[#00D9C0]/10'
                    : 'border-[#00D9C0]/[0.15] bg-[#111818] hover:border-[#00D9C0]/25',
                )}
                style={compartilhar ? { boxShadow: '0 0 0 4px rgba(0, 217, 192, 0.08)' } : undefined}
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
                      : 'Por padrão, suas entradas são privadas.'}
                  </p>
                </div>
              </button>

              {erro && (
                <div className="flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-3.5 py-3 text-[14px] leading-relaxed text-red-200">
                  <AlertCircle size={16} className="mt-0.5 shrink-0" />
                  {erro}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={cancelarEdit}
                  disabled={salvando}
                  className="flex items-center justify-center gap-2 rounded-2xl border border-[#00D9C0]/[0.15] bg-[#111818] px-5 py-3.5 text-[15px] font-medium text-[#D0D5D5] transition-all hover:bg-[#00D9C0]/[0.06] disabled:opacity-60"
                >
                  <X size={16} />
                  Cancelar
                </button>
                <motion.button
                  whileTap={{ scale: 0.985 }}
                  type="submit"
                  disabled={salvando}
                  className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-[#00D9C0]/40 bg-[#00D9C0]/10 py-3.5 text-[15px] font-semibold text-[#00D9C0] transition-all duration-300 hover:border-[#00D9C0]/60 hover:bg-[#00D9C0]/20 disabled:cursor-not-allowed disabled:opacity-60"
                  style={{ boxShadow: salvando ? 'none' : '0 0 24px rgba(0, 217, 192, 0.12)' }}
                >
                  {salvando ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                  {salvando ? 'Salvando…' : 'Salvar'}
                </motion.button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {confirmDelete && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 grid place-items-center bg-[#0A0E0E]/85 px-5 backdrop-blur-sm"
              onClick={() => !apagando && setConfirmDelete(false)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-sm rounded-2xl border border-red-500/30 bg-[#111818] p-6"
              >
                <div className="flex items-start gap-3">
                  <AlertTriangle size={22} className="mt-0.5 shrink-0 text-red-400" />
                  <div className="flex-1">
                    <h3 className="text-[20px] font-bold tracking-tight text-[#F5F7F7]">
                      Apagar esta entrada?
                    </h3>
                    <p className="mt-2 text-[14px] leading-relaxed text-[#D0D5D5]/80">
                      Esta ação é permanente. Você não vai conseguir recuperar depois.
                    </p>
                  </div>
                </div>
                <div className="mt-6 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(false)}
                    disabled={apagando}
                    className="flex flex-1 items-center justify-center rounded-xl border border-[#00D9C0]/[0.15] bg-[#0A0E0E] py-2.5 text-[14px] font-medium text-[#D0D5D5] transition-all hover:bg-[#00D9C0]/[0.06] disabled:opacity-60"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={apagar}
                    disabled={apagando}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-red-500/40 bg-red-500/15 py-2.5 text-[14px] font-semibold text-red-300 transition-all hover:border-red-500/60 hover:bg-red-500/25 disabled:opacity-60"
                  >
                    {apagando && <Loader2 size={14} className="animate-spin" />}
                    {apagando ? 'Apagando…' : 'Apagar'}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  )
}
