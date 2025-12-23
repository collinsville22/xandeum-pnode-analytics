import { NextResponse } from 'next/server';
import { createPRPCClient, PodWithStats, PNodeStats } from '@/lib/prpc';
import { PUBLIC_PNODES, PRPC_PORT } from '@/config/network';
import { batchGetLocations, extractIP } from '@/lib/geolocation';
import type { PNode } from '@/types/pnode';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

async function fetchNodeStats(
  host: string,
  rpcPort: number
): Promise<PNodeStats | null> {
  try {
    const client = createPRPCClient(host, rpcPort, 3000);
    const stats = await client.getStats();
    return stats;
  } catch {
    return null;
  }
}

async function batchFetchStats(
  pods: Array<{ host: string; rpcPort: number }>
): Promise<Map<string, PNodeStats | null>> {
  const BATCH_SIZE = 20;
  const results = new Map<string, PNodeStats | null>();

  for (let i = 0; i < pods.length; i += BATCH_SIZE) {
    const batch = pods.slice(i, i + BATCH_SIZE);
    const batchResults = await Promise.all(
      batch.map(async ({ host, rpcPort }) => {
        const stats = await fetchNodeStats(host, rpcPort);
        return { host, stats };
      })
    );

    for (const { host, stats } of batchResults) {
      results.set(host, stats);
    }
  }

  return results;
}

export async function GET() {
  const startTime = Date.now();

  try {
    let allPods: PodWithStats[] = [];
    let successfulQuery = false;

    const errors: string[] = [];
    for (const host of PUBLIC_PNODES) {
      try {
        console.log(`Trying bootstrap node: ${host}:${PRPC_PORT}`);
        const client = createPRPCClient(host, PRPC_PORT);
        const pods = await client.getPodsWithStats();
        console.log(`Got ${pods.length} pods with stats from ${host}`);

        if (pods.length > 0) {
          allPods = pods;
          successfulQuery = true;
          break;
        }
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : String(err);
        console.error(`Failed to connect to ${host}: ${errMsg}`);
        errors.push(`${host}: ${errMsg}`);
        continue;
      }
    }

    if (!successfulQuery) {
      return NextResponse.json(
        {
          error: 'Failed to fetch pNode list from all bootstrap nodes',
          details: errors,
          responseTime: Date.now() - startTime,
        },
        { status: 503 }
      );
    }

    const ips = allPods.map((pod) => extractIP(pod.address));
    const locationMap = await batchGetLocations(ips);

    const onlinePublicPods = allPods.filter((pod) => {
      const lastSeenMs = pod.last_seen_timestamp * 1000;
      const ageMs = Date.now() - lastSeenMs;
      const isOnline = ageMs < 300_000;
      return isOnline && pod.is_public && pod.rpc_port;
    });

    console.log(`Fetching stats for ${onlinePublicPods.length} online public nodes...`);

    const statsToFetch = onlinePublicPods.map((pod) => ({
      host: extractIP(pod.address),
      rpcPort: pod.rpc_port,
    }));

    const statsMap = await batchFetchStats(statsToFetch);

    const pNodes: PNode[] = allPods.map((pod) => {
      const host = extractIP(pod.address);
      const location = locationMap.get(host);
      const nodeStats = statsMap.get(host) || null;

      const lastSeenMs = pod.last_seen_timestamp * 1000;
      const ageMs = Date.now() - lastSeenMs;
      const isOnline = ageMs < 300_000;

      return {
        address: pod.address,
        pubkey: pod.pubkey,
        version: pod.version,
        stats: nodeStats,
        last_seen_timestamp: pod.last_seen_timestamp,
        online: isOnline,
        location: location || undefined,
        is_public: pod.is_public,
        rpc_port: pod.rpc_port,
        storage_committed: pod.storage_committed,
        storage_used: pod.storage_used,
        storage_usage_percent: pod.storage_usage_percent,
        uptime: pod.uptime,
      };
    });

    const responseTime = Date.now() - startTime;
    const nodesWithStats = pNodes.filter((p) => p.stats !== null).length;
    console.log(`Got stats for ${nodesWithStats} nodes in ${responseTime}ms`);

    const response = NextResponse.json({
      pNodes,
      total: pNodes.length,
      online: pNodes.filter((p) => p.online).length,
      offline: pNodes.filter((p) => !p.online).length,
      public: pNodes.filter((p) => p.is_public).length,
      private: pNodes.filter((p) => !p.is_public).length,
      timestamp: Date.now(),
      responseTime,
      cached: false,
    });

    response.headers.set('Cache-Control', 'public, max-age=30, s-maxage=60');
    return response;
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Failed to fetch pNode data',
        message: error instanceof Error ? error.message : 'Unknown error',
        responseTime: Date.now() - startTime,
      },
      { status: 500 }
    );
  }
}
