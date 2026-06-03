import { NextRequest, NextResponse } from "next/server"
import { gateway, GatewayError } from "@/lib/gateway"

// Marca um insight como visto. Tenant é resolvido no gateway pelo JWT do médico.
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  try {
    await gateway.post(`/api/v1/insights/${id}/visualizar`, {})
    return new NextResponse(null, { status: 204 })
  } catch (err) {
    if (err instanceof GatewayError) {
      return NextResponse.json({ error: err.body }, { status: err.status })
    }
    return NextResponse.json({ error: "upstream_error" }, { status: 502 })
  }
}
