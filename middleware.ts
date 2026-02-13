import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // 로그인 페이지는 통과
  if (pathname.startsWith('/login')) {
    return NextResponse.next()
  }

  // Supabase 세션 쿠키 존재 여부 체크 (chunked 쿠키 포함: -auth-token.0, .1 등)
  const hasSession = request.cookies.getAll().some(cookie =>
    cookie.name.startsWith('sb-') &&
    (cookie.name.endsWith('-auth-token') || cookie.name.includes('-auth-token.'))
  )

  if (!hasSession) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
