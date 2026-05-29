import { cookies } from 'next/headers'
import { getGatewayUrl } from './api-gateway'

/**
 * Faz fetch autenticado pra API gateway .NET.
 * Use somente em Server Components ou Route Handlers.
 *
 * Lança Error em qualquer falha (rede, config, status != 2xx) — use try/catch
 * no chamador (ex: Server Components que mostram fallback UI).
 */
export async function fetchApi<T>(path: string, init?: RequestInit): Promise<T> {
  const cookieStore = await cookies()
  const token = cookieStore.get('auth_token')?.value
  const apiUrl = getGatewayUrl()

  let res: Response
  try {
    res = await fetch(`${apiUrl}${path}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(init?.headers ?? {}),
      },
      cache: 'no-store',
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    throw new Error(`API_UNREACHABLE ${path}: ${message}`)
  }

  if (!res.ok) {
    throw new Error(`API ${res.status}: ${path}`)
  }
  return res.json() as Promise<T>
}
