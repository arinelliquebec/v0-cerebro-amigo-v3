import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { z } from 'zod'
import { proxyFetch, isGatewayError } from '@/lib/api-gateway'
import { novoPacienteSchema } from '@/lib/validators/paciente'

// Schema do payload aceito pela rota — estende o validador do form com o
// campo exclusivo do server (`senhaInicial`). `.nullish()` aceita null OU
// undefined, pra tolerar o `JSON.stringify` do frontend que serializa
// campos opcionais como null.
const requestSchema = novoPacienteSchema.extend({
  senhaInicial: z.string().min(6, 'senha provisória precisa ter ao menos 6 caracteres').nullish(),
})

function formatarErroZod(error: z.ZodError): {
  campo: string | null
  mensagem: string
} {
  // Mensagens "Expected X, received Y" do Zod são técnicas e não devem
  // chegar ao usuário. Quando uma issue vem do code `invalid_type`, traduzimos
  // pra algo entendível em pt-BR. As mensagens custom (definidas no schema)
  // passam direto.
  const issue = error.issues[0]
  if (!issue) return { campo: null, mensagem: 'dados inválidos' }
  const campo = issue.path[0]?.toString() ?? null
  if (issue.code === 'invalid_type') {
    return {
      campo,
      mensagem: campo
        ? `Campo "${campo}" está em formato inválido.`
        : 'Há um campo em formato inválido.',
    }
  }
  return { campo, mensagem: issue.message }
}

export async function POST(req: Request) {
  const cookieStore = await cookies()
  const token = cookieStore.get('auth_token')?.value
  if (!token) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const raw = await req.json()
  const parsed = requestSchema.safeParse(raw)
  if (!parsed.success) {
    const { campo, mensagem } = formatarErroZod(parsed.error)
    return NextResponse.json(
      {
        error: 'invalid',
        message: mensagem,
        campo,
        fields: parsed.error.flatten().fieldErrors,
      },
      { status: 400 },
    )
  }

  const body = parsed.data
  const apiRes = await proxyFetch('/api/v1/pacientes', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  })

  if (isGatewayError(apiRes)) return apiRes

  const rawBody = await apiRes.text()
  const data = rawBody ? safeParseJson(rawBody) : {}

  if (apiRes.status >= 500) {
    console.error(
      '[dashboard/pacientes] gateway retornou erro',
      apiRes.status,
      'body:',
      rawBody || '(vazio)',
    )
    return NextResponse.json(
      {
        error: 'gateway_error',
        message:
          (typeof data === 'object' && data && 'error' in data && typeof (data as { error: unknown }).error === 'string'
            ? (data as { error: string }).error
            : null) ??
          rawBody ??
          `backend retornou ${apiRes.status} sem detalhe`,
        upstreamStatus: apiRes.status,
      },
      { status: 502 },
    )
  }

  return NextResponse.json(data, { status: apiRes.status })
}

function safeParseJson(s: string): unknown {
  try {
    return JSON.parse(s)
  } catch {
    return { raw: s }
  }
}
