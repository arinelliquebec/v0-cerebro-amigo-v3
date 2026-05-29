import { NextResponse } from 'next/server'

/**
 * Resolve a URL base do API Gateway .NET.
 *
 * - Em dev (NODE_ENV !== 'production'), aceita o fallback `http://localhost:5050`
 *   (porta publicada do api-gateway no docker-compose; 5000 costuma estar ocupada no macOS).
 * - Em produção, exige `API_GATEWAY_URL` configurada e que NÃO seja localhost,
 *   senão a função serverless da Vercel jamais consegue alcançar o backend e o
 *   fetch quebra com erro genérico 500.
 *
 * Lança `GatewayConfigError` quando a config é inválida — capturado por
 * `proxyFetch` para devolver 503 com mensagem útil ao frontend.
 */
export class GatewayConfigError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'GatewayConfigError'
  }
}

export function getGatewayUrl(): string {
  const url = process.env.API_GATEWAY_URL
  const isProd = process.env.NODE_ENV === 'production'

  if (!url) {
    if (isProd) {
      throw new GatewayConfigError(
        'API_GATEWAY_URL não configurada no ambiente de produção',
      )
    }
    return 'http://localhost:5050'
  }

  if (isProd && /^https?:\/\/(localhost|127\.0\.0\.1)/i.test(url)) {
    throw new GatewayConfigError(
      'API_GATEWAY_URL aponta para localhost em produção — funções serverless da Vercel não conseguem alcançar localhost',
    )
  }

  return url
}

/**
 * Faz fetch para o API Gateway com tratamento robusto de erros.
 *
 * - Captura erros de configuração (URL faltando / localhost em prod) → 503.
 * - Captura erros de rede (DNS, recusada, timeout) → 502.
 * - Retorna a `Response` original quando o fetch sai (sucesso ou erro HTTP).
 *
 * A resposta de erro é compatível com `NextResponse` e já vem com mensagem
 * em JSON para o frontend exibir algo útil.
 */
export async function proxyFetch(
  path: string,
  init?: RequestInit,
): Promise<Response | NextResponse> {
  let base: string
  try {
    base = getGatewayUrl()
  } catch (err) {
    if (err instanceof GatewayConfigError) {
      console.error('[api-gateway] config inválida:', err.message)
      return NextResponse.json(
        {
          error: 'gateway_misconfigured',
          message: err.message,
        },
        { status: 503 },
      )
    }
    throw err
  }

  const url = path.startsWith('http') ? path : `${base}${path}`

  try {
    return await fetch(url, {
      ...init,
      cache: 'no-store',
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[api-gateway] falha de rede:', url, message)
    return NextResponse.json(
      {
        error: 'gateway_unreachable',
        message: `não foi possível alcançar o backend: ${message}`,
      },
      { status: 502 },
    )
  }
}

/**
 * Type guard: distingue uma `Response` real de uma resposta de erro já
 * formatada pelo helper (NextResponse). Usar nas rotas para evitar tentar
 * ler `.json()` de uma resposta que já é o erro.
 */
export function isGatewayError(res: Response | NextResponse): res is NextResponse {
  return res.status === 502 || res.status === 503
}
