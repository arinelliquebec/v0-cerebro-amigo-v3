import { NextResponse } from "next/server"
import { gateway, gatewayErrorResponse } from "@/lib/gateway"

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const data = await gateway.get(`/api/v1/rede/chat/conversas/${encodeURIComponent(id)}`)
    return NextResponse.json(data)
  } catch (err) {
    return gatewayErrorResponse(err)
  }
}
