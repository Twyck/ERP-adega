import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Rotas públicas que não precisam de autenticação
  const publicPaths = ['/login', '/api/auth']
  const isPublicPath = publicPaths.some(path => request.nextUrl.pathname.startsWith(path))

  // Verifica se tem sessão de auth
  const sessionCookie = request.cookies.get('next-auth.session-token')

  // Se não tem sessão e não é rota pública, redireciona para login
  if (!sessionCookie && !isPublicPath) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|icons|manifest.json).*)'],
}
