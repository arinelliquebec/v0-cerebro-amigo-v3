import { NextRequest, NextResponse } from "next/server"
import { gateway, GatewayError } from "@/lib/gateway"

// Condutas de automação por paciente (override operacional). Tenant via JWT.
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  try {
    const data = await gateway.get(`/api/v1/pacientes/${id}/condutas`)
    return NextResponse.json(data)
  } catch (err) {
    if (err instanceof GatewayError) {
      return NextResponse.json({ error: err.body }, { status: err.status })
    }
    return NextResponse.json({ error: "upstream_error" }, { status: 502 })
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const body = await req.json().catch(() => ({}))
  try {
    const data = await gateway.post(`/api/v1/pacientes/${id}/condutas`, body)
    return NextResponse.json(data)
  } catch (err) {
    if (err instanceof GatewayError) {
      return NextResponse.json({ error: err.body }, { status: err.status })
    }
    return NextResponse.json({ error: "upstream_error" }, { status: 502 })
  }
}
