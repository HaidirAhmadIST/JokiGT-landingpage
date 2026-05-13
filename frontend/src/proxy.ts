import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Middleware untuk otentikasi dan proteksi rute.
 * Mengalihkan user yang belum login ke /login, dan user yang sudah login
 * menjauh dari halaman login/register.
 */

// Rute publik yang bisa diakses tanpa login
const publicRoutes = ['/login', '/register', '/pendaftaran', '/register-password'];

export function proxy(request: NextRequest) {
  const token = request.cookies.get('auth_token')?.value;
  const isPublicRoute = request.nextUrl.pathname === '/' || publicRoutes.some(route => request.nextUrl.pathname.startsWith(route));

  // Jika tidak ada token dan mencoba akses rute terproteksi
  if (!token && !isPublicRoute) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Jika sudah login dan mencoba akses rute login/register
  const isGuestOnlyRoute = ['/login', '/register'].includes(request.nextUrl.pathname);
  if (token && isGuestOnlyRoute) {
    return NextResponse.redirect(new URL('/dashboard-admin', request.url));
  }

  return NextResponse.next();
}

// Konfigurasi matcher untuk menentukan rute mana yang diproses middleware
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
