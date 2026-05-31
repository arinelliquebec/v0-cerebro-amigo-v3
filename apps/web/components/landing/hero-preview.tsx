'use client'

import { EvolutionChart } from "@/components/dashboard/evolution-chart"
import { CheckinWidget } from "@/components/dashboard/checkin-widget"

/**
 * Preview decorativo do produto para o hero.
 * Regra estrutural: w-[540px] explícito no desktop quebra a dependência circular
 * do grid auto-column. Painel âncora em fluxo normal dá altura real ao pai.
 * pointer-events-none + aria-hidden: showcase decorativo, não focável/clicável.
 * Tokens only — zero hex.
 */
export function HeroPreview() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none select-none w-full lg:w-[540px]"
    >
      {/* Scene: relative context para o card de acento absoluto.
          pb-32 no desktop abre 128 px abaixo do painel âncora para o CheckinWidget aparecer.
          overflow-hidden previne scroll horizontal. */}
      <div className="relative overflow-hidden pb-0 lg:pb-32">

        {/* ── Painel âncora EM FLUXO NORMAL ──────────────────────────────────
            É ele que dá altura intrínseca ao scene (e portanto ao grid column).
            Nunca colocar em absolute — quebraria novamente.
            lg:mr-10 recua a borda direita para o CheckinWidget sobrepor
            sem precisar sair dos limites do container. */}
        <div
          className="relative z-20 rounded-2xl border border-border/30 bg-card p-2.5 shadow-2xl ring-1 ring-primary/10 lg:mr-10"
          style={{ transform: "rotate(-1.5deg)", transformOrigin: "top left" }}
        >
          <EvolutionChart />
        </div>

        {/* ── Card de acento — absoluto (pai já tem altura do painel âncora) ──
            bottom-0 right-0: canto inferior direito do scene.
            A sobreposição visual com o painel dá profundidade de pilha.
            Oculto em mobile (single-column layout não precisa do efeito). */}
        <div
          className="absolute bottom-0 right-0 z-30 w-[256px] hidden lg:block"
          style={{ transform: "rotate(2deg)", transformOrigin: "top right" }}
        >
          <CheckinWidget />
        </div>

      </div>
    </div>
  )
}
