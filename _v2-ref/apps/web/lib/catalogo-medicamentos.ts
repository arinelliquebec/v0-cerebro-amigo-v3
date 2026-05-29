'use client'

import { useEffect, useState } from 'react'

// =============================================================================
// Tipos mantidos pra compatibilidade com manager.tsx
// =============================================================================

export type CategoriaMedicamento =
  | 'antidepressivo_ssri'
  | 'antidepressivo_snri'
  | 'antidepressivo_outros'
  | 'antipsicotico'
  | 'estabilizador_humor'
  | 'benzodiazepinico'
  | 'hipnotico'
  | 'opioide'
  | 'estimulante'

export type ReceitaTipo = 'comum' | 'C1' | 'B1' | 'B2'

export type Medicamento = {
  id?: string
  nome: string
  principioAtivo?: string
  apresentacoes: string[]
  doseSugerida: string
  horariosSugeridos: string[]
  receitaTipo: ReceitaTipo
  categoria: CategoriaMedicamento
  avisos?: string[]
  indicacoes?: string
  registroAnvisa?: string
}

export const CATEGORIAS: Record<CategoriaMedicamento, { titulo: string; descricao: string; ordem: number }> = {
  antidepressivo_ssri: { titulo: 'Antidepressivos SSRI', descricao: 'Inibidores seletivos da recaptação de serotonina', ordem: 1 },
  antidepressivo_snri: { titulo: 'Antidepressivos SNRI', descricao: 'Inibidores de serotonina e noradrenalina', ordem: 2 },
  antidepressivo_outros: { titulo: 'Outros Antidepressivos', descricao: 'NDRI, NaSSA, tricíclicos e atípicos', ordem: 3 },
  antipsicotico: { titulo: 'Antipsicóticos', descricao: 'Atípicos e típicos', ordem: 4 },
  estabilizador_humor: { titulo: 'Estabilizadores de Humor', descricao: 'Anticonvulsivantes em uso psiquiátrico', ordem: 5 },
  benzodiazepinico: { titulo: 'Benzodiazepínicos', descricao: 'Ansiolíticos e sedativos', ordem: 6 },
  hipnotico: { titulo: 'Hipnóticos', descricao: 'Z-drugs e indutores do sono', ordem: 7 },
  opioide: { titulo: 'Opióides', descricao: 'Analgesia controlada', ordem: 8 },
  estimulante: { titulo: 'Estimulantes', descricao: 'Tratamento de TDAH', ordem: 9 },
}

// =============================================================================
// DTO do backend
// =============================================================================

type DbMedicamento = {
  id: string
  nomeComercial: string | null
  nomeGenerico: string
  classeTerapeutica: string
  indicacoesResumo: string | null
  dosagens: string[]
  formasFarmaceuticas: string[]
  registroAnvisa: string | null
  laboratorio: string | null
  observacoes: string | null
  emDestaque: boolean
}

// =============================================================================
// Mapeamento DB → Medicamento (TS)
// =============================================================================

function mapClasseToCategoria(classe: string): CategoriaMedicamento {
  const c = classe.toLowerCase()
  if (c === 'isrs') return 'antidepressivo_ssri'
  if (c === 'irsn') return 'antidepressivo_snri'
  if (c.includes('antidepressivo')) return 'antidepressivo_outros'
  if (c.includes('antipsicótico')) return 'antipsicotico'
  if (c.includes('estabilizador') || c.includes('anticonvulsivante')) return 'estabilizador_humor'
  if (c.includes('benzodiazepínico') || c.includes('benzodiazepinico')) return 'benzodiazepinico'
  if (c.includes('hipnótico') || c.includes('sono')) return 'hipnotico'
  if (c.includes('estimulante') || c.includes('tdah')) return 'estimulante'
  if (c.includes('opioide') || c.includes('opióide')) return 'opioide'
  return 'antidepressivo_outros'
}

function mapObservacoesToReceitaTipo(obs: string | null): ReceitaTipo {
  if (!obs) return 'comum'
  const o = obs.toLowerCase()
  if (o.includes('a3') || o.includes('amarela')) return 'C1' // amarela = controlada
  if (o.includes('b2')) return 'B2'
  if (o.includes('b1') || o.includes('azul')) return 'B1'
  if (o.includes('c1')) return 'C1'
  return 'comum'
}

