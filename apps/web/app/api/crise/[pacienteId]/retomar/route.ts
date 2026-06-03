import { NextRequest, NextResponse } from "next/server"
import { gateway, GatewayError } from "@/lib/gateway"

// Médico retoma a automação do paciente após avaliar a crise. Ato auditado no gateway.
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ pacienteId: string }> },
) {
  const { pacienteId } = await params
  const body = (await req.json().catch(() => ({}))) as { observacao?: string }
  try {
    await gateway.post(`/api/v1/crise/${pacienteId}/retomar`, {
      observacao: body?.observacao ?? "",
    })
    return new NextResponse(null, { status: 204 })
  } catch (err) {
    if (err instanceof GatewayError) {
      return NextResponse.json({ error: err.body }, { status: err.status })
    }
    return NextResponse.json({ error: "upstream_error" }, { status: 502 })
  }
}
