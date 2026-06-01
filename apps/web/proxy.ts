import { NextRequest, NextResponse } from "next/server"

/**
 * proxy.ts — Next.js 16 replacement for middleware.ts (Node.js runtime).
 *
 * Responsibilities:
 * 1. Protect /dashboard/* — requires auth_token (doctor)
 * 2. Protect /p/* — requires paciente_token (patient portal)
 * 3. Preserve ?next= redirect for post-login return
 * 4. Expose the pathname as `x-pathname` so server layouts can decide chrome
 *    (ex.: portal esconde a bottom-nav em /p/entrar).
 */

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl

  const requestHeaders = new Headers(req.headers)
  requestHeaders.set("x-pathname", pathname)
  const next = () => NextResponse.next({ request: { headers: requestHeaders } })

  // ── Patient portal ──
  if (pathname.startsWith("/p")) {
    // Allow public portal pages
    if (pathname === "/p/entrar" || pathname.startsWith("/p/entrar/")) {
      return next()
    }

    const token = req.cookies.get("paciente_token")?.value
    if (!token) {
      const loginUrl = new URL("/p/entrar", req.url)
      loginUrl.searchParams.set("next", pathname)
      return NextResponse.redirect(loginUrl)
    }
    return next()
  }

  // ── Doctor dashboard ──
  if (pathname.startsWith("/dashboard")) {
    const token = req.cookies.get("auth_token")?.value
    if (!token) {
      const loginUrl = new URL("/login", req.url)
      loginUrl.searchParams.set("next", pathname)
      return NextResponse.redirect(loginUrl)
    }
    return next()
  }

  return next()
}

export const config = {
  matcher: ["/dashboard/:path*", "/p/:path*"],
}
