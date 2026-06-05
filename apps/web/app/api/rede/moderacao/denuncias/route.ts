import { NextRequest, NextResponse } from "next/server"
import { gateway, gatewayErrorResponse } from "@/lib/gateway"

export async function GET(req: NextRequest) {
  try {
    const status = req.nextUrl.searchParams.get("status") ?? "pendente"
    const data = await gateway.get(`/api/v1/rede/moderacao/denuncias?status=${status}`)
    return NextResponse.json(data)
  } catch (err) {
    return gatewayErrorResponse(err)
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const data = await gateway.post("/api/v1/rede/moderacao/denuncias", body)
    return NextResponse.json(data, { status: 201 })
  } catch (err) {
    return gatewayErrorResponse(err)
  }
}
