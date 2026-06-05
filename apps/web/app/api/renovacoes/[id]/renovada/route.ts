import { NextResponse } from "next/server"
import { gateway, gatewayErrorResponse } from "@/lib/gateway"

// Médico reemitiu a receita (via MEMED) → marca a renovação como concluída.
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await gateway.post(`/api/v1/renovacoes/${id}/renovada`, {})
    return new NextResponse(null, { status: 204 })
  } catch (err) {
    return gatewayErrorResponse(err)
  }
}
