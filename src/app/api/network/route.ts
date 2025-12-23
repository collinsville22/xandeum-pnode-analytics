import { NextResponse } from 'next/server';
import { createPRPCClient, PodWithStats, PNodeStats } from '@/lib/prpc';
import { PUBLIC_PNODES, PRPC_PORT } from '@/config/network';
import { batchGetLocations, extractIP } from '@/lib/geolocation';
import type { NetworkOverview } from '@/types/pnode';

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

    for (const host of PUBLIC_PNODES) {
      try {
        const client = createPRPCClient(host, PRPC_PORT);
        const pods = await client.getPodsWithStats();
        if (pods.length > 0) {
          allPods = pods;
          break;
        }
      } catch {
        continue;
      }
    }

    if (allPods.length === 0) {
      return NextResponse.json(
        {
          error: 'Failed to fetch network data',
          responseTime: Date.now() - startTime,
        },
        { status: 503 }
      );
    }

    const podsWithStatus = allPods.map((pod) => {
      const lastSeenMs = pod.last_seen_timestamp * 1000;
      const ageMs = Date.now() - lastSeenMs;
      const online = ageMs < 300_000;
      return { ...pod, online };
    });

    const onlineNodes = podsWithStatus.filter((p) => p.online);
    const publicNodes = podsWithStatus.filter((p) => p.is_public);
    const privateNodes = podsWithStatus.filter((p) => !p.is_public);

    const ips = podsWithStatus.map((p) => extractIP(p.address));
    const locationMap = await batchGetLocations(ips);

    const locationDistribution: Record<string, number> = {};
    for (const [, geo] of locationMap) {
      const country = geo.country || 'Unknown';
      locationDistribution[country] = (locationDistribution[country] || 0) + 1;
    }

    const onlinePublicPods = podsWithStatus.filter(
      (pod) => pod.online && pod.is_public && pod.rpc_port
    );

    const statsToFetch = onlinePublicPods.map((pod) => ({
      host: extractIP(pod.address),
      rpcPort: pod.rpc_port,
    }));

    const statsMap = await batchFetchStats(statsToFetch);

    const allStats = Array.from(statsMap.values()).filter(
      (s): s is PNodeStats => s !== null
    );

    const totalRam = allStats.reduce((sum, s) => sum + s.ram_total, 0);
    const totalRamUsed = allStats.reduce((sum, s) => sum + s.ram_used, 0);
    const avgCpuPercent =
      allStats.length > 0
        ? allStats.reduce((sum, s) => sum + s.cpu_percent, 0) / allStats.length
        : 0;
    const avgRamPercent =
      totalRam > 0 ? (totalRamUsed / totalRam) * 100 : 0;
    const totalPacketsReceived = allStats.reduce(
      (sum, s) => sum + s.packets_received,
      0
    );
    const totalPacketsSent = allStats.reduce(
      (sum, s) => sum + s.packets_sent,
      0
    );
    const totalActiveStreams = allStats.reduce(
      (sum, s) => sum + s.active_streams,
      0
    );
    const totalPages = allStats.reduce((sum, s) => sum + s.total_pages, 0);
    const totalBytes = allStats.reduce((sum, s) => sum + s.total_bytes, 0);

    const overview: NetworkOverview = {
      total_pnodes: podsWithStatus.length,
      online_pnodes: onlineNodes.length,
      offline_pnodes: podsWithStatus.length - onlineNodes.length,
      public_pnodes: publicNodes.length,
      private_pnodes: privateNodes.length,
      total_storage: podsWithStatus.reduce(
        (sum, p) => sum + (p.storage_used || 0),
        0
      ),
      total_storage_committed: podsWithStatus.reduce(
        (sum, p) => sum + (p.storage_committed || 0),
        0
      ),
      total_storage_used: podsWithStatus.reduce(
        (sum, p) => sum + (p.storage_used || 0),
        0
      ),
      total_ram: totalRam,
      avg_cpu_percent: Math.round(avgCpuPercent * 100) / 100,
      avg_ram_percent: Math.round(avgRamPercent * 100) / 100,
      avg_uptime:
        onlineNodes.length > 0
          ? onlineNodes.reduce((sum, p) => sum + (p.uptime || 0), 0) /
            onlineNodes.length
          : 0,
      total_pages: totalPages,
      total_bytes: totalBytes,
      total_packets_received: totalPacketsReceived,
      total_packets_sent: totalPacketsSent,
      total_active_streams: totalActiveStreams,
      version_distribution: podsWithStatus.reduce((acc, p) => {
        const version = p.version || 'unknown';
        acc[version] = (acc[version] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      location_distribution: locationDistribution,
    };

    const responseTime = Date.now() - startTime;
    console.log(
      `Network stats: ${allStats.length} nodes reported stats in ${responseTime}ms`
    );

    const response = NextResponse.json({
      overview,
      timestamp: Date.now(),
      responseTime,
      cached: false,
    });

    response.headers.set('Cache-Control', 'public, max-age=30, s-maxage=60');
    return response;
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Failed to fetch network overview',
        message: error instanceof Error ? error.message : 'Unknown error',
        responseTime: Date.now() - startTime,
      },
      { status: 500 }
    );
  }
}
