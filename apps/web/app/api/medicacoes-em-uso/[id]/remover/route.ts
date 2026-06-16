import { NextRequest, NextResponse } from "next/server"
import { gateway, GatewayError } from "@/lib/gateway"

// Remove (desativa) uma medicação em uso. Soft-delete no gateway (mantém histórico).
export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  try {
    await gateway.post(`/api/v1/medicacoes-em-uso/${id}/remover`, {})
    return new NextResponse(null, { status: 204 })
  } catch (err) {
    if (err instanceof GatewayError) return NextResponse.json({ error: err.body }, { status: err.status })
    return NextResponse.json({ error: "upstream_error" }, { status: 502 })
  }
}
