import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"

const GATEWAY = process.env.API_GATEWAY_URL ?? "http://localhost:5050"

// PATCH — marcar áudio como ouvido
export async function PATCH(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; audioId: string }> }
) {
  const { id, audioId } = await params
  const token = (await cookies()).get("auth_token")?.value
  if (!token) return NextResponse.json({ error: "não autorizado" }, { status: 401 })
  const res = await fetch(
    `${GATEWAY}/api/v1/prontuario/${id}/mensagens-audio/${audioId}/ouvido`,
    { method: "PATCH", headers: { Authorization: `Bearer ${token}` } }
  )
  return new NextResponse(null, { status: res.status })
}
