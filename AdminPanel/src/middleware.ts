import { NextRequest, NextResponse } from 'next/server';
import { corsOriginAllowed } from '@/lib/env';

const CORS_HEADERS = {
  'Access-Control-Allow-Credentials': 'true',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-EngDi-Panel',
};

export function middleware(req: NextRequest) {
  const origin = corsOriginAllowed(req.headers.get('origin'));

  if (req.method === 'OPTIONS') {
    const res = new NextResponse(null, { status: 204 });
    if (origin) {
      res.headers.set('Access-Control-Allow-Origin', origin);
      for (const [key, value] of Object.entries(CORS_HEADERS)) {
        res.headers.set(key, value);
      }
    }
    return res;
  }

  const res = NextResponse.next();
  if (origin) {
    res.headers.set('Access-Control-Allow-Origin', origin);
    res.headers.set('Access-Control-Allow-Credentials', 'true');
  }
  return res;
}

export const config = {
  matcher: '/api/:path*',
};
