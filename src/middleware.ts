
import { NextResponse, type NextRequest } from 'next/server'
import type { UserRole } from '@/lib/definitions';
import { getUserFromSession } from '@/lib/auth';

export async function middleware(request: NextRequest) {
  const user = await getUserFromSession();
  const { pathname } = request.nextUrl

  // Define protected routes and roles required for them
  const protectedRoutes: { [key: string]: UserRole[] } = {
    '/admin': ['Administrador', 'Adm. Condo'],
    '/dashboard': ['Propietario', 'Renta'],
    '/guardia': ['Guardia'],
    '/cambiar-password': ['Administrador', 'Adm. Condo', 'Propietario', 'Renta', 'Guardia']
  };

  const authRoutes = ['/'];
  const publicRoutes = ['/suspendido'];

  // 1. Allow access to public routes
  if (publicRoutes.includes(pathname)) {
    return NextResponse.next();
  }
  
  // 2. Handle authenticated users
  if (user) {
    // If user is authenticated and tries to access login page, redirect them to their dashboard
    if (authRoutes.includes(pathname)) {
        let redirectPath = '/'; // Fallback
        switch (user.role as UserRole) {
            case 'Administrador':
            case 'Adm. Condo':
                redirectPath = '/admin';
                break;
            case 'Guardia':
                redirectPath = '/guardia';
                break;
            case 'Propietario':
            case 'Renta':
                redirectPath = '/dashboard';
                break;
        }
        const redirectUrl = new URL(redirectPath, request.url);
        return NextResponse.redirect(redirectUrl);
    }

    // Check if user has access to the protected route they are trying to access
    const protectedPath = Object.keys(protectedRoutes).find(p => pathname.startsWith(p));
    if (protectedPath) {
        const requiredRoles = protectedRoutes[protectedPath];
        if (!user.role || !requiredRoles.includes(user.role as UserRole)) {
            // Log out user if they try to access a page they don't have permission for
             const redirectUrl = new URL('/', request.url);
             redirectUrl.searchParams.set('error', 'unauthorized');
             const response = NextResponse.redirect(redirectUrl);
             response.cookies.delete('session');
             return response;
        }
    }
  } else {
    // 3. Handle unauthenticated users
    const isProtectedRoute = Object.keys(protectedRoutes).some(p => pathname.startsWith(p));
    if (isProtectedRoute) {
        const redirectUrl = new URL('/', request.url);
        return NextResponse.redirect(redirectUrl);
    }
  }

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
