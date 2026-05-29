import { NextResponse } from 'next/server'
import { z } from 'zod'
import { proxyFetch, isGatewayError } from '@/lib/api-gateway'

const schema = z.object({
  email: z.string().email(),
  senha: z.string().min(1),
})

export async function POST(req: Request) {
  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid' }, { status: 400 })
  }

  const apiRes = await proxyFetch('/api/v1/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(parsed.data),
  })

  if (isGatewayError(apiRes)) return apiRes

  // 409 → email pertence ao outro portal (paciente). Propaga corpo do gateway
  // pra o cliente conseguir mostrar um link de "ir para o portal correto".
  if (apiRes.status === 409) {
    const data = await apiRes.json().catch(() => ({}))
    return NextResponse.json(data, { status: 409 })
  }

  if (!apiRes.ok) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const data = await apiRes.json() as { token: string; nome: string; role: string }

  const res = NextResponse.json({ ok: true, nome: data.nome, role: data.role })
  res.cookies.set('auth_token', data.token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 8,
    path: '/',
  })
  return res
}
