import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { proxyFetch, isGatewayError } from '@/lib/api-gateway'

export async function POST(req: Request) {
  const cookieStore = await cookies()
  const token = cookieStore.get('paciente_token')?.value
  if (!token) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const body = await req.json()
  const apiRes = await proxyFetch('/api/v1/portal/paciente/diario', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  })

  if (isGatewayError(apiRes)) return apiRes

  if (!apiRes.ok) return NextResponse.json({ error: 'failed' }, { status: apiRes.status })
  const data = await apiRes.json()
  return NextResponse.json(data, { status: 201 })
}
