import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { proxyFetch, isGatewayError } from '@/lib/api-gateway'

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params
  const cookieStore = await cookies()
  const token = cookieStore.get('auth_token')?.value
  if (!token) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const apiRes = await proxyFetch(`/api/v1/prescricoes/paciente/${id}/historico`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  })
  if (isGatewayError(apiRes)) return apiRes

  const data = await apiRes.json().catch(() => [])
  return NextResponse.json(data, { status: apiRes.status })
}
