'use client';

import { useEffect, useState, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { RefreshCw, Search, Download, Sparkles, TrendingUp, TrendingDown, DollarSign, BarChart3, Coins, Award } from 'lucide-react';
import { useAI } from '@/context/ai-context';
import { usePreferences } from '@/contexts/preferences-context';
import dynamic from 'next/dynamic';
import { calculateHealthScore, HealthScoreBreakdown } from '@/lib/health-score';
import { HealthScoreBadge } from '@/components/dashboard/health-score';
import { ActivityFeed, ActivityEvent, generateActivityEvents } from '@/components/dashboard/activity-feed';
import { AnimatedCounter } from '@/components/ui/animated-counter';

const WorldMap = dynamic(
  () => import('@/components/dashboard/world-map').then((mod) => mod.WorldMap),
  { ssr: false, loading: () => <div style={{ height: '400px', background: '#1a1a2e' }} /> }
);

interface PNodeStats {
  cpu_percent: number;
  ram_percent: number;
  total_bytes: number;
  packets_received: number;
  packets_sent: number;
}

interface PriceData {
  xand: {
    price: number | null;
    priceFormatted: string | null;
    marketCap: number | null;
    marketCapFormatted: string | null;
    fdv: number | null;
    fdvFormatted: string | null;
    priceChange24h: number | null;
  };
  sol: {
    price: number | null;
    priceFormatted: string | null;
    priceChange24h: number | null;
  };
}

interface PNode {
  address: string;
  pubkey: string;
  version: string;
  online: boolean;
  is_public: boolean;
  uptime: number;
  storage_committed: number;
  storage_used: number;
  last_seen_timestamp: number;
  stats?: PNodeStats | null;
  location?: {
    country: string;
    city: string;
    ll: [number, number];
  };
}

interface CreditsMap {
  [pubkey: string]: number;
}

type RankingType = 'data' | 'credits' | 'uptime';

export default function DashboardPage() {
  const router = useRouter();
  const [pNodes, setPNodes] = useState<PNode[]>([]);
  const [credits, setCredits] = useState<CreditsMap>({});
  const [priceData, setPriceData] = useState<PriceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [rankingType, setRankingType] = useState<RankingType>('credits');
  const { toggleAi } = useAI();
  const { preferences, resolvedTheme } = usePreferences();
  const refreshInterval = preferences.autoRefreshInterval;
  const [countdown, setCountdown] = useState(refreshInterval);

  const [activityEvents, setActivityEvents] = useState<ActivityEvent[]>([]);
  const previousNodesRef = useRef<PNode[] | null>(null);
  const activityEventsRef = useRef<ActivityEvent[]>([]);

  const bgBase = resolvedTheme === 'light' ? '#f5f5f5' : '#121212';
  const bgRaised = resolvedTheme === 'light' ? '#ffffff' : '#1a1a1a';
  const bgElevated = resolvedTheme === 'light' ? '#f0f0f0' : '#252525';
  const textPrimary = resolvedTheme === 'light' ? '#1a1a1a' : '#ffffff';
  const textSecondary = resolvedTheme === 'light' ? '#666666' : '#888888';
  const textMuted = resolvedTheme === 'light' ? '#999999' : '#666666';
  const border = resolvedTheme === 'light' ? '#e0e0e0' : '#2a2a2a';
  const borderHover = resolvedTheme === 'light' ? '#d0d0d0' : '#333333';
  const accentColor = preferences.xandeumTheme ? '#14b8a6' : '#f59e0b';

  const fetchData = async () => {
    try {
      const [nodesRes, creditsRes] = await Promise.all([
        fetch('/api/pnodes'),
        fetch('/api/pod-credits'),
      ]);
      const nodesData = await nodesRes.json();
      const creditsData = await creditsRes.json();
      const newNodes = nodesData.pNodes || [];

      const newEvents = generateActivityEvents(newNodes, previousNodesRef.current, activityEventsRef.current);
      activityEventsRef.current = newEvents;
      setActivityEvents(newEvents);

      previousNodesRef.current = newNodes;
      setPNodes(newNodes);
      setCredits(creditsData.credits || {});
    } catch (err) {
      console.error('Failed to fetch data:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPrices = async () => {
    try {
      const res = await fetch('/api/prices');
      const data = await res.json();
      setPriceData(data);
    } catch (err) {
      console.error('Failed to fetch prices:', err);
    }
  };

  useEffect(() => { fetchData(); fetchPrices(); }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) { fetchData(); fetchPrices(); return refreshInterval; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [refreshInterval]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchData();
    fetchPrices();
    setCountdown(refreshInterval);
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const handleExport = () => {
    const exportData = {
      exportedAt: new Date().toISOString(),
      totalNodes: pNodes.length,
      nodes: pNodes.map(node => ({
        address: node.address,
        pubkey: node.pubkey,
        version: node.version,
        online: node.online,
        isPublic: node.is_public,
        uptime: node.uptime,
        storageCommitted: node.storage_committed,
        storageUsed: node.storage_used,
        lastSeen: node.last_seen_timestamp,
        location: node.location,
        stats: node.stats,
      })),
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `xandeum-nodes-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchTerm.trim()) {
      router.push(`/dashboard/nodes?search=${encodeURIComponent(searchTerm.trim())}`);
    }
  };

  const stats = useMemo(() => {
    const total = pNodes.length;
    const online = pNodes.filter((n) => n.online).length;
    const publicRpc = pNodes.filter((n) => n.is_public && n.online).length;
    const privateNodes = pNodes.filter((n) => !n.is_public && n.online).length;
    const fiveMinAgo = Date.now() / 1000 - 300;
    const notRecentlySeen = pNodes.filter((n) => !n.online || n.last_seen_timestamp < fiveMinAgo).length;
    const onlinePercent = total > 0 ? Math.round((online / total) * 100) : 0;
    const publicPercent = total > 0 ? Math.round((publicRpc / total) * 100) : 0;

    const totalStorage = pNodes.reduce((acc, n) => acc + (n.storage_committed || 0), 0);
    const usedStorage = pNodes.reduce((acc, n) => acc + (n.storage_used || 0), 0);
    const nodesWithStorage = pNodes.filter(n => n.storage_committed > 0).length;

    return { total, online, publicRpc, privateNodes, notRecentlySeen, onlinePercent, publicPercent, totalStorage, usedStorage, nodesWithStorage };
  }, [pNodes]);

  const mapNodes = useMemo(() => {
    return pNodes
      .filter((n) => n.location?.ll)
      .map((n) => ({
        coordinates: [n.location!.ll[1], n.location!.ll[0]] as [number, number],
        status: (!n.online ? 'offline' : n.is_public ? 'public' : 'private') as 'public' | 'private' | 'offline',
        address: n.address,
      }));
  }, [pNodes]);

  const geoData = useMemo(() => {
    const countries: Record<string, number> = {};
    const cities: Record<string, number> = {};
    const versions: Record<string, number> = {};
    const locations = new Set<string>();

    pNodes.forEach((n) => {
      if (n.location) {
        const key = `${n.location.ll[0]},${n.location.ll[1]}`;
        locations.add(key);
        countries[n.location.country] = (countries[n.location.country] || 0) + 1;
        if (n.location.city) {
          cities[n.location.city] = (cities[n.location.city] || 0) + 1;
        }
      }
      versions[n.version] = (versions[n.version] || 0) + 1;
    });

    const topCountries = Object.entries(countries).sort((a, b) => b[1] - a[1]).slice(0, 5);
    const maxCountry = topCountries[0]?.[1] || 1;
    const topCities = Object.entries(cities).sort((a, b) => b[1] - a[1]).slice(0, 4);
    const maxCity = topCities[0]?.[1] || 1;

    return {
      totalLocations: locations.size,
      totalCountries: Object.keys(countries).length,
      topCountries,
      maxCountry,
      topCities,
      maxCity,
      versionDistribution: Object.entries(versions)
        .map(([version, count]) => ({ version, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 4),
    };
  }, [pNodes]);

  const topPerformers = useMemo(() => {
    return [...pNodes]
      .filter(n => n.online)
      .sort((a, b) => {
        switch (rankingType) {
          case 'data':
            return (b.stats?.total_bytes || 0) - (a.stats?.total_bytes || 0);
          case 'credits':
            return (credits[b.pubkey] || 0) - (credits[a.pubkey] || 0);
          case 'uptime':
            return (b.uptime || 0) - (a.uptime || 0);
          default:
            return 0;
        }
      })
      .slice(0, 5)
      .map(node => ({
        ...node,
        healthScore: calculateHealthScore({
          online: node.online,
          uptime: node.uptime,
          cpu_percent: node.stats?.cpu_percent,
          ram_percent: node.stats?.ram_percent,
          storage_used: node.storage_used,
          storage_committed: node.storage_committed,
          is_public: node.is_public,
        }),
      }));
  }, [pNodes, rankingType, credits]);

  const networkHealth = useMemo(() => {
    const onlineScore = stats.onlinePercent;
    const publicScore = stats.publicPercent;
    const quality = Math.round((onlineScore * 0.6 + publicScore * 0.4));
    return { score: quality, label: quality >= 80 ? 'Excellent' : quality >= 60 ? 'Good' : quality >= 40 ? 'Fair' : 'Poor' };
  }, [stats]);

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatCredits = (amount: number) => {
    if (!amount) return '0';
    if (amount >= 1000000) return `${(amount / 1000000).toFixed(1)}M`;
    if (amount >= 1000) return `${(amount / 1000).toFixed(1)}K`;
    return amount.toLocaleString();
  };

  const formatUptime = (seconds: number) => {
    if (!seconds) return '-';
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    if (days > 0) return `${days}d ${hours}h`;
    const mins = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${mins}m`;
  };

  const getRankingLabel = () => {
    switch (rankingType) {
      case 'data': return 'Data Served';
      case 'credits': return 'Credits';
      case 'uptime': return 'Uptime';
    }
  };

  const getRankingValue = (node: typeof topPerformers[0]) => {
    switch (rankingType) {
      case 'data': return formatBytes(node.stats?.total_bytes || 0);
      case 'credits': return formatCredits(credits[node.pubkey] || 0);
      case 'uptime': return formatUptime(node.uptime);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: bgBase }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 32, height: 32, border: `2px solid ${borderHover}`, borderTopColor: '#22c55e', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 12px' }} />
          <p style={{ color: textSecondary, fontSize: 13 }}>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: bgBase }}>
      <header style={{ height: 48, padding: '0 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${border}`, background: bgRaised }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 4, background: 'rgba(34, 197, 94, 0.15)' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e' }} />
            <span style={{ color: '#22c55e', fontSize: 11, fontWeight: 600 }}>Online</span>
          </div>
          <span style={{ color: textPrimary, fontSize: 15, fontWeight: 600 }}>Dashboard</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px', borderRadius: 6, background: bgElevated, border: `1px solid ${borderHover}`, width: 280 }}>
          <Search size={14} color={textMuted} />
          <input
            type="text"
            placeholder="Search nodes... (Enter to search)"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={handleSearch}
            style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: textPrimary, fontSize: 13 }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button onClick={handleExport} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 6, background: 'transparent', border: `1px solid ${borderHover}`, color: textSecondary, fontSize: 12, cursor: 'pointer' }}>
            <Download size={14} />
            Export
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px', borderRadius: 6, background: bgElevated, border: `1px solid ${borderHover}` }}>
            <span style={{ color: textMuted, fontSize: 12 }}>Next refresh</span>
            <span style={{ color: accentColor, fontSize: 12, fontWeight: 600, fontFamily: 'monospace' }}>{countdown}s</span>
            <button onClick={handleRefresh} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 2 }}>
              <RefreshCw size={14} color={textMuted} className={isRefreshing ? 'animate-spin' : ''} />
            </button>
          </div>
          <button onClick={toggleAi} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 6, background: bgElevated, border: `1px solid ${borderHover}`, color: textPrimary, fontSize: 12, cursor: 'pointer' }}>
            <Sparkles size={14} />
            Ask AI
          </button>
        </div>
      </header>

      <div style={{ padding: 20 }}>
        <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
          {(() => {
            const xandChange = priceData?.xand?.priceChange24h;
            const solChange = priceData?.sol?.priceChange24h;
            const formatChange = (change: number | null | undefined) => {
              if (change === null || change === undefined) return null;
              const sign = change >= 0 ? '+' : '';
              return `${sign}${change.toFixed(2)}%`;
            };
            const priceStats = [
              {
                label: 'XAND Price',
                value: priceData?.xand?.priceFormatted || '–',
                change: formatChange(xandChange),
                changePositive: xandChange !== null && xandChange !== undefined && xandChange >= 0,
                color: '#22c55e',
                icon: DollarSign,
              },
              {
                label: 'Market Cap',
                value: priceData?.xand?.marketCapFormatted || '–',
                change: null,
                changePositive: false,
                color: '#3b82f6',
                icon: BarChart3,
              },
              {
                label: 'FDV',
                value: priceData?.xand?.fdvFormatted || '–',
                change: null,
                changePositive: false,
                color: '#8b5cf6',
                icon: Coins,
              },
              {
                label: 'SOL Price',
                value: priceData?.sol?.priceFormatted || '–',
                change: formatChange(solChange),
                changePositive: solChange !== null && solChange !== undefined && solChange >= 0,
                color: '#f59e0b',
                icon: DollarSign,
              },
            ];
            return priceStats.map((stat) => {
              const Icon = stat.icon;
              return (
                <div key={stat.label} style={{ flex: 1, padding: '16px 14px', borderRadius: 8, background: bgRaised, border: `1px solid ${border}` }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                    <span style={{ color: textSecondary, fontSize: 11, fontWeight: 600 }}>{stat.label}</span>
                    <div style={{ width: 28, height: 28, borderRadius: 6, background: `${stat.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Icon size={14} color={stat.color} />
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                    <span style={{ fontSize: 22, fontWeight: 800, color: textPrimary, lineHeight: 1 }}>{stat.value}</span>
                    {stat.change && (
                      <span style={{
                        fontSize: 11,
                        fontWeight: 600,
                        color: stat.changePositive ? '#22c55e' : '#ef4444',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 2
                      }}>
                        {stat.changePositive ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                        {stat.change}
                      </span>
                    )}
                  </div>
                </div>
              );
            });
          })()}
        </div>

        <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
          {[
            { label: 'Total pNodes', value: stats.total, sub: 'Discovered via gossip', color: textPrimary },
            { label: 'Online Nodes', value: stats.online, sub: `${stats.onlinePercent}% of network`, color: '#22c55e', trend: stats.onlinePercent },
            { label: 'Public RPC', value: stats.publicRpc, sub: 'Port 6900 accessible', color: '#3b82f6' },
            { label: 'Private Nodes', value: stats.privateNodes, sub: 'Online but RPC private', color: accentColor },
            { label: 'Not Recently Seen', value: stats.notRecentlySeen, sub: 'Last seen >5 min ago', color: '#ef4444' },
          ].map((stat) => (
            <div key={stat.label} style={{ flex: 1, padding: '20px 16px', borderRadius: 8, background: bgRaised, border: `1px solid ${border}` }}>
              <p style={{ color: textSecondary, fontSize: 12, fontWeight: 600, marginBottom: 12 }}>{stat.label}</p>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                <AnimatedCounter
                  value={stat.value}
                  duration={600}
                  style={{ color: stat.color, fontSize: 36, fontWeight: 800, lineHeight: 1 }}
                />
                {stat.trend !== undefined && (
                  <span style={{ color: '#22c55e', fontSize: 13, fontWeight: 600 }}>
                    ↑<AnimatedCounter value={stat.trend} duration={600} suffix="%" />
                  </span>
                )}
              </div>
              <p style={{ color: textMuted, fontSize: 12, marginTop: 8 }}>{stat.sub}</p>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
          <div style={{ flex: 1, borderRadius: 8, background: bgRaised, border: `1px solid ${border}`, overflow: 'hidden' }}>
            <WorldMap nodes={mapNodes} />
          </div>

          <div style={{ width: 280, borderRadius: 8, background: bgRaised, border: `1px solid ${border}` }}>
            <div style={{ padding: '14px 16px', borderBottom: `1px solid ${border}` }}>
              <span style={{ color: textPrimary, fontSize: 14, fontWeight: 600 }}>Geographic Insights</span>
            </div>
            <div style={{ padding: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
                <div style={{ padding: 14, borderRadius: 8, background: bgElevated }}>
                  <p style={{ color: '#22c55e', fontSize: 32, fontWeight: 800, lineHeight: 1 }}>{geoData.totalLocations}</p>
                  <p style={{ color: textSecondary, fontSize: 12, marginTop: 6 }}>Locations</p>
                </div>
                <div style={{ padding: 14, borderRadius: 8, background: bgElevated }}>
                  <p style={{ color: textPrimary, fontSize: 32, fontWeight: 800, lineHeight: 1 }}>{geoData.totalCountries}</p>
                  <p style={{ color: textSecondary, fontSize: 12, marginTop: 6 }}>Countries</p>
                </div>
              </div>

              <p style={{ color: textSecondary, fontSize: 11, fontWeight: 600, marginBottom: 12 }}>Version Distribution</p>
              <div style={{ marginBottom: 20 }}>
                {geoData.versionDistribution.map((v) => (
                  <div key={v.version} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ color: textSecondary, fontSize: 13, fontWeight: 600, maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v.version}</span>
                    <span style={{ color: textPrimary, fontSize: 16, fontWeight: 800 }}>{v.count}</span>
                  </div>
                ))}
              </div>

              <p style={{ color: textSecondary, fontSize: 11, fontWeight: 600, marginBottom: 12 }}>Top Countries</p>
              {geoData.topCountries.map(([country, count]) => (
                <div key={country} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                  <span style={{ color: textSecondary, fontSize: 13, fontWeight: 600, width: 28 }}>{country.substring(0, 2).toUpperCase()}</span>
                  <div style={{ flex: 1, height: 6, background: borderHover, borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ width: `${(count / geoData.maxCountry) * 100}%`, height: '100%', background: '#3b82f6', borderRadius: 3 }} />
                  </div>
                  <span style={{ color: textPrimary, fontSize: 16, fontWeight: 800, width: 36, textAlign: 'right' }}>{count}</span>
                </div>
              ))}

              <p style={{ color: textSecondary, fontSize: 11, fontWeight: 600, marginBottom: 12, marginTop: 20 }}>Top Cities</p>
              {geoData.topCities.map(([city, count]) => (
                <div key={city} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                  <span style={{ color: textSecondary, fontSize: 13, fontWeight: 600, width: 36 }}>{city.substring(0, 3).toUpperCase()}</span>
                  <div style={{ flex: 1, height: 6, background: borderHover, borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ width: `${(count / geoData.maxCity) * 100}%`, height: '100%', background: '#3b82f6', borderRadius: 3 }} />
                  </div>
                  <span style={{ color: textPrimary, fontSize: 16, fontWeight: 800, width: 36, textAlign: 'right' }}>{count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
          <div style={{ flex: 1, padding: 20, borderRadius: 8, background: bgRaised, border: `1px solid ${border}` }}>
            <p style={{ color: textPrimary, fontSize: 14, fontWeight: 600, marginBottom: 20 }}>Status Distribution</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
              <div style={{ position: 'relative', width: 110, height: 110 }}>
                <svg viewBox="0 0 36 36" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
                  <circle cx="18" cy="18" r="14" fill="none" stroke={borderHover} strokeWidth="4" />
                  <circle cx="18" cy="18" r="14" fill="none" stroke="#22c55e" strokeWidth="4"
                    strokeDasharray={`${(stats.publicRpc / stats.total) * 88} 88`} />
                  <circle cx="18" cy="18" r="14" fill="none" stroke={accentColor} strokeWidth="4"
                    strokeDasharray={`${(stats.privateNodes / stats.total) * 88} 88`}
                    strokeDashoffset={`-${(stats.publicRpc / stats.total) * 88}`} />
                  <circle cx="18" cy="18" r="14" fill="none" stroke="#ef4444" strokeWidth="4"
                    strokeDasharray={`${(stats.notRecentlySeen / stats.total) * 88} 88`}
                    strokeDashoffset={`-${((stats.publicRpc + stats.privateNodes) / stats.total) * 88}`} />
                </svg>
              </div>
              <div style={{ flex: 1 }}>
                {[
                  { label: 'Public RPC', value: stats.publicRpc, color: '#22c55e' },
                  { label: 'Private', value: stats.privateNodes, color: accentColor },
                  { label: 'Not Recently Seen', value: stats.notRecentlySeen, color: '#ef4444' },
                ].map((item) => (
                  <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                    <span style={{ width: 10, height: 10, borderRadius: '50%', background: item.color }} />
                    <span style={{ color: textSecondary, fontSize: 13, fontWeight: 600 }}>{item.label}</span>
                    <span style={{ color: textPrimary, fontSize: 16, fontWeight: 800, marginLeft: 'auto' }}>{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div style={{ flex: 1, padding: 20, borderRadius: 8, background: bgRaised, border: `1px solid ${border}` }}>
            <p style={{ color: textPrimary, fontSize: 14, fontWeight: 600, marginBottom: 20 }}>Storage Overview</p>
            <div>
              {[
                { label: 'Total Capacity', value: formatBytes(stats.totalStorage) },
                { label: 'Used Storage', value: formatBytes(stats.usedStorage) },
                { label: 'Available', value: formatBytes(stats.totalStorage - stats.usedStorage) },
                { label: 'Network Utilization', value: stats.totalStorage > 0 ? `${((stats.usedStorage / stats.totalStorage) * 100).toFixed(1)}%` : '0%' },
              ].map((item) => (
                <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: `1px solid ${border}` }}>
                  <span style={{ color: textSecondary, fontSize: 13, fontWeight: 600 }}>{item.label}</span>
                  <span style={{ color: textPrimary, fontSize: 16, fontWeight: 800 }}>{item.value}</span>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 12 }}>
              <p style={{ color: textMuted, fontSize: 11 }}>Nodes with storage data: {stats.nodesWithStorage} of {stats.total}</p>
            </div>
          </div>

          <div style={{ flex: 1, padding: 20, borderRadius: 8, background: bgRaised, border: `1px solid ${border}` }}>
            <p style={{ color: textPrimary, fontSize: 14, fontWeight: 600, marginBottom: 20 }}>Network Health</p>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ position: 'relative', width: 160, height: 90, marginBottom: 12 }}>
                <svg viewBox="0 0 100 60" style={{ width: '100%', height: '100%' }}>
                  <path d="M 10 55 A 40 40 0 0 1 90 55" fill="none" stroke={borderHover} strokeWidth="8" strokeLinecap="round" />
                  <path d="M 10 55 A 40 40 0 0 1 90 55" fill="none" stroke="#22c55e" strokeWidth="8" strokeLinecap="round"
                    strokeDasharray={`${networkHealth.score * 1.26} 126`} />
                </svg>
                <div style={{ position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)', textAlign: 'center' }}>
                  <p style={{ color: '#22c55e', fontSize: 36, fontWeight: 800, lineHeight: 1 }}>{networkHealth.score}%</p>
                  <p style={{ color: textSecondary, fontSize: 12, marginTop: 4 }}>{networkHealth.label}</p>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 32, marginTop: 12 }}>
                {[
                  { label: 'Online', value: `${stats.onlinePercent}%` },
                  { label: 'Public RPC', value: `${stats.publicPercent}%` },
                  { label: 'Quality', value: `${networkHealth.score}%` },
                ].map((item) => (
                  <div key={item.label} style={{ textAlign: 'center' }}>
                    <p style={{ color: textPrimary, fontSize: 18, fontWeight: 800 }}>{item.value}</p>
                    <p style={{ color: textSecondary, fontSize: 11 }}>{item.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
          <div style={{ width: 320 }}>
            <ActivityFeed events={activityEvents} maxItems={8} />
          </div>

          <div style={{ flex: 1, borderRadius: 8, background: bgRaised, border: `1px solid ${border}` }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px', borderBottom: `1px solid ${border}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Award size={18} color={accentColor} />
              <span style={{ color: textPrimary, fontSize: 14, fontWeight: 600 }}>Top Performers by</span>
              <div style={{ display: 'flex', gap: 4, background: bgElevated, padding: 3, borderRadius: 6 }}>
                {(['credits', 'data', 'uptime'] as RankingType[]).map((type) => (
                  <button
                    key={type}
                    onClick={() => setRankingType(type)}
                    style={{
                      padding: '4px 10px',
                      borderRadius: 4,
                      border: 'none',
                      fontSize: 11,
                      fontWeight: 600,
                      cursor: 'pointer',
                      background: rankingType === type ? accentColor : 'transparent',
                      color: rankingType === type ? '#000' : textSecondary,
                      transition: 'all 0.15s',
                    }}
                  >
                    {type === 'data' ? 'Data' : type === 'credits' ? 'Credits' : 'Uptime'}
                  </button>
                ))}
              </div>
            </div>
            <a href="/dashboard/nodes" style={{ color: textSecondary, fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>View All →</a>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['#', 'Ops', getRankingLabel(), 'Status', 'Address', 'Version', 'CPU', 'RAM', 'Last Seen'].map((h) => (
                  <th key={h} style={{ padding: '10px 20px', textAlign: 'left', color: textMuted, fontSize: 12, fontWeight: 500 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {topPerformers.map((node, i) => (
                <tr
                  key={node.pubkey}
                  style={{ borderTop: `1px solid ${bgElevated}`, cursor: 'pointer' }}
                  onClick={() => router.push(`/dashboard/nodes/${node.address.split(':')[0]}`)}
                  onMouseEnter={(e) => (e.currentTarget.style.background = bgElevated)}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <td style={{ padding: '10px 20px', color: textMuted, fontSize: 13 }}>{i + 1}</td>
                  <td style={{ padding: '10px 20px' }}>
                    <HealthScoreBadge score={node.healthScore.overall} grade={node.healthScore.grade} />
                  </td>
                  <td style={{ padding: '10px 20px', color: accentColor, fontSize: 14, fontWeight: 800 }}>{getRankingValue(node)}</td>
                  <td style={{ padding: '10px 20px' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: node.online ? '#22c55e' : '#ef4444' }} />
                      <span style={{ color: textSecondary, fontWeight: 600 }}>
                        {node.online ? `Online (${node.is_public ? 'Public' : 'Private'})` : 'Offline'}
                      </span>
                    </span>
                  </td>
                  <td style={{ padding: '10px 20px', fontSize: 13 }}>
                    <span style={{ color: textPrimary, fontWeight: 600 }}>{node.address.split(':')[0]}</span>
                    <span style={{ color: textMuted }}>:9001</span>
                  </td>
                  <td style={{ padding: '10px 20px', color: textSecondary, fontSize: 13, fontWeight: 600 }}>{node.version}</td>
                  <td style={{ padding: '10px 20px', color: node.stats ? '#a855f7' : textMuted, fontSize: 13, fontWeight: 600 }}>
                    {node.stats ? `${node.stats.cpu_percent.toFixed(1)}%` : '–'}
                  </td>
                  <td style={{ padding: '10px 20px', color: node.stats ? '#22c55e' : textMuted, fontSize: 13, fontWeight: 600 }}>
                    {node.stats ? `${node.stats.ram_percent.toFixed(1)}%` : '–'}
                  </td>
                  <td style={{ padding: '10px 20px', color: textSecondary, fontSize: 13 }}>
                    {node.last_seen_timestamp ? `${Math.round((Date.now() / 1000 - node.last_seen_timestamp))}s ago` : '–'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
