import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { proxyFetch, isGatewayError } from '@/lib/api-gateway'

type RouteParams = { params: Promise<{ id: string }> }

async function getToken() {
  const cookieStore = await cookies()
  return cookieStore.get('paciente_token')?.value ?? null
}

export async function GET(_req: Request, { params }: RouteParams) {
  const token = await getToken()
  if (!token) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const { id } = await params

  const apiRes = await proxyFetch(`/api/v1/portal/paciente/diario/${id}`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  })

  if (isGatewayError(apiRes)) return apiRes
  if (apiRes.status === 404) return NextResponse.json({ error: 'not_found' }, { status: 404 })
  if (!apiRes.ok) return NextResponse.json({ error: 'failed' }, { status: apiRes.status })

  const data = await apiRes.json()
  return NextResponse.json(data)
}

export async function PATCH(req: Request, { params }: RouteParams) {
  const token = await getToken()
  if (!token) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const { id } = await params
  const body = await req.json()

  const apiRes = await proxyFetch(`/api/v1/portal/paciente/diario/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  })

  if (isGatewayError(apiRes)) return apiRes
  if (apiRes.status === 404) return NextResponse.json({ error: 'not_found' }, { status: 404 })
  if (!apiRes.ok) return NextResponse.json({ error: 'failed' }, { status: apiRes.status })

  return new NextResponse(null, { status: 204 })
}

export async function DELETE(_req: Request, { params }: RouteParams) {
  const token = await getToken()
  if (!token) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const { id } = await params

  const apiRes = await proxyFetch(`/api/v1/portal/paciente/diario/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  })

  if (isGatewayError(apiRes)) return apiRes
  if (!apiRes.ok) return NextResponse.json({ error: 'failed' }, { status: apiRes.status })

  return new NextResponse(null, { status: 204 })
}
