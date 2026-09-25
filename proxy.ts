import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  const token = request.cookies.get('shield_auth')?.value;
  const isAuth = token === process.env.AUTH_SECRET;

  if (request.nextUrl.pathname.startsWith('/dashboard')) {
    if (!isAuth) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  if (request.nextUrl.pathname === '/' || request.nextUrl.pathname === '/login') {
    if (isAuth) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/', '/login'],
};
