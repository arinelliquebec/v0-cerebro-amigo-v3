import { cookies } from 'next/headers'
import { getGatewayUrl } from './api-gateway'

/**
 * Fetch autenticado pra endpoints do paciente.
 * Usa cookie `paciente_token` (httpOnly, separado do médico).
 */
export async function fetchPaciente<T>(path: string, init?: RequestInit): Promise<T> {
  const cookieStore = await cookies()
  const token = cookieStore.get('paciente_token')?.value
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
