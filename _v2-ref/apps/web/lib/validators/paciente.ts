import { z } from 'zod'

// =============================================================================
// Validações reutilizáveis para cadastro de paciente
// =============================================================================
// Mantemos o schema isolado pra reuso (form + route handlers + testes).
// Mensagens são humanas e em pt-BR — é o que aparece pro médico/secretária.
// =============================================================================

/**
 * Valida CPF brasileiro com dígitos verificadores oficiais (módulo 11).
 * Aceita só dígitos (sem máscara).
 */
export function isValidCpf(cpf: string): boolean {
  const d = cpf.replace(/\D/g, '')
  if (d.length !== 11) return false
  // CPFs com todos os dígitos iguais (111.111.111-11) passam na conta mas são inválidos.
  if (/^(\d)\1+$/.test(d)) return false

  const calcDV = (slice: string, weightStart: number) => {
    let sum = 0
    for (let i = 0; i < slice.length; i++) {
      sum += parseInt(slice[i]!, 10) * (weightStart - i)
    }
    const r = 11 - (sum % 11)
    return r >= 10 ? 0 : r
  }

  return (
    calcDV(d.slice(0, 9), 10) === parseInt(d[9]!, 10) &&
    calcDV(d.slice(0, 10), 11) === parseInt(d[10]!, 10)
  )
}

/**
 * Valida celular brasileiro com DDD: 11 dígitos no formato DD9XXXXXXXX.
 * DDDs aceitos: 11–99 (mantemos permissivo; ANATEL não tem 10, 20, 23, 25... mas validar
 * a lista exata é frágil — banco já evita duplicatas).
 */
export function isValidCelularBR(raw: string): boolean {
  const d = raw.replace(/\D/g, '')
  if (d.length !== 11) return false
  const ddd = parseInt(d.slice(0, 2), 10)
  if (ddd < 11 || ddd > 99) return false
  if (d[2] !== '9') return false
  return true
}

// =============================================================================
// Schemas
// =============================================================================

// `.nullish()` = `.nullable().optional()` — aceita string vazia, null OU undefined
// como "não preenchido". O frontend manda null pra campos opcionais vazios;
// o backend pode ler como undefined. Mantemos schema tolerante a ambos.
const dataNascimentoSchema = z
  .string()
  .nullish()
  .transform((v) => (v == null || v === '' ? undefined : v))
  .refine(
    (v) => {
      if (!v) return true
      const d = new Date(v)
      return !isNaN(d.getTime())
    },
    { message: 'Data inválida' },
  )
  .refine(
    (v) => {
      if (!v) return true
      const d = new Date(v)
      const hoje = new Date()
      return d <= hoje
    },
    { message: 'Data não pode estar no futuro' },
  )
  .refine(
    (v) => {
      if (!v) return true
      const d = new Date(v)
      const idade = (Date.now() - d.getTime()) / (365.25 * 24 * 3600 * 1000)
      return idade <= 120
    },
    { message: 'Idade implausível (acima de 120 anos)' },
  )

const cpfSchema = z
  .string()
  .nullish()
  .transform((v) => (v == null ? '' : v.replace(/\D/g, '')))
  .transform((v) => (v === '' ? undefined : v))
  .refine((v) => v === undefined || isValidCpf(v), {
    message: 'CPF inválido — confira os dígitos',
  })

/**
 * Schema do formulário de novo paciente. Use no `useForm` com `zodResolver`.
 */
export const novoPacienteSchema = z.object({
  nome: z
    .string()
    .trim()
    .min(3, 'Nome muito curto')
    .max(120, 'Nome muito longo'),

  email: z
    .string()
    .trim()
    .toLowerCase()
    .email('E-mail inválido — confira o formato')
    .max(254, 'E-mail muito longo'),

  waId: z
    .string()
    .min(1, 'WhatsApp é obrigatório para emergências')
    .refine(isValidCelularBR, {
      message:
        'Celular inválido — use 11 dígitos com DDD (ex: 21 99102 6185)',
    })
    .transform((v) => v.replace(/\D/g, '')),

  cpf: cpfSchema,
  dataNascimento: dataNascimentoSchema,
})

export type NovoPacienteFormInput = z.input<typeof novoPacienteSchema>
export type NovoPacienteFormOutput = z.output<typeof novoPacienteSchema>

// =============================================================================
// Formatadores visuais (não alteram valor lógico — só display)
// =============================================================================

export function formatCpf(raw: string): string {
  const d = raw.replace(/\D/g, '').slice(0, 11)
  if (d.length <= 3) return d
  if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`
  if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`
}

export function formatCelular(raw: string): string {
  const d = raw.replace(/\D/g, '').slice(0, 11)
  if (d.length <= 2) return d
  if (d.length <= 7) return `${d.slice(0, 2)} ${d.slice(2)}`
  return `${d.slice(0, 2)} ${d.slice(2, 7)} ${d.slice(7)}`
}
