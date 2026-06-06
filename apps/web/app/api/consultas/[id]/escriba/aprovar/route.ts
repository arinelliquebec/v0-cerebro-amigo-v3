import { NextRequest, NextResponse } from "next/server"
import { gateway, gatewayErrorResponse } from "@/lib/gateway"

// Escriba (médico): aprova a evolução (nota do médico) → grava append-only.
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json().catch(() => ({}))
  try {
    return NextResponse.json(await gateway.post(`/api/v1/consultas/${id}/escriba/aprovar`, body))
  } catch (err) {
    return gatewayErrorResponse(err)
  }
}
