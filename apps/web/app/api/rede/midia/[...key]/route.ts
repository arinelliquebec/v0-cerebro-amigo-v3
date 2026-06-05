import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"

const GATEWAY = process.env.API_GATEWAY_URL ?? "http://localhost:5050"

// Serve a foto de um post: repassa o 302 do gateway (→ GET presigned do S3) pro
// <img>. Objeto privado; só médico logado. Cookie httpOnly autentica.
export async function GET(_req: NextRequest, { params }: { params: Promise<{ key: string[] }> }) {
  const { key } = await params
  const token = (await cookies()).get("auth_token")?.value
  if (!token) return new NextResponse("não autenticado", { status: 401 })

  const path = (key ?? []).join("/")
  let r: Response
  try {
    r = await fetch(`${GATEWAY}/api/v1/rede/midia/${path}`, {
      headers: { Authorization: `Bearer ${token}` },
      redirect: "manual",
      cache: "no-store",
    })
  } catch {
    return new NextResponse(null, { status: 502 })
  }
  const loc = r.headers.get("location")
  if ([301, 302, 307, 308].includes(r.status) && loc) return NextResponse.redirect(loc)
  return new NextResponse(null, { status: r.status === 200 ? 404 : r.status })
}
