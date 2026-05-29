import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  // 303 See Other: força o browser a fazer GET no destino (form POST -> GET /login).
  // Sem isso, o redirect padrão (307) reenviaria POST e a pagina nao trataria.
  const res = NextResponse.redirect(new URL('/login', req.url), { status: 303 })
  res.cookies.set('auth_token', '', { path: '/', maxAge: 0, expires: new Date(0) })
  return res
}
