
import { NextResponse, type NextRequest } from 'next/server'
import type { UserRole, User } from '@/lib/definitions';

// This function is now simplified as we can't do server-side session checks easily without a proper auth library.
// The logic will rely on the client-side checks in the layout components.
function getUserFromRequest(request: NextRequest): User | null {
  // In a real app with server-side sessions (e.g., NextAuth.js), you'd verify the session here.
  // For this simulation, we can't securely get the user on the server from sessionStorage.
  // We'll return null and let client-side layouts handle redirects.
  return null;
}

export async function middleware(request: NextRequest) {
  // Since we cannot reliably get the user on the server in this setup,
  // we will let the client-side checks in the layouts handle the redirection logic.
  // This middleware can be expanded later with a proper session management library.
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
