pg_dump \
     -Fc \
          -v \
               -d DATABASE_URL="prisma+postgres://accelerate.prisma-data.net/?api_key=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqd3RfaWQiOjEsInNlY3VyZV9rZXkiOiJza19zQkNwbUE1NDAwUmRrTW43VnZZakIiLCJhcGlfa2V5IjoiMDFLMTVaRDQwS1Y5WjdZRkcxUVlLRTc2OUciLCJ0ZW5hbnRfaWQiOiI4Y2UwNzZlYmQzNTU5ZTVmMDViNWFkODZkZDQxYjE0YzZjYzU0ODU1NzZkODk2OWFkNTliZjkxMTU4ODgzN2YwIiwiaW50ZXJuYWxfc2VjcmV0IjoiMTk4OTEyZDMtZGI3Yy00ZDc0LWI3YTEtOGRlMjAxY2MzZDA1In0.B6CUi2LtX8rnzZDSi4XlqYMtAZ2Rx0gUIiJIBK90VT0" \
                    -n public \
                         -f db_dump.bak
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import type { UserRole } from '@/lib/definitions';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options) {
          request.cookies.set({
            name,
            value,
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

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
    return response;
  }
  
  // 2. Handle authenticated users
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, requires_password_change, condominioIds, status:condominios(status)')
      .eq('id', user.id)
      .single()

    // If profile check fails, sign out and redirect to login
    if (!profile) {
      await supabase.auth.signOut();
      const redirectUrl = new URL('/', request.url);
      return NextResponse.redirect(redirectUrl);
    }
    
    // Check if the user's primary condominio is suspended (for non-admins)
    const condoStatus = Array.isArray(profile.status) ? profile.status[0]?.status : profile.status?.status;
    if (profile.role !== 'Administrador' && condoStatus === 'Suspendido' && pathname !== '/suspendido') {
        const redirectUrl = new URL('/suspendido', request.url);
        return NextResponse.redirect(redirectUrl);
    }
    if (profile.role !== 'Administrador' && condoStatus !== 'Suspendido' && pathname === '/suspendido') {
         await supabase.auth.signOut();
         const redirectUrl = new URL('/', request.url);
         return NextResponse.redirect(redirectUrl);
    }

    // Force password change if required
    if (profile.requires_password_change && pathname !== '/cambiar-password') {
        const redirectUrl = new URL('/cambiar-password', request.url);
        return NextResponse.redirect(redirectUrl);
    }
    
    // Redirect away from password change page if not required
    if (!profile.requires_password_change && pathname === '/cambiar-password') {
        let redirectPath = '/'; // Fallback
        switch (profile.role as UserRole) {
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
    
    // If Adm. Condo has multiple condos assigned and no condo is selected, force selection
    if (profile.role === 'Adm. Condo' && (profile.condominioIds?.length ?? 0) > 1 && !request.cookies.has('selectedCondoId') && pathname !== '/admin/seleccionar-condominio') {
       const redirectUrl = new URL('/admin/seleccionar-condominio', request.url);
       return NextResponse.redirect(redirectUrl);
    }
    
    if (pathname === '/admin/seleccionar-condominio' && profile.role !== 'Adm. Condo') {
        const redirectUrl = new URL('/admin/dashboard', request.url);
        return NextResponse.redirect(redirectUrl);
    }

    // If user is authenticated and tries to access login page, redirect them to their dashboard
    if (authRoutes.includes(pathname)) {
        let redirectPath = '/'; // Fallback
        switch (profile.role as UserRole) {
            case 'Administrador':
                redirectPath = '/admin';
                break;
             case 'Adm. Condo':
                if ((profile.condominioIds?.length ?? 0) > 1 && !request.cookies.has('selectedCondoId')) {
                    redirectPath = '/admin/seleccionar-condominio';
                } else {
                    redirectPath = '/admin';
                }
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
        if (!profile.role || !requiredRoles.includes(profile.role as UserRole)) {
            await supabase.auth.signOut();
            const redirectUrl = new URL('/', request.url);
            return NextResponse.redirect(redirectUrl);
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
