import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { getGatewayUrl } from '@/lib/api-gateway'

type Params = { params: Promise<{ id: string }> }

export async function POST(_req: Request, { params }: Params) {
  const { id } = await params
  const token = (await cookies()).get('auth_token')?.value
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const res = await fetch(
    `${getGatewayUrl()}/api/v1/notificacoes/${id}/marcar-nao-lida`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    },
  )

  return new NextResponse(null, { status: res.status })
}
