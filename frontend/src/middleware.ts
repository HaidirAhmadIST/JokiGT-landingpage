import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Routes that don't require authentication
const publicRoutes = ['/login', '/register', '/pendaftaran', '/register-password'];

export function middleware(request: NextRequest) {
  const token = request.cookies.get('auth_token')?.value;
  const isPublicRoute = publicRoutes.some(route => request.nextUrl.pathname.startsWith(route));

  // If user is not logged in and trying to access a protected route
  if (!token && !isPublicRoute) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // If user is logged in and trying to access the login/register pages, redirect to dashboard
  const isGuestOnlyRoute = ['/login', '/register'].includes(request.nextUrl.pathname);
  if (token && isGuestOnlyRoute) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
