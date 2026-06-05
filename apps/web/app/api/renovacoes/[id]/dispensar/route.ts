import { NextResponse } from "next/server"
import { gateway, gatewayErrorResponse } from "@/lib/gateway"

// Médico decidiu não renovar (ex.: medicação suspensa) → dispensa a renovação.
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await gateway.post(`/api/v1/renovacoes/${id}/dispensar`, {})
    return new NextResponse(null, { status: 204 })
  } catch (err) {
    return gatewayErrorResponse(err)
  }
}
