import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { z } from 'zod'
import { proxyFetch, isGatewayError } from '@/lib/api-gateway'

const schema = z.object({
  senhaAtual: z.string().min(1),
  novaSenha: z.string().min(8),
})

export async function POST(req: Request) {
  const cookieStore = await cookies()
  const token = cookieStore.get('paciente_token')?.value
  if (!token) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid' }, { status: 400 })
  }

  const apiRes = await proxyFetch('/api/v1/auth/paciente/senha', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(parsed.data),
  })

  if (isGatewayError(apiRes)) return apiRes

  if (apiRes.status === 204) return NextResponse.json({ ok: true })

  if (apiRes.status === 401) {
    return NextResponse.json({ error: 'senha_atual_incorreta' }, { status: 401 })
  }
  if (apiRes.status === 400) {
    const j = (await apiRes.json().catch(() => ({}))) as { error?: string }
    return NextResponse.json({ error: j.error ?? 'invalid' }, { status: 400 })
  }
  return NextResponse.json({ error: 'falha' }, { status: 500 })
}
