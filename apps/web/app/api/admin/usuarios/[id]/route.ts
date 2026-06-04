import { NextRequest, NextResponse } from "next/server"
import { gateway, GatewayError } from "@/lib/gateway"

type Ctx = { params: Promise<{ id: string }> }

export async function PATCH(req: NextRequest, { params }: Ctx) {
  const { id } = await params
  const body = await req.json().catch(() => ({}))
  const url = new URL(req.url)
  const action = url.searchParams.get("action") // "perfil" | "senha" | "role"
  const path =
    action === "senha" ? `/api/v1/admin/usuarios/${id}/senha`
    : action === "role" ? `/api/v1/admin/usuarios/${id}/role`
    : `/api/v1/admin/usuarios/${id}` // perfil: nome/email
  try {
    await gateway.patch(path, body)
    return new NextResponse(null, { status: 204 })
  } catch (err) {
    if (err instanceof GatewayError) {
      if (err.status === 409) return NextResponse.json(err.body, { status: 409 })
      if (err.status === 400) return NextResponse.json(err.body, { status: 400 })
      if (err.status === 401 || err.status === 403)
        return NextResponse.json({ error: "não autorizado" }, { status: err.status })
      if (err.status === 404) return NextResponse.json({ error: "não encontrado" }, { status: 404 })
    }
    return NextResponse.json({ error: "erro interno" }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const { id } = await params
  try {
    await gateway.delete(`/api/v1/admin/usuarios/${id}`)
    return new NextResponse(null, { status: 204 })
  } catch (err) {
    if (err instanceof GatewayError) {
      if (err.status === 400) return NextResponse.json(err.body, { status: 400 })
      if (err.status === 401 || err.status === 403)
        return NextResponse.json({ error: "não autorizado" }, { status: err.status })
      if (err.status === 404) return NextResponse.json({ error: "não encontrado" }, { status: 404 })
    }
    return NextResponse.json({ error: "erro interno" }, { status: 500 })
  }
}
