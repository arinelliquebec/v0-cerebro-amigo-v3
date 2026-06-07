"use client"

import { useEffect, useState } from "react"

/** Perfil do médico logado — espelha GET /api/me → /api/v1/auth/me. */
export interface Me {
  medicoId: string
  nome: string
  crm: string | null
  especialidade: string | null
  usuarioId: string
  email: string
  role: string
}

// Cache de módulo: evita refetch quando vários componentes (sidebar + header)
// usam o hook na mesma navegação.
let cache: Me | null = null
let inflight: Promise<Me | null> | null = null

function buscar(): Promise<Me | null> {
  if (cache) return Promise.resolve(cache)
  if (!inflight) {
    inflight = fetch("/api/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((d: Me | null) => {
        cache = d
        return d
      })
      .catch((err) => {
        console.warn("[useMe] falha ao buscar perfil:", err)
        return null
      })
      .finally(() => {
        inflight = null
      })
  }
  return inflight
}

export function useMe(): Me | null {
  const [me, setMe] = useState<Me | null>(cache)

  useEffect(() => {
    let vivo = true
    buscar().then((d) => {
      if (vivo) setMe(d)
    })
    return () => {
      vivo = false
    }
  }, [])

  return me
}
