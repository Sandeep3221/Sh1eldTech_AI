import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifySessionToken } from './app/lib/auth';

export async function proxy(request: NextRequest) {
  const token = request.cookies.get('shield_auth')?.value;
  let isAuth = false;

  if (token) {
    const payload = await verifySessionToken(token);
    if (payload && payload.role === 'admin') {
      isAuth = true;
    }
  }

  const { pathname } = request.nextUrl;

  if (pathname.startsWith('/dashboard')) {
    if (!isAuth) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  if (pathname === '/' || pathname === '/login') {
    if (isAuth) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  if (pathname.startsWith('/api/')) {
    const isPublicApi = 
      pathname === '/api/auth/login' || 
      pathname === '/api/auth/logout' || 
      pathname === '/api/chat' || 
      pathname === '/api/itinerary' ||
      pathname === '/api/widget-config';

    if (!isPublicApi) {
      if (!isAuth) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/', '/login', '/api/:path*'],
};
