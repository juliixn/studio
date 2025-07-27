import { NextResponse, type NextRequest } from 'next/server'
import type { UserRole } from '@/lib/definitions';
import { updateSession } from '@/lib/supabase/middleware';
import { createClient } from '@/lib/supabase/server';

export async function middleware(request: NextRequest) {
  const { response, user } = await updateSession(request);

  const { pathname } = request.nextUrl

  // Define protected routes and roles required for them
  const protectedRoutes: { [key: string]: UserRole[] } = {
    '/admin': ['Administrador', 'Adm. Condo'],
    '/dashboard': ['Propietario', 'Renta'],
    '/guardia': ['Guardia'],
    // '/cambiar-password': ['Administrador', 'Adm. Condo', 'Propietario', 'Renta', 'Guardia']
  };

  const authRoutes = ['/'];
  const publicRoutes = ['/suspendido', '/cambiar-password'];

  // 1. Allow access to public routes
  if (publicRoutes.some(path => pathname.startsWith(path))) {
    return response;
  }
  
  // 2. Handle authenticated users
  if (user) {
    const supabase = createClient();
    const { data: profile } = await supabase
        .from('profiles')
        .select('role, condominioIds')
        .eq('id', user.id)
        .single();
    
    const userRole = profile?.role as UserRole;

    // Redirect Adm. Condo with multiple condos to selection page
    if (userRole === 'Adm. Condo' && (profile?.condominioIds?.length || 0) > 1 && pathname !== '/admin/seleccionar-condominio') {
      return NextResponse.redirect(new URL('/admin/seleccionar-condominio', request.url));
    }

    // If user is authenticated and tries to access login page, redirect them to their dashboard
    if (authRoutes.includes(pathname)) {
        let redirectPath = '/'; // Fallback
        switch (userRole) {
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
        if (!userRole || !requiredRoles.includes(userRole)) {
            // Log out user if they try to access a page they don't have permission for
             const redirectUrl = new URL('/', request.url);
             redirectUrl.searchParams.set('error', 'unauthorized');
             const logoutResponse = NextResponse.redirect(redirectUrl);
             // Clear Supabase session
             logoutResponse.cookies.delete(`sb-${process.env.NEXT_PUBLIC_SUPABASE_URL!.split('.')[0]}-auth-token`);
             return logoutResponse;
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

  return response;
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
