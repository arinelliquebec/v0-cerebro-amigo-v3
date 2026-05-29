import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { getGatewayUrl } from '@/lib/api-gateway'

export async function GET(req: Request) {
  const token = (await cookies()).get('auth_token')?.value
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const url = new URL(req.url)
  const qs = url.searchParams.toString()
  const upstream = `${getGatewayUrl()}/api/v1/medicamentos${qs ? '?' + qs : ''}`

  const res = await fetch(upstream, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  })
  const body = await res.text()
  return new NextResponse(body, {
    status: res.status,
    headers: { 'Content-Type': 'application/json' },
  })
}
