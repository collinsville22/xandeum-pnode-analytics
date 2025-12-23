import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface PodCredit {
  pod_id: string;
  credits: number;
}

interface PodCreditsResponse {
  pods_credits: PodCredit[];
  status: string;
}

let creditsCache: { data: Map<string, number>; timestamp: number } | null = null;
const CACHE_TTL = 60000;

export async function GET() {
  const startTime = Date.now();

  try {
    if (creditsCache && Date.now() - creditsCache.timestamp < CACHE_TTL) {
      const credits = Object.fromEntries(creditsCache.data);
      return NextResponse.json({
        credits,
        total: creditsCache.data.size,
        timestamp: creditsCache.timestamp,
        responseTime: Date.now() - startTime,
        cached: true,
      });
    }

    const res = await fetch('https://podcredits.xandeum.network/api/pods-credits', {
      next: { revalidate: 60 },
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch pod credits: ${res.status}`);
    }

    const data: PodCreditsResponse = await res.json();

    if (data.status !== 'success' || !data.pods_credits) {
      throw new Error('Invalid response from pod credits API');
    }

    const creditsMap = new Map<string, number>();
    for (const pod of data.pods_credits) {
      creditsMap.set(pod.pod_id, pod.credits);
    }

    creditsCache = {
      data: creditsMap,
      timestamp: Date.now(),
    };

    const credits = Object.fromEntries(creditsMap);
    const response = NextResponse.json({
      credits,
      total: creditsMap.size,
      timestamp: Date.now(),
      responseTime: Date.now() - startTime,
      cached: false,
    });

    response.headers.set('Cache-Control', 'public, max-age=30, s-maxage=60');
    return response;
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Failed to fetch pod credits',
        message: error instanceof Error ? error.message : 'Unknown error',
        responseTime: Date.now() - startTime,
      },
      { status: 500 }
    );
  }
}