function defaultHorarios(categoria: CategoriaMedicamento): string[] {
  // Sugestões clínicas razoáveis
  if (categoria === 'hipnotico' || categoria === 'benzodiazepinico') return ['22:00']
  if (categoria === 'estimulante') return ['08:00']
  if (categoria === 'antipsicotico' || categoria === 'estabilizador_humor') return ['22:00']
  return ['08:00']
}

function defaultDose(med: DbMedicamento, categoria: CategoriaMedicamento): string {
  const dose = med.dosagens[0] ?? ''
  if (categoria === 'hipnotico' || categoria === 'benzodiazepinico') {
    return `${dose} ao deitar, conforme necessidade`
  }
  if (categoria === 'estimulante') {
    return `${dose} pela manhã`
  }
  return `${dose} 1x ao dia`
}

function dbToMedicamento(m: DbMedicamento): Medicamento {
  const categoria = mapClasseToCategoria(m.classeTerapeutica)
  const nome = m.nomeComercial ?? m.nomeGenerico
  const principioAtivo = m.nomeComercial && m.nomeGenerico && m.nomeComercial !== m.nomeGenerico
    ? m.nomeGenerico
    : undefined

  const avisos: string[] = []
  if (m.observacoes) {
    const obs = m.observacoes.split(/\s*[.-]\s*/).filter((s) => s.length > 3)
    avisos.push(...obs.slice(0, 3))
  }

  return {
    id: m.id,
    nome,
    principioAtivo,
    apresentacoes: m.dosagens,
    doseSugerida: defaultDose(m, categoria),
    horariosSugeridos: defaultHorarios(categoria),
    receitaTipo: mapObservacoesToReceitaTipo(m.observacoes),
    categoria,
    avisos: avisos.length > 0 ? avisos : undefined,
    indicacoes: m.indicacoesResumo ?? undefined,
    registroAnvisa: m.registroAnvisa ?? undefined,
  }
}

// =============================================================================
// Hook que busca + agrupa por categoria (substitui catalogoAgrupado() antigo)
// =============================================================================

type GrupoCatalogo = {
  categoria: CategoriaMedicamento
  titulo: string
  descricao: string
  items: Medicamento[]
}

export function useMedicamentos(busca: string = ''): {
  grupos: GrupoCatalogo[]
  loading: boolean
  erro: string | null
} {
  const [grupos, setGrupos] = useState<GrupoCatalogo[]>([])
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    setErro(null)
    const termo = busca.trim()
    const url = termo
      ? `/api/medicamentos?q=${encodeURIComponent(termo)}&limit=50`
      : `/api/medicamentos?limit=50`

    const ctrl = new AbortController()
    fetch(url, { signal: ctrl.signal })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('Falha ao buscar'))))
      .then((items: DbMedicamento[]) => {
        const medicamentos = items.map(dbToMedicamento)
        const mapaGrupos = new Map<CategoriaMedicamento, Medicamento[]>()
        for (const m of medicamentos) {
          if (!mapaGrupos.has(m.categoria)) mapaGrupos.set(m.categoria, [])
          mapaGrupos.get(m.categoria)!.push(m)
        }
        const result: GrupoCatalogo[] = Array.from(mapaGrupos.entries())
          .map(([cat, items]) => ({
            categoria: cat,
            titulo: CATEGORIAS[cat].titulo,
            descricao: CATEGORIAS[cat].descricao,
            items: items.sort((a, b) => a.nome.localeCompare(b.nome)),
          }))
          .sort((a, b) => CATEGORIAS[a.categoria].ordem - CATEGORIAS[b.categoria].ordem)
        setGrupos(result)
      })
      .catch((e) => {
        if (e.name !== 'AbortError') setErro(e.message)
      })
      .finally(() => setLoading(false))

    return () => ctrl.abort()
  }, [busca])

  return { grupos, loading, erro }
}

// =============================================================================
// Função legacy mantida pra evitar quebra de imports (retorna vazio)
// Manager.tsx deve migrar pra useMedicamentos(busca).
// =============================================================================

export function catalogoAgrupado(): GrupoCatalogo[] {
  console.warn('catalogoAgrupado() está deprecado. Use o hook useMedicamentos(busca).')
  return []
}
