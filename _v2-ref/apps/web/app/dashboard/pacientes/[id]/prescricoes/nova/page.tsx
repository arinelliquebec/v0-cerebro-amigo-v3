'use client'

import { useState, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, Plus, X, Check, Loader2, AlertCircle, ScrollText } from 'lucide-react'

const INPUT_CLS =
  'w-full px-3.5 py-2.5 bg-[#0A0E0E] border border-[#00D9C0]/[0.15] rounded-lg text-[15px] text-[#F5F7F7] ' +
  'placeholder:text-[#9AA8A8]/60 outline-none transition-all ' +
  'focus:border-[#00D9C0]/40 focus:shadow-[0_0_0_4px_rgba(0,217,192,0.08)]'

export default function NovaPrescricaoPage({
  params,
}: { params: Promise<{ id: string }> }) {
  const { id: pacienteId } = use(params)
  const router = useRouter()

  const [medicamento, setMedicamento] = useState('')
  const [doseDescricao, setDoseDescricao] = useState('')
  const [horarios, setHorarios] = useState<string[]>(['08:00'])
  const [inicioEm, setInicioEm] = useState(new Date().toISOString().slice(0, 10))
  const [fimEm, setFimEm] = useState('')
  const [receitaTipo, setReceitaTipo] = useState('comum')
  const [receitaValidade, setReceitaValidade] = useState('')
  const [observacoes, setObservacoes] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  function adicionarHorario() {
    setHorarios([...horarios, '20:00'])
  }
  function removerHorario(i: number) {
    setHorarios(horarios.filter((_, idx) => idx !== i))
  }
  function atualizarHorario(i: number, v: string) {
    setHorarios(horarios.map((h, idx) => (idx === i ? v : h)))
  }

  async function salvar(e: React.FormEvent) {
    e.preventDefault()
    setSalvando(true)
    setErro(null)
    try {
      const res = await fetch('/api/dashboard/prescricoes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pacienteId,
          medicamento,
          doseDescricao,
          horarios,
          inicioEm,
          fimEm: fimEm || null,
          receitaTipo: receitaTipo || null,
          receitaValidade: receitaValidade || null,
          observacoes: observacoes || null,
        }),
      })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        setErro(j.error ?? 'Erro ao criar prescrição')
        return
      }
      router.push(`/dashboard/pacientes/${pacienteId}`)
    } catch {
      setErro('Falha de conexão')
    } finally {
      setSalvando(false)
    }
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <Link
        href={`/dashboard/pacientes/${pacienteId}`}
        className="inline-flex items-center gap-1.5 text-[13px] font-medium text-[#9AA8A8] transition-colors hover:text-[#00D9C0] mb-4"
      >
        <ChevronLeft size={16} /> Voltar para paciente
      </Link>

      <h1 className="text-[32px] font-bold tracking-tight text-[#F5F7F7] mb-6">
        Nova prescrição
      </h1>

      <div className="flex items-start gap-3 bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 mb-6">
        <ScrollText size={18} strokeWidth={2} className="mt-0.5 shrink-0 text-amber-400" />
        <div className="text-[14px] leading-relaxed text-amber-200">
          <p className="font-semibold text-amber-300 mb-1">Importante</p>
          <p>
            Esta prescrição serve para <strong>operação interna</strong> (lembretes, controle
            de adesão). <strong>Não substitui</strong> receita formal com sua assinatura
            ICP-Brasil — emita pela Memed, Prescrição Eletrônica ou receita física como sempre.
          </p>
        </div>
      </div>

      <form onSubmit={salvar} className="bg-[#111818] rounded-2xl border border-[#00D9C0]/[0.08] p-6 space-y-5">
        <div>
          <label className="block text-[13px] font-medium text-[#D0D5D5] mb-1.5">
            Medicamento *
          </label>
          <input
            required
            value={medicamento}
            onChange={(e) => setMedicamento(e.target.value)}
            placeholder="ex: Sertralina 50mg"
            className={INPUT_CLS}
          />
          <p className="text-[13px] text-[#9AA8A8] mt-1.5">Princípio ativo + apresentação</p>
        </div>

        <div>
          <label className="block text-[13px] font-medium text-[#D0D5D5] mb-1.5">
            Posologia *
          </label>
          <input
            required
            value={doseDescricao}
            onChange={(e) => setDoseDescricao(e.target.value)}
            placeholder="ex: 1 comprimido pela manhã, em jejum"
            className={INPUT_CLS}
          />
        </div>

        <div>
          <label className="block text-[13px] font-medium text-[#D0D5D5] mb-1.5">
            Horários *
          </label>
          <div className="space-y-2">
            {horarios.map((h, i) => (
              <div key={i} className="flex gap-2">
                <input
                  type="time"
                  required
                  value={h}
                  onChange={(e) => atualizarHorario(i, e.target.value)}
                  className={`${INPUT_CLS} max-w-[160px] tabular-nums`}
                />
                {horarios.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removerHorario(i)}
                    className="p-2 text-[#9AA8A8] hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
                    aria-label="Remover horário"
                  >
                    <X size={18} />
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={adicionarHorario}
              className="inline-flex items-center gap-1 text-[14px] font-medium text-[#00D9C0] hover:text-[#00D9C0]/80 transition-colors"
            >
              <Plus size={14} /> Adicionar horário
            </button>
          </div>
          <p className="text-[13px] text-[#9AA8A8] mt-1.5">
            Sistema vai disparar lembrete de tomada nesses horários
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[13px] font-medium text-[#D0D5D5] mb-1.5">Início *</label>
            <input
              required
              type="date"
              value={inicioEm}
              onChange={(e) => setInicioEm(e.target.value)}
              className={`${INPUT_CLS} tabular-nums`}
            />
          </div>
          <div>
            <label className="block text-[13px] font-medium text-[#D0D5D5] mb-1.5">Fim (opcional)</label>
            <input
              type="date"
              value={fimEm}
              onChange={(e) => setFimEm(e.target.value)}
              className={`${INPUT_CLS} tabular-nums`}
            />
            <p className="text-[13px] text-[#9AA8A8] mt-1.5">Vazio = uso contínuo</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[13px] font-medium text-[#D0D5D5] mb-1.5">Tipo de receita</label>
            <select
              value={receitaTipo}
              onChange={(e) => setReceitaTipo(e.target.value)}
              className={INPUT_CLS}
            >
              <option value="comum">Comum (não controlada)</option>
              <option value="C1">C1 (controlada)</option>
              <option value="B1">B1 (psicotrópica)</option>
              <option value="B2">B2 (psicotrópica anorexígena)</option>
            </select>
          </div>
          <div>
            <label className="block text-[13px] font-medium text-[#D0D5D5] mb-1.5">Validade da receita</label>
            <input
              type="date"
              value={receitaValidade}
              onChange={(e) => setReceitaValidade(e.target.value)}
              className={`${INPUT_CLS} tabular-nums`}
            />
            <p className="text-[13px] text-[#9AA8A8] mt-1.5">Sistema avisa 7 dias antes do vencimento</p>
          </div>
        </div>

        <div>
          <label className="block text-[13px] font-medium text-[#D0D5D5] mb-1.5">
            Observações para o paciente
          </label>
          <textarea
            value={observacoes}
            onChange={(e) => setObservacoes(e.target.value)}
            rows={3}
            placeholder="ex: tomar 30min antes de dormir; evitar com álcool"
            className={`${INPUT_CLS} resize-y leading-relaxed`}
          />
          <p className="text-[13px] text-[#9AA8A8] mt-1.5">Aparece pro paciente no app</p>
        </div>

        {erro && (
          <div className="flex items-start gap-2 p-3.5 bg-red-500/10 border border-red-500/30 rounded-xl text-[14px] leading-relaxed text-red-200">
            <AlertCircle size={16} className="mt-0.5 shrink-0" />
            {erro}
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={salvando}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#00D9C0] text-[#0A0E0E] rounded-xl text-[15px] font-semibold transition-all hover:bg-[#00D9C0]/90 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ boxShadow: salvando ? 'none' : '0 0 20px rgba(0, 217, 192, 0.2)' }}
          >
            {salvando ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
            {salvando ? 'Salvando…' : 'Criar prescrição'}
          </button>
          <Link
            href={`/dashboard/pacientes/${pacienteId}`}
            className="inline-flex items-center px-5 py-2.5 border border-[#00D9C0]/[0.15] rounded-xl text-[15px] font-medium text-[#D0D5D5] hover:bg-[#00D9C0]/[0.06] transition-colors"
          >
            Cancelar
          </Link>
        </div>
      </form>
    </div>
  )
}
