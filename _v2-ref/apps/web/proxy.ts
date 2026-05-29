import { NextResponse, type NextRequest } from 'next/server'

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Dashboard do médico
  if (pathname.startsWith('/dashboard')) {
    const token = req.cookies.get('auth_token')?.value
    if (!token) {
      const url = req.nextUrl.clone()
      url.pathname = '/login'
      return NextResponse.redirect(url)
    }
  }

  // Portal do paciente — exceto /p/entrar
  if ((pathname === '/p' || pathname.startsWith('/p/')) && !pathname.startsWith('/p/entrar')) {
    const token = req.cookies.get('paciente_token')?.value
    if (!token) {
      const url = req.nextUrl.clone()
      url.pathname = '/p/entrar'
      return NextResponse.redirect(url)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*', '/p', '/p/:path*'],
}
