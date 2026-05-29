import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { getGatewayUrl } from '@/lib/api-gateway'

type Params = { params: Promise<{ id: string }> }

async function forward(method: 'GET' | 'POST', id: string) {
  const token = (await cookies()).get('auth_token')?.value
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const url = `${getGatewayUrl()}/api/v1/pacientes/${id}/resumo-pre-consulta`

  try {
    const res = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      cache: 'no-store',
    })

    const body = await res.text()
    return new NextResponse(body, {
      status: res.status,
      headers: {
        'Content-Type': res.headers.get('Content-Type') ?? 'application/json',
      },
    })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Gateway unreachable' },
      { status: 502 },
    )
  }
}

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params
  return forward('GET', id)
}

export async function POST(_req: NextRequest, { params }: Params) {
  const { id } = await params
  return forward('POST', id)
}
