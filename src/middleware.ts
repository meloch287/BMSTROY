import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Проверяем авторизацию для всех страниц админки
  if (pathname.startsWith('/admin')) {
    const token = request.cookies.get('admin_token');
    
    if (!token || token.value !== 'secret') {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};
