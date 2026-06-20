import { NextRequest } from "next/server"
import { gateway, gatewayErrorResponse } from "@/lib/gateway"

// Hub de briefings pré-consulta (/dashboard/briefings). Lista as próximas consultas
// com o status do briefing já resolvido pelo gateway numa única query.
// GET /api/briefings?de=YYYY-MM-DD&ate=YYYY-MM-DD → ConsultaBriefingItem[]
// 402 (feature_requer_pro) volta intacto via gatewayErrorResponse p/ a UI abrir o upsell.
export const GET = async (req: NextRequest) => {
  const { searchParams } = new URL(req.url)
  const qs = new URLSearchParams()
  for (const chave of ["de", "ate"] as const) {
    const valor = searchParams.get(chave)
    if (valor) qs.set(chave, valor)
  }
  const sufixo = qs.size > 0 ? `?${qs}` : ""
  try {
    const data = await gateway.get(`/api/v1/consultas/briefings${sufixo}`)
    return Response.json(data)
  } catch (err) {
    return gatewayErrorResponse(err)
  }
}
