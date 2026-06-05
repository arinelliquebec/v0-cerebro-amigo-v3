// Tipos compartilhados da Rede Social Cérebro Amigo (médicos verificados).
// Espelham os DTOs do api-gateway (.NET serializa em camelCase).

export interface PerfilMe {
  medicoId: string
  handle: string
  nome: string
  crm: string | null
  especialidade: string | null
  bio: string | null
  fotoUrl: string | null
  capaUrl: string | null
  cidade: string | null
  instituicao: string | null
  verificado: boolean
  plano: string
  seguidores: number
  seguindo: number
  posts: number
}

export function isPremium(plano?: string): boolean {
  return plano === "pro" || plano === "enterprise"
}

export interface PerfilPublico extends Omit<PerfilMe, "crm"> {
  seguindoEu: boolean
  souEu: boolean
}

export interface Comunidade {
  id: string
  nome: string
  slug: string
  descricao: string | null
  especialidade: string | null
}

export interface Sugestao {
  medicoId: string
  handle: string
  nome: string
  especialidade: string | null
  fotoUrl: string | null
  verificado: boolean
  seguidores: number
}

export interface Post {
  id: string
  corpo: string
  criadoEm: string
  autorId: string
  autorHandle: string
  autorNome: string
  autorFoto: string | null
  autorEspecialidade: string | null
  autorVerificado: boolean
  comunidadeNome: string | null
  comunidadeSlug: string | null
  curtidas: number
  comentarios: number
  curtido: boolean
  meu: boolean
  midias?: string | null
}

export interface Comentario {
  id: string
  corpo: string
  criadoEm: string
  parentId: string | null
  autorId: string
  autorHandle: string
  autorNome: string
  autorFoto: string | null
  autorVerificado: boolean
}

// URLs de exibição das fotos de um post. `midias` vem do feed como JSON
// (string) tipo [{tipo:"foto", key:"posts/..."}]; servimos via BFF /api/rede/midia.
export function fotosDoPost(midias?: string | null): string[] {
  if (!midias) return []
  try {
    const arr = JSON.parse(midias) as Array<{ tipo?: string; key?: string }>
    return arr.filter((m) => m?.key).map((m) => `/api/rede/midia/${m.key}`)
  } catch {
    return []
  }
}

export function iniciais(nome?: string | null): string {
  if (!nome) return "·"
  const partes = nome.trim().split(/\s+/).filter(Boolean)
  const ini = (partes[0]?.[0] ?? "") + (partes.length > 1 ? partes[partes.length - 1][0] : "")
  return ini.toUpperCase() || "·"
}
