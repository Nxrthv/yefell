import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  // Omitir la autenticación temporalmente
  // Redirigir directamente al dashboard de administrador
  if (request.nextUrl.pathname === "/") {
    return NextResponse.redirect(new URL("/dashboard/admin", request.url))
  }

  // Permitir todas las rutas
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
}
