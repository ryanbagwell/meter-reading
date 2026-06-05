import type { NextRequest } from 'next/server';

const DJANGO_BASE = 'http://localhost:9005';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  const search = request.nextUrl.search;
  const upstream = `${DJANGO_BASE}/api/${path.join('/')}/${search}`;

  const res = await fetch(upstream, { cache: 'no-store' });
  const data = await res.json();
  return Response.json(data, { status: res.status });
}
