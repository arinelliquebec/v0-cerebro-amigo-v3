import { NextRequest, NextResponse } from "next/server"
import { gateway, GatewayError } from "@/lib/gateway"

type Ctx = { params: Promise<{ id: string }> }

// Ativa cobrança recorrente do médico no Asaas (Fluxo A, ADR-034).
export async function POST(_req: NextRequest, { params }: Ctx) {
  const { id } = await params
  try {
    const data = await gateway.post(`/api/v1/admin/assinaturas/${id}/cobranca-asaas`, {})
    return NextResponse.json(data)
  } catch (err) {
    if (err instanceof GatewayError) {
      if (err.status === 503) return NextResponse.json({ error: "asaas_nao_configurado" }, { status: 503 })
      if (err.status === 400 || err.status === 409 || err.status === 502)
        return NextResponse.json(err.body ?? { error: "erro" }, { status: err.status })
      if (err.status === 404) return NextResponse.json({ error: "não encontrado" }, { status: 404 })
      if (err.status === 401 || err.status === 403)
        return NextResponse.json({ error: "não autorizado" }, { status: err.status })
    }
    return NextResponse.json({ error: "erro interno" }, { status: 500 })
  }
}

// Cancela a cobrança recorrente.
export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const { id } = await params
  try {
    await gateway.delete(`/api/v1/admin/assinaturas/${id}/cobranca-asaas`)
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
