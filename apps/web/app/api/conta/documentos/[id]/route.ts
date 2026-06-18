import { NextResponse } from "next/server"
import { gateway, gatewayErrorResponse } from "@/lib/gateway"

type Ctx = { params: Promise<{ id: string }> }

// Remove um doc que o próprio médico enviou (gateway barra 'disponibilizado').
export async function DELETE(_req: Request, { params }: Ctx) {
  const { id } = await params
  try {
    await gateway.delete(`/api/v1/conta/documentos/${id}`)
    return new NextResponse(null, { status: 204 })
  } catch (e) {
    return gatewayErrorResponse(e)
  }
}
