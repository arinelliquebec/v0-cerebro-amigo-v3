import { fetchApi } from '@/lib/api'
import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'
import { Bot, Save } from 'lucide-react'

export const metadata = { title: 'Agentes' }

type Agente = {
  id: string
  nome: string
  systemPrompt: string
  modeloDefault: string
  ativo: boolean
  atualizadoEm: string
}

async function atualizarPrompt(formData: FormData) {
  'use server'

  const id = formData.get('id') as string
  const systemPrompt = formData.get('systemPrompt') as string
  const modeloDefault = formData.get('modeloDefault') as string

  if (!id || !systemPrompt) return

  const cookieStore = await cookies()
  const token = cookieStore.get('auth_token')?.value
  const apiUrl = process.env.API_GATEWAY_URL ?? 'http://localhost:5050'

  await fetch(`${apiUrl}/api/v1/agentes/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ systemPrompt, modeloDefault }),
  })

  revalidatePath('/dashboard/agentes')
}

export default async function AgentesPage() {
  const agentes = await fetchApi<Agente[]>('/api/v1/agentes')

  return (
    <div className="mx-auto max-w-[1100px] space-y-8 px-8 py-10">
      <header className="border-b border-[#00D9C0]/[0.08] pb-8">
        <div className="flex items-center gap-2 mb-3">
          <span className="w-1.5 h-1.5 rounded-full bg-[#00D9C0]" />
          <span className="text-[13px] font-medium text-[#00D9C0]/70">Configuração</span>
        </div>
        <h1 className="text-[32px] font-bold tracking-tight text-[#F5F7F7]">
          <span className="text-[#00D9C0]">Agentes</span> de IA
        </h1>
        <p className="mt-2 max-w-2xl text-[15px] text-[#D0D5D5]/80">
          System prompts dos agentes que analisam pacientes. Mudanças aplicam imediatamente.
        </p>
      </header>

      {agentes.length === 0 ? (
        <div className="rounded-2xl border border-[#00D9C0]/[0.08] bg-[#111818] p-12 text-center">
          <Bot size={36} className="mx-auto mb-4 text-[#00D9C0]/60" />
          <p className="text-[20px] font-semibold tracking-tight text-[#F5F7F7]">
            Sem agentes configurados
          </p>
          <p className="mt-2 text-[15px] text-[#D0D5D5]/80">
            Configure agentes via API ou seed inicial.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {agentes.map((a) => (
            <form
              key={a.id}
              action={atualizarPrompt}
              className="space-y-5 rounded-2xl border border-[#00D9C0]/[0.08] bg-[#111818] p-6"
            >
              <input type="hidden" name="id" value={a.id} />

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span
                    className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#00D9C0]/30 bg-[#00D9C0]/10 text-[#00D9C0]"
                    style={{ boxShadow: '0 0 16px rgba(0, 217, 192, 0.08)' }}
                  >
                    <Bot size={18} strokeWidth={2} />
                  </span>
                  <h2 className="text-[20px] font-semibold tracking-tight text-[#F5F7F7]">
                    {a.nome}
                  </h2>
                </div>
                <StatusBadge ativo={a.ativo} />
              </div>

              <div className="space-y-2">
                <label
                  htmlFor={`modelo-${a.id}`}
                  className="block text-[13px] font-medium text-[#D0D5D5]"
                >
                  Modelo padrão
                </label>
                <select
                  id={`modelo-${a.id}`}
                  name="modeloDefault"
                  defaultValue={a.modeloDefault}
                  className="w-full rounded-xl border border-[#00D9C0]/[0.15] bg-[#0A0E0E] px-4 py-2.5 text-[15px] text-[#F5F7F7] outline-none transition-all focus:border-[#00D9C0]/40 focus:shadow-[0_0_0_4px_rgba(0,217,192,0.08)]"
                >
                  <option value="haiku">Haiku (rápido, barato)</option>
                  <option value="sonnet">Sonnet (padrão)</option>
                  <option value="opus">Opus (complexo)</option>
                </select>
              </div>

              <div className="space-y-2">
                <label
                  htmlFor={`prompt-${a.id}`}
                  className="block text-[13px] font-medium text-[#D0D5D5]"
                >
                  System Prompt
                </label>
                <textarea
                  id={`prompt-${a.id}`}
                  name="systemPrompt"
                  defaultValue={a.systemPrompt}
                  rows={14}
                  className="w-full rounded-xl border border-[#00D9C0]/[0.15] bg-[#0A0E0E] px-4 py-3 font-mono text-[13px] leading-relaxed text-[#F5F7F7] outline-none transition-all focus:border-[#00D9C0]/40 focus:shadow-[0_0_0_4px_rgba(0,217,192,0.08)]"
                />
                <p className="text-[13px] text-[#9AA8A8]">
                  Texto técnico (mono). Indentação e quebras de linha são preservadas literalmente.
                </p>
              </div>

              <div className="flex items-center justify-between border-t border-[#00D9C0]/[0.05] pt-5">
                <span className="text-[13px] text-[#9AA8A8]">
                  Atualizado em{' '}
                  <span className="tabular-nums text-[#D0D5D5]">
                    {new Date(a.atualizadoEm).toLocaleString('pt-BR', {
                      day: '2-digit',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </span>
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 rounded-xl border border-[#00D9C0]/30 bg-[#00D9C0]/10 px-4 py-2.5 text-[14px] font-medium text-[#00D9C0] transition-all hover:border-[#00D9C0]/50 hover:bg-[#00D9C0]/15"
                  style={{ boxShadow: '0 0 24px rgba(0, 217, 192, 0.08)' }}
                >
                  <Save size={15} strokeWidth={2} />
                  Salvar
                </button>
              </div>
            </form>
          ))}
        </div>
      )}
    </div>
  )
}

function StatusBadge({ ativo }: { ativo: boolean }) {
  if (ativo) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/15 px-2.5 py-1 text-[12px] font-medium text-emerald-300">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
        Ativo
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-[#00D9C0]/[0.15] bg-[#0A0E0E] px-2.5 py-1 text-[12px] font-medium text-[#9AA8A8]">
      Inativo
    </span>
  )
}
