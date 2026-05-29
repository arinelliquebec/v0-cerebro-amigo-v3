import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const res = NextResponse.redirect(new URL('/p/entrar', req.url), { status: 303 })
  res.cookies.set('paciente_token', '', { path: '/', maxAge: 0, expires: new Date(0) })
  return res
}
