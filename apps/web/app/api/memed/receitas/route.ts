import { NextRequest, NextResponse } from "next/server"
import { gateway, GatewayError } from "@/lib/gateway"

// Espelho: receita emitida no MEMED → registra + clona meds em prescricoes.
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}))
  try {
    const data = await gateway.post("/api/v1/memed/receitas", body)
    return NextResponse.json(data)
  } catch (err) {
    if (err instanceof GatewayError) {
      return NextResponse.json({ error: err.body }, { status: err.status })
    }
    return NextResponse.json({ error: "upstream_error" }, { status: 502 })
  }
}
