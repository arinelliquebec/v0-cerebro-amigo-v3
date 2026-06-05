import { NextRequest, NextResponse } from "next/server"
import { gateway, gatewayErrorResponse } from "@/lib/gateway"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const pagina = req.nextUrl.searchParams.get("pagina") ?? "0"
    const data = await gateway.get(
      `/api/v1/rede/chat/conversas/${encodeURIComponent(id)}/mensagens?pagina=${pagina}`
    )
    return NextResponse.json(data)
  } catch (err) {
    return gatewayErrorResponse(err)
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await req.json()
    const data = await gateway.post(
      `/api/v1/rede/chat/conversas/${encodeURIComponent(id)}/mensagens`,
      body
    )
    return NextResponse.json(data, { status: 201 })
  } catch (err) {
    return gatewayErrorResponse(err)
  }
}
