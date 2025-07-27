
import { NextResponse, type NextRequest } from 'next/server'
import type { UserRole } from '@/lib/definitions';

// This middleware is simplified as authentication state is now managed client-side
// in this version of the application. A more robust solution would involve
// server-side session management with tokens.

export async function middleware(request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
