import { NextRequest } from 'next/server';
import { resolveMainApiUrl } from '@/lib/env';

const API = resolveMainApiUrl();

const HOP_BY_HOP = new Set([
  'connection',
  'content-length',
  'host',
  'keep-alive',
  'proxy-authenticate',
  'proxy-authorization',
  'te',
  'trailer',
  'transfer-encoding',
  'upgrade',
]);

async function proxy(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params;
  const incoming = new URL(req.url);
  const target = `${API}/api/${path.join('/')}${incoming.search}`;
  const headers = new Headers();
  req.headers.forEach((value, key) => {
    if (!HOP_BY_HOP.has(key.toLowerCase())) {
      headers.set(key, value);
    }
  });

  const method = req.method.toUpperCase();
  let body: ArrayBuffer | undefined;
  if (method !== 'GET' && method !== 'HEAD') {
    body = await req.arrayBuffer();
    headers.delete('transfer-encoding');
    if (body.byteLength > 0) {
      headers.set('content-length', String(body.byteLength));
    }
  }
  const upstream = await fetch(target, {
    method,
    headers,
    body,
    cache: 'no-store',
    redirect: 'manual',
  });

  const responseHeaders = new Headers();
  upstream.headers.forEach((value, key) => {
    const lower = key.toLowerCase();
    if (lower === 'set-cookie') {
      return;
    }
    if (lower === 'location') {
      return;
    }
    if (!HOP_BY_HOP.has(lower)) {
      responseHeaders.set(key, value);
    }
  });

  if (upstream.status >= 300 && upstream.status < 400) {
    return Response.json(
      { error: `Upstream redirect (${upstream.status}). Check MAIN_API_URL (use internal host, not public https).` },
      { status: 502, headers: responseHeaders },
    );
  }

  const response = new Response(upstream.body, {
    status: upstream.status,
    headers: responseHeaders,
  });
  const cookies = typeof upstream.headers.getSetCookie === 'function' ? upstream.headers.getSetCookie() : [];
  for (const cookie of cookies) {
    response.headers.append('Set-Cookie', cookie.replace(/;\s*Domain=[^;]*/gi, ''));
  }
  return response;
}

export const GET = proxy;
export const POST = proxy;
export const PATCH = proxy;
export const PUT = proxy;
export const DELETE = proxy;
export const dynamic = 'force-dynamic';
