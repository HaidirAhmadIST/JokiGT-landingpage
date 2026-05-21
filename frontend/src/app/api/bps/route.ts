import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const endpoint = searchParams.get('endpoint'); // e.g. provinces.json, regencies/11.json, districts/1101.json

  if (!endpoint) {
    return NextResponse.json({ error: 'Endpoint is required' }, { status: 400 });
  }

  try {
    const url = `https://emsifa.github.io/api-wilayah-indonesia/api/${endpoint}`;
    const res = await fetch(url, {
      next: { revalidate: 86400 } // Cache for 24 hours
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch from BPS API: ${res.status}`);
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('BPS Proxy Error:', error.message);
    return NextResponse.json({ error: 'Failed to fetch BPS data' }, { status: 500 });
  }
}
