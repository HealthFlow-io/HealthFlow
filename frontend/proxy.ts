import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Routes that don't require authentication
const publicRoutes = ['/', '/auth/login', '/auth/register', '/auth/forgot-password', '/auth/reset-password'];

// Routes that require specific roles
const roleRoutes: Record<string, string[]> = {
  '/patient': ['Patient'],
  '/doctor': ['Doctor'],
  '/secretary': ['Secretary'],
  '/admin': ['Admin'],
};

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Allow public routes
  if (publicRoutes.some((route) => pathname === route || pathname.startsWith(route + '/'))) {
    // If user is already logged in and trying to access auth pages, redirect to appropriate dashboard
    const token = request.cookies.get('accessToken')?.value;
    const userRole = request.cookies.get('userRole')?.value;
    
    if (token && pathname.startsWith('/auth')) {
      // Redirect to appropriate dashboard based on role
      const dashboardUrl = getDashboardUrl(userRole);
      return NextResponse.redirect(new URL(dashboardUrl, request.url));
    }
    
    return NextResponse.next();
  }

  // Check for authentication token
  const token = request.cookies.get('accessToken')?.value;
  
  if (!token) {
    // Redirect to login if not authenticated
    const loginUrl = new URL('/auth/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Check role-based access
  const userRole = request.cookies.get('userRole')?.value;
  
  for (const [routePrefix, allowedRoles] of Object.entries(roleRoutes)) {
    if (pathname.startsWith(routePrefix)) {
      if (!userRole || !allowedRoles.includes(userRole)) {
        // Redirect to appropriate dashboard or home if role doesn't match
        const dashboardUrl = getDashboardUrl(userRole);
        return NextResponse.redirect(new URL(dashboardUrl, request.url));
      }
    }
  }

  return NextResponse.next();
}

function getDashboardUrl(role?: string): string {
  switch (role) {
    case 'Doctor':
      return '/doctor/dashboard';
    case 'Secretary':
      return '/secretary/dashboard';
    case 'Admin':
      return '/admin/dashboard';
    case 'Patient':
    default:
      return '/patient/dashboard';
  }
}

// Configure which routes the middleware should run on
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - api routes (if any)
     */
    '/((?!_next/static|_next/image|favicon.ico|public|api).*)',
  ],
};
