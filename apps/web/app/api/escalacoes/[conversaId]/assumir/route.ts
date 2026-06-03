import { NextRequest, NextResponse } from "next/server"
import { gateway, GatewayError } from "@/lib/gateway"

// Médico assume a conversa escalada e a devolve ao fluxo.
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ conversaId: string }> },
) {
  const { conversaId } = await params
  try {
    await gateway.post(`/api/v1/escalacoes/${conversaId}/assumir`, {})
    return new NextResponse(null, { status: 204 })
  } catch (err) {
    if (err instanceof GatewayError) {
      return NextResponse.json({ error: err.body }, { status: err.status })
    }
    return NextResponse.json({ error: "upstream_error" }, { status: 502 })
  }
}
