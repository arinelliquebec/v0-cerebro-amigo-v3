import { NextRequest, NextResponse } from "next/server"
import { gateway, GatewayError } from "@/lib/gateway"

type Ctx = { params: Promise<{ id: string }> }

export async function PATCH(req: NextRequest, { params }: Ctx) {
  const { id } = await params
  const body = await req.json().catch(() => ({}))
  try {
    await gateway.patch(`/api/v1/admin/assinaturas/${id}`, body)
    return new NextResponse(null, { status: 204 })
  } catch (err) {
    if (err instanceof GatewayError) {
      if (err.status === 404) return NextResponse.json({ error: "não encontrado" }, { status: 404 })
      if (err.status === 401 || err.status === 403)
        return NextResponse.json({ error: "não autorizado" }, { status: err.status })
    }
    return NextResponse.json({ error: "erro interno" }, { status: 500 })
  }
}

// Registrar pagamento manual
export async function POST(req: NextRequest, { params }: Ctx) {
  const { id } = await params
  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: "corpo inválido" }, { status: 400 })
  try {
    const data = await gateway.post(`/api/v1/admin/assinaturas/${id}/pagamento`, body)
    return NextResponse.json(data, { status: 201 })
  } catch (err) {
    if (err instanceof GatewayError) {
      if (err.status === 404) return NextResponse.json({ error: "não encontrado" }, { status: 404 })
      if (err.status === 401 || err.status === 403)
        return NextResponse.json({ error: "não autorizado" }, { status: err.status })
    }
    return NextResponse.json({ error: "erro interno" }, { status: 500 })
  }
}
