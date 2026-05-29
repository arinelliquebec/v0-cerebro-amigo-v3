import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { proxyFetch, isGatewayError } from '@/lib/api-gateway'

/**
 * Proxy para marcar uma notificação como lida.
 * Recebe POST do <form action="/api/notificacoes/{id}/marcar-lida"> no
 * dashboard, repassa ao gateway com o JWT do médico e redireciona de volta
 * à página de notificações pra forçar revalidação.
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const cookieStore = await cookies()
  const token = cookieStore.get('auth_token')?.value
  if (!token) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const apiRes = await proxyFetch(`/api/v1/notificacoes/${id}/marcar-lida`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  })

  if (isGatewayError(apiRes)) return apiRes

  if (!apiRes.ok && apiRes.status !== 204) {
    const data = await apiRes.json().catch(() => ({}))
    return NextResponse.json(data, { status: apiRes.status })
  }

  const origin = new URL(req.url).origin
  return NextResponse.redirect(new URL('/dashboard/notificacoes', origin), 303)
}
