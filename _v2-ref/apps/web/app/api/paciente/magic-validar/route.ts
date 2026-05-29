import { NextResponse } from 'next/server'
import { proxyFetch, isGatewayError } from '@/lib/api-gateway'

export async function POST(req: Request) {
  const body = await req.json()
  const apiRes = await proxyFetch('/api/v1/auth/paciente/magic-validar', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  if (isGatewayError(apiRes)) return apiRes

  if (!apiRes.ok) {
    return NextResponse.json({ error: 'invalid_token' }, { status: apiRes.status })
  }

  const data = await apiRes.json() as { token: string }
  const res = NextResponse.json({ ok: true })
  res.cookies.set('paciente_token', data.token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
  })
  return res
}
