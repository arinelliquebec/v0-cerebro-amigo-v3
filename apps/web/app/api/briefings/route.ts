import { NextRequest, NextResponse } from "next/server"
import { gateway, GatewayError } from "@/lib/gateway"

// Hub de briefings pré-consulta (/dashboard/briefings). Lista as próximas consultas
// com o status do briefing já resolvido pelo gateway numa única query.
// GET /api/briefings?de=YYYY-MM-DD&ate=YYYY-MM-DD → ConsultaBriefingItem[]
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const de = searchParams.get("de")
  const ate = searchParams.get("ate")
  const qs = new URLSearchParams()
  if (de) qs.set("de", de)
  if (ate) qs.set("ate", ate)
  const suffix = qs.toString() ? `?${qs}` : ""
  try {
    const data = await gateway.get(`/api/v1/consultas/briefings${suffix}`)
    return NextResponse.json(data)
  } catch (err) {
    if (err instanceof GatewayError) {
      // 402 = feature_requer_pro (ADR-059): briefing IA. Repassa p/ a UI abrir upsell.
      if (err.status === 402) return NextResponse.json(err.body, { status: 402 })
      if (err.status === 401 || err.status === 403)
        return NextResponse.json({ error: "não autorizado" }, { status: 401 })
    }
    return NextResponse.json({ error: "erro interno" }, { status: 500 })
  }
}
