'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  ChevronLeft,
  Check,
  AlertCircle,
  Copy,
  Mail,
  KeyRound,
  Phone,
  Sparkles,
  ShieldAlert,
} from 'lucide-react'

import {
  novoPacienteSchema,
  formatCpf,
  formatCelular,
  type NovoPacienteFormInput,
  type NovoPacienteFormOutput,
} from '@/lib/validators/paciente'

type Modo = 'email' | 'senha'
const SENHA_PROVISORIA = 'paciente7'

type Resultado = {
  pacienteId: string
  modo?: 'magic_link' | 'senha_provisoria'
  emailEnviado: boolean
  emailErro: string | null
  magicLinkUrl: string | null
  senhaProvisoria: string | null
}

export default function NovoPacientePage() {
  const [modo, setModo] = useState<Modo>('email')
  const [erroGlobal, setErroGlobal] = useState<string | null>(null)
  const [resultado, setResultado] = useState<Resultado | null>(null)
  // Guardamos o email submetido pra exibir na tela de sucesso — depois do
  // `reset()` do form ele se perde, mas o SucessoView precisa dele.
  const [emailSubmetido, setEmailSubmetido] = useState('')

  // `react-hook-form` cuida de touched/dirty/errors + integração com Zod via
  // resolver. `mode: 'onBlur'` é o equilíbrio certo pra clínica: não grita
  // a cada tecla, mas dá feedback antes do submit.
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting, isValid },
  } = useForm<NovoPacienteFormInput, unknown, NovoPacienteFormOutput>({
    resolver: zodResolver(novoPacienteSchema),
    mode: 'onBlur',
    reValidateMode: 'onChange',
    defaultValues: {
      nome: '',
      email: '',
      waId: '',
      cpf: '',
      dataNascimento: '',
    },
  })

  async function onSubmit(data: NovoPacienteFormOutput) {
    setErroGlobal(null)
    try {
      const res = await fetch('/api/dashboard/pacientes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: data.email,
          nome: data.nome,
          waId: data.waId,
          cpf: data.cpf ?? null,
          dataNascimento: data.dataNascimento ?? null,
          senhaInicial: modo === 'senha' ? SENHA_PROVISORIA : null,
        }),
      })
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as {
          error?: string
          message?: string
        }
        const detalhe = j.message ?? j.error
        if (res.status === 502 || res.status === 503) {
          setErroGlobal(`Backend indisponível${detalhe ? `: ${detalhe}` : ''}`)
        } else {
          setErroGlobal(detalhe ?? 'Erro ao criar paciente')
        }
        return
      }
      setEmailSubmetido(data.email)
      setResultado(await res.json())
    } catch {
      setErroGlobal('Falha de conexão')
    }
  }

  if (resultado) {
    return (
      <SucessoView
        resultado={resultado}
        email={emailSubmetido}
        onNovo={() => {
          setResultado(null)
          setErroGlobal(null)
          setEmailSubmetido('')
          reset()
        }}
      />
    )
  }

  return (
    <div className="px-6 sm:px-10 py-10 max-w-3xl mx-auto animate-rise">
      {/* ─── Header editorial ─────────────────────────────────────────── */}
      <Link
        href="/dashboard/pacientes"
        className="inline-flex items-center gap-1.5 text-xs text-[12px] font-medium tracking-wide text-[#9AA8A8] hover:text-[#F5F7F7] transition-colors"
      >
        <ChevronLeft size={14} strokeWidth={1.5} /> voltar à lista
      </Link>

      <div className="mt-6 mb-10 flex items-end justify-between gap-6 border-b border-[#00D9C0]/[0.08] pb-6">
        <div>
          <p className="text-[12px] font-medium tracking-wide text-[#9AA8A8] mb-3">Portal do médico · Pacientes</p>
          <h1 className="font-bold tracking-tight text-4xl sm:text-5xl text-[#F5F7F7] leading-[0.95]">
            Novo <span className="italic text-[#00D9C0]">paciente</span>
          </h1>
          <p className="mt-3 text-sm text-[#9AA8A8] max-w-md">
            Escolha como o paciente terá o primeiro acesso —{' '}
            <em className="italic">por convite no email</em> ou{' '}
            <em className="italic">com senha entregue em consultório</em>.
          </p>
        </div>
        <Sparkles
          className="hidden sm:block text-[#00D9C0]/40 shrink-0"
          size={48}
          strokeWidth={0.8}
        />
      </div>

      {/* ─── Tabs editoriais ──────────────────────────────────────────── */}
      <div
        role="tablist"
        aria-label="Forma de cadastro"
        className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8"
      >
        <TabCard
          numero="01"
          icon={<Mail size={20} strokeWidth={1.5} />}
          titulo="Cadastrar via Email"
          subtitulo="Convite com magic link de 24h. Paciente clica e cria a própria senha."
          ativo={modo === 'email'}
          onClick={() => setModo('email')}
        />
        <TabCard
          numero="02"
          icon={<KeyRound size={20} strokeWidth={1.5} />}
          titulo="Cadastrar e mudar Senha"
          subtitulo="Senha provisória pronta. Ideal pra cadastro em consultório."
          ativo={modo === 'senha'}
          onClick={() => setModo('senha')}
        />
      </div>

      {/* ─── Formulário ───────────────────────────────────────────────── */}
      <form
        onSubmit={handleSubmit(onSubmit)}
        noValidate
        className="bg-[#111818] backdrop-blur-sm rounded-2xl border border-[#00D9C0]/[0.08]
                   p-6 sm:p-8 space-y-6"
      >
        <Field
          label="Nome completo"
          required
          error={errors.nome?.message}
          htmlFor="nome"
        >
          <input
            id="nome"
            {...register('nome')}
            placeholder="ex. Maria Helena Souza"
            className={inputCls(!!errors.nome)}
            aria-invalid={!!errors.nome}
            aria-describedby={errors.nome ? 'nome-error' : undefined}
          />
        </Field>

        <Field
          label="Email"
          required
          error={errors.email?.message}
          htmlFor="email"
          hint={
            !errors.email && (
              modo === 'email' ? (
                <>
                  Receberá o link de primeiro acesso (válido por{' '}
                  <em className="italic">24 horas</em>).
                </>
              ) : (
                <>Será o login do paciente no portal.</>
              )
            )
          }
        >
          <input
            id="email"
            type="email"
            {...register('email')}
            placeholder="paciente@email.com"
            className={inputCls(!!errors.email)}
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? 'email-error' : undefined}
            autoComplete="email"
            inputMode="email"
          />
        </Field>

        <Field
          label={
            <span className="inline-flex items-center gap-2">
              WhatsApp
              <span
                className="text-[10px] uppercase tracking-[0.16em]
                           text-[#00D9C0] bg-[#00D9C0]/10 border border-[#00D9C0]/20
                           px-1.5 py-0.5 rounded"
              >
                emergência
              </span>
            </span>
          }
          required
          error={errors.waId?.message}
          htmlFor="waId"
          hint={
            !errors.waId && (
              <>
                Canal de contato fora do app — usado <strong>apenas</strong> em
                casos clínicos críticos. Não enviamos mensagens automatizadas.
              </>
            )
          }
        >
          <div className="relative">
            <Phone
              size={16}
              strokeWidth={1.5}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9AA8A8] pointer-events-none"
            />
            <Controller
              control={control}
              name="waId"
              render={({ field }) => (
                <input
                  id="waId"
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel"
                  value={formatCelular(field.value ?? '')}
                  onChange={(e) =>
                    field.onChange(e.target.value.replace(/\D/g, ''))
                  }
                  onBlur={field.onBlur}
                  placeholder="21 99102 6185"
                  className={`${inputCls(!!errors.waId)} pl-9`}
                  aria-invalid={!!errors.waId}
                  aria-describedby={errors.waId ? 'waId-error' : undefined}
                />
              )}
            />
          </div>
        </Field>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <Field
            label="CPF"
            error={errors.cpf?.message}
            htmlFor="cpf"
            hint={!errors.cpf && 'opcional'}
          >
            <Controller
              control={control}
              name="cpf"
              render={({ field }) => (
                <input
                  id="cpf"
                  inputMode="numeric"
                  autoComplete="off"
                  value={formatCpf(field.value ?? '')}
                  onChange={(e) =>
                    field.onChange(e.target.value.replace(/\D/g, ''))
                  }
                  onBlur={field.onBlur}
                  placeholder="000.000.000-00"
                  className={`${inputCls(!!errors.cpf)}`}
                  aria-invalid={!!errors.cpf}
                  aria-describedby={errors.cpf ? 'cpf-error' : undefined}
                />
              )}
            />
          </Field>
          <Field
            label="Data de nascimento"
            error={errors.dataNascimento?.message}
            htmlFor="dataNascimento"
            hint={!errors.dataNascimento && 'opcional'}
          >
            <input
              id="dataNascimento"
              type="date"
              {...register('dataNascimento')}
              max={new Date().toISOString().slice(0, 10)}
              className={inputCls(!!errors.dataNascimento)}
              aria-invalid={!!errors.dataNascimento}
              aria-describedby={
                errors.dataNascimento ? 'dataNascimento-error' : undefined
              }
            />
          </Field>
        </div>

        {modo === 'senha' ? <BlocoSenhaProvisoria /> : <BlocoMagicLink />}

        {erroGlobal && (
          <div
            role="alert"
            className="flex gap-3 items-start p-4 bg-red-500/100/10
                       border border-red-500/30 rounded-xl text-sm text-red-200"
          >
            <AlertCircle size={18} className="shrink-0 mt-0.5" />
            <p>{erroGlobal}</p>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 pt-2 border-t border-[#00D9C0]/[0.08]">
          <button
            type="submit"
            disabled={isSubmitting || !isValid}
            className="group relative inline-flex justify-center items-center gap-2
                       px-6 py-3 rounded-xl bg-[#00D9C0] text-[#0A0E0E] font-medium tracking-tight
                       transition-all duration-300 hover:bg-[#00D9C0]/90
                       disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <span>
              {isSubmitting
                ? 'Cadastrando…'
                : modo === 'senha'
                  ? 'Cadastrar e entregar senha'
                  : 'Enviar convite por email'}
            </span>
          </button>
          <Link
            href="/dashboard/pacientes"
            className="inline-flex justify-center items-center px-6 py-3 rounded-xl
                       border border-[#00D9C0]/[0.12] text-sm text-[#9AA8A8]
                       hover:text-[#F5F7F7] hover:border-[#00D9C0]/30 transition-colors"
          >
            Cancelar
          </Link>
        </div>
      </form>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// Input base — variação por estado de validação
// ═══════════════════════════════════════════════════════════════════════════

function inputCls(hasError: boolean) {
  const base =
    'w-full px-3 py-2.5 bg-[#0A0E0E] border rounded-lg text-sm text-[#F5F7F7] ' +
    'placeholder:text-[#9AA8A8]/60 transition-all duration-200 focus:outline-none ' +
    'focus:ring-2'
  return hasError
    ? `${base} border-red-500/40 focus:border-red-500/60 focus:ring-red-500/15`
    : `${base} border-[#00D9C0]/[0.12] focus:border-[#00D9C0]/40 focus:ring-[#00D9C0]/20`
}

// ═══════════════════════════════════════════════════════════════════════════
// Field — label + input + hint/erro
// ═══════════════════════════════════════════════════════════════════════════

function Field({
  label,
  required,
  hint,
  error,
  htmlFor,
  children,
}: {
  label: React.ReactNode
  required?: boolean
  hint?: React.ReactNode
  error?: string
  htmlFor: string
  children: React.ReactNode
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="block text-[12px] font-medium tracking-wide text-[#9AA8A8] mb-2">
        {label}
        {required && <span className="text-[#00D9C0] ml-1">*</span>}
      </label>
      {children}
      {error ? (
        <p
          id={`${htmlFor}-error`}
          role="alert"
          className="mt-1.5 flex items-start gap-1.5 text-xs text-red-300 leading-relaxed"
        >
          <AlertCircle size={12} strokeWidth={2} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </p>
      ) : (
        hint && (
          <p className="mt-1.5 text-xs text-[#9AA8A8] leading-relaxed">{hint}</p>
        )
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// Tab card
// ═══════════════════════════════════════════════════════════════════════════

function TabCard({
  numero,
  icon,
  titulo,
  subtitulo,
  ativo,
  onClick,
}: {
  numero: string
  icon: React.ReactNode
  titulo: string
  subtitulo: string
  ativo: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={ativo}
      onClick={onClick}
      className={`relative text-left p-5 rounded-2xl border transition-all duration-300
                  group overflow-hidden
                  ${
                    ativo
                      ? 'border-[#00D9C0]/40 bg-[#00D9C0]/10'
                      : 'border-[#00D9C0]/[0.08] bg-[#111818] hover:border-[#00D9C0]/25 hover:bg-[#111818]'
                  }`}
    >
      <span
        aria-hidden
        className={`absolute left-0 top-3 bottom-3 w-[2px] rounded-r bg-[#00D9C0]
                    transition-all duration-500 origin-top
                    ${ativo ? 'scale-y-100 opacity-100' : 'scale-y-0 opacity-0'}`}
      />

      <div className="flex items-start justify-between mb-3">
        <span
          className={`text-[11px] tracking-[0.2em] uppercase
                      ${ativo ? 'text-[#00D9C0]' : 'text-[#9AA8A8]'}`}
        >
          {numero}
        </span>
        <span
          className={`p-2 rounded-full transition-colors
                      ${
                        ativo
                          ? 'bg-[#00D9C0] text-[#0A0E0E]'
                          : 'bg-[#0A0E0E] text-[#9AA8A8] group-hover:text-[#F5F7F7]'
                      }`}
        >
          {icon}
        </span>
      </div>

      <h3
        className={`font-bold tracking-tight text-xl leading-tight mb-1
                    ${ativo ? 'text-[#F5F7F7]' : 'text-[#D0D5D5]'}`}
      >
        {titulo}
      </h3>
      <p className="text-xs text-[#9AA8A8] leading-relaxed">{subtitulo}</p>
    </button>
  )
}

function BlocoMagicLink() {
  return (
    <div
      className="relative border-l-2 border-[#00D9C0]/30 pl-4 py-1 text-sm text-[#D0D5D5]
                 leading-relaxed"
    >
      <p className="text-[12px] font-medium tracking-wide text-[#9AA8A8] mb-2 text-[#00D9C0]">O que acontece em seguida</p>
      <ol className="space-y-1 text-sm">
        <li>
          <span className="text-xs text-[#9AA8A8] mr-2">01.</span>
          Paciente recebe email com link único de primeiro acesso.
        </li>
        <li>
          <span className="text-xs text-[#9AA8A8] mr-2">02.</span>
          Ao clicar, define a própria senha e instala o app.
        </li>
        <li>
          <span className="text-xs text-[#9AA8A8] mr-2">03.</span>
          Link expira em <em className="italic">24 horas</em>.
        </li>
      </ol>
    </div>
  )
}

function BlocoSenhaProvisoria() {
  function copiarSenha() {
    navigator.clipboard.writeText(SENHA_PROVISORIA)
  }

  return (
    <div className="rounded-2xl border border-[#00D9C0]/30 bg-[#00D9C0]/10 overflow-hidden">
      <div className="px-5 py-4 border-b border-[#00D9C0]/20 bg-[#00D9C0]/[0.06]">
        <p className="text-[12px] font-medium tracking-wide text-[#9AA8A8] text-[#00D9C0] flex items-center gap-2">
          <KeyRound size={12} strokeWidth={2} />
          Senha provisória
        </p>
      </div>

      <div className="px-5 py-5 space-y-4">
        <div className="flex items-stretch gap-2">
          <div className="flex-1 relative">
            <input
              readOnly
              value={SENHA_PROVISORIA}
              aria-label="Senha provisória"
              className="w-full px-4 py-3 bg-[#0A0E0E] border border-[#00D9C0]/30
                         rounded-lg text-base text-[#F5F7F7] tracking-wider
                         cursor-default select-all"
            />
            <span
              aria-hidden
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px]
                         uppercase tracking-[0.18em] text-[#00D9C0]/60
                         bg-[#0A0E0E] px-1.5"
            >
              fixa
            </span>
          </div>
          <button
            type="button"
            onClick={copiarSenha}
            className="px-4 py-3 rounded-lg bg-[#00D9C0] text-[#0A0E0E] text-sm
                       font-medium inline-flex items-center gap-1.5
                       hover:bg-[#00D9C0]/90 transition-colors"
          >
            <Copy size={14} strokeWidth={2} />
            Copiar
          </button>
        </div>

        <p className="text-sm text-[#D0D5D5] leading-relaxed">
          Diga ao paciente:{' '}
          <code className="px-1.5 py-0.5 bg-[#0A0E0E] border border-[#00D9C0]/20 rounded text-[#00D9C0]">
            {SENHA_PROVISORIA}
          </code>{' '}
          <span className="text-[#9AA8A8]">(todas as letras minúsculas).</span>{' '}
          Anote num post-it ou imprima — a secretária pode usar essa mesma
          senha em todos os cadastros do consultório.
        </p>

        <div className="flex items-start gap-2 p-3 rounded-lg bg-[#0A0E0E] border border-[#00D9C0]/20">
          <ShieldAlert
            size={16}
            strokeWidth={1.5}
            className="text-[#00D9C0] shrink-0 mt-0.5"
          />
          <p className="text-xs text-[#D0D5D5] leading-relaxed">
            O sistema vai{' '}
            <strong>obrigar o paciente a trocar essa senha</strong> no primeiro
            acesso. Não envie por canal aberto (WhatsApp público, SMS) — entregue
            em mãos ou na consulta.
          </p>
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// Tela de sucesso
// ═══════════════════════════════════════════════════════════════════════════

function SucessoView({
  resultado,
  email,
  onNovo,
}: {
  resultado: Resultado
  email: string
  onNovo: () => void
}) {
  const isSenhaProvisoria = resultado.modo === 'senha_provisoria'

  return (
    <div className="px-6 sm:px-10 py-10 max-w-2xl mx-auto animate-rise">
      <div className="mb-6 flex items-center gap-3 text-[12px] font-medium tracking-wide text-[#9AA8A8]">
        <Check size={14} strokeWidth={2} className="text-[#00D9C0]" />
        Paciente cadastrado
      </div>

      <h1 className="font-bold tracking-tight text-4xl sm:text-5xl text-[#F5F7F7] leading-[0.95] mb-2">
        Tudo pronto<span className="italic text-[#00D9C0]">.</span>
      </h1>
      <p className="text-sm text-[#9AA8A8] mb-8">
        {isSenhaProvisoria
          ? 'Entregue as credenciais abaixo ao paciente. A senha será trocada no primeiro acesso.'
          : 'O paciente receberá o convite por email em alguns segundos.'}
      </p>

      {isSenhaProvisoria ? (
        <CredenciaisCard email={email} senha={resultado.senhaProvisoria!} />
      ) : resultado.emailEnviado ? (
        <EmailEnviadoCard email={email} />
      ) : (
        <MagicLinkFallbackCard
          link={resultado.magicLinkUrl}
          erro={resultado.emailErro}
        />
      )}

      <div className="flex flex-col sm:flex-row gap-3 mt-8">
        <Link
          href={`/dashboard/pacientes/${resultado.pacienteId}`}
          className="inline-flex justify-center items-center px-6 py-3 rounded-xl
                     bg-[#00D9C0] text-[#0A0E0E] font-medium text-sm
                     hover:bg-[#00D9C0]/90 transition-all"
        >
          Abrir prontuário
        </Link>
        <button
          onClick={onNovo}
          className="inline-flex justify-center items-center px-6 py-3 rounded-xl
                     border border-[#00D9C0]/[0.12] text-sm text-[#9AA8A8]
                     hover:text-[#F5F7F7] hover:border-[#00D9C0]/30 transition-colors"
        >
          Cadastrar outro
        </button>
      </div>
    </div>
  )
}

function EmailEnviadoCard({ email }: { email: string }) {
  return (
    <div className="rounded-2xl border border-[#00D9C0]/30 bg-[#00D9C0]/10 p-6">
      <p className="text-[12px] font-medium tracking-wide text-[#9AA8A8] text-[#00D9C0] mb-3 flex items-center gap-2">
        <Mail size={12} strokeWidth={2} />
        Convite enviado
      </p>
      <p className="text-sm text-[#D0D5D5] leading-relaxed">
        Email com link de primeiro acesso foi entregue
        {email ? (
          <>
            {' '}para <strong className="text-[#F5F7F7]">{email}</strong>
          </>
        ) : null}
        . O paciente pode levar até alguns minutos pra receber. Link vale por{' '}
        <em className="italic">24 horas</em>.
      </p>
    </div>
  )
}

function MagicLinkFallbackCard({
  link,
  erro,
}: {
  link: string | null
  erro: string | null
}) {
  return (
    <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 overflow-hidden">
      <div className="px-5 py-4 border-b border-amber-500/20">
        <p className="text-[12px] font-medium tracking-wide text-[#9AA8A8] text-amber-200 flex items-center gap-2">
          <AlertCircle size={12} strokeWidth={2} />
          Paciente criado, mas o email falhou
        </p>
      </div>
      <div className="px-5 py-5 space-y-4">
        <p className="text-sm text-amber-200 leading-relaxed">
          Erro técnico:{' '}
          <code className="px-1.5 py-0.5 rounded bg-amber-500/15 border border-amber-500/20 text-xs">
            {erro ?? 'desconhecido'}
          </code>
        </p>
        <p className="text-sm text-[#D0D5D5]">
          Copie o link abaixo e envie ao paciente por outro canal:
        </p>
        <div className="flex gap-2">
          <input
            readOnly
            value={link ?? ''}
            className="flex-1 px-3 py-2.5 rounded-lg border border-amber-500/30
                       bg-[#0A0E0E] text-xs"
          />
          <button
            onClick={() => navigator.clipboard.writeText(link ?? '')}
            className="px-4 py-2.5 rounded-lg bg-[#00D9C0] text-[#0A0E0E] text-sm
                       inline-flex items-center gap-1.5 hover:bg-[#00D9C0]/90
                       transition-colors"
          >
            <Copy size={14} /> Copiar
          </button>
        </div>
      </div>
    </div>
  )
}

function CredenciaisCard({
  email,
  senha,
}: {
  email: string
  senha: string
}) {
  function copiarTudo() {
    navigator.clipboard.writeText(
      `Email: ${email}\nSenha provisória: ${senha}`,
    )
  }

  return (
    <div className="rounded-2xl border border-[#00D9C0]/30 bg-[#00D9C0]/10 overflow-hidden">
      <div className="px-5 py-4 border-b border-[#00D9C0]/20 bg-[#00D9C0]/[0.06] flex items-center justify-between">
        <p className="text-[12px] font-medium tracking-wide text-[#9AA8A8] text-[#00D9C0] flex items-center gap-2">
          <KeyRound size={12} strokeWidth={2} />
          Credenciais provisórias
        </p>
        <button
          onClick={copiarTudo}
          className="text-[11px] uppercase tracking-[0.16em]
                     text-[#00D9C0] hover:text-[#00D9C0] inline-flex items-center gap-1.5"
        >
          <Copy size={11} strokeWidth={2} /> Copiar tudo
        </button>
      </div>

      <dl className="divide-y divide-[#00D9C0]/20">
        {email && (
          <div className="px-5 py-4 grid grid-cols-[110px_1fr] items-center">
            <dt className="text-[12px] font-medium tracking-wide text-[#9AA8A8]">Email</dt>
            <dd className="text-sm text-[#F5F7F7]">{email}</dd>
          </div>
        )}
        <div className="px-5 py-4 grid grid-cols-[110px_1fr] items-center">
          <dt className="text-[12px] font-medium tracking-wide text-[#9AA8A8]">Senha</dt>
          <dd className="text-base text-[#F5F7F7] tracking-wider">
            {senha}
          </dd>
        </div>
      </dl>

      <div className="px-5 py-4 border-t border-[#00D9C0]/20 bg-[#00D9C0]/10 flex items-start gap-2">
        <ShieldAlert
          size={14}
          strokeWidth={1.5}
          className="text-[#00D9C0] shrink-0 mt-0.5"
        />
        <p className="text-xs text-[#D0D5D5] leading-relaxed">
          Entregue ao paciente em mãos. No primeiro acesso, ele será obrigado a
          definir uma senha pessoal.
        </p>
      </div>
    </div>
  )
}
