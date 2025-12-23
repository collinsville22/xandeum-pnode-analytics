'use client';

import { useEffect, useState, useMemo, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Server,
  Share2,
  Copy,
  Globe,
  MapPin,
  Clock,
  Cpu,
  HardDrive,
  Activity,
  Send,
  Download,
  GitBranch,
  Trophy,
  ChevronLeft,
  RefreshCw,
  Check,
  Coins,
} from 'lucide-react';
import { usePreferences } from '@/contexts/preferences-context';
import { calculateHealthScore } from '@/lib/health-score';
import { HealthScore } from '@/components/dashboard/health-score';
import { PerformanceChart, MultiMetricChart } from '@/components/dashboard/performance-chart';

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
  location?: {
    country: string;
    city: string;
    ll: [number, number];
  };
  stats?: {
    cpu_percent: number;
    ram_used: number;
    ram_total: number;
    ram_percent: number;
    packets_received: number;
    packets_sent: number;
    active_streams: number;
    total_bytes: number;
  };
}

export default function NodeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { preferences, resolvedTheme } = usePreferences();
  const refreshInterval = preferences.autoRefreshInterval;
  const ip = params.ip as string;
  const [node, setNode] = useState<PNode | null>(null);
  const [loading, setLoading] = useState(true);
  const [allNodes, setAllNodes] = useState<PNode[]>([]);
  const [nodeCredits, setNodeCredits] = useState<number>(0);
  const [countdown, setCountdown] = useState(refreshInterval);
  const [copied, setCopied] = useState<string | null>(null);

  const bgBase = resolvedTheme === 'light' ? '#f5f5f5' : '#121212';
  const bgRaised = resolvedTheme === 'light' ? '#ffffff' : '#1a1a1a';
  const bgElevated = resolvedTheme === 'light' ? '#f0f0f0' : '#252525';
  const textPrimary = resolvedTheme === 'light' ? '#1a1a1a' : '#ffffff';
  const textSecondary = resolvedTheme === 'light' ? '#666666' : '#888888';
  const textMuted = resolvedTheme === 'light' ? '#999999' : '#666666';
  const border = resolvedTheme === 'light' ? '#e0e0e0' : '#2a2a2a';
  const borderHover = resolvedTheme === 'light' ? '#d0d0d0' : '#333333';
  const accentColor = '#f59e0b';

  const fetchData = async () => {
    try {
      const [nodesRes, creditsRes] = await Promise.all([
        fetch('/api/pnodes'),
        fetch('/api/pod-credits'),
      ]);
      const nodesData = await nodesRes.json();
      const creditsData = await creditsRes.json();
      const nodes = nodesData.pNodes || [];
      const credits = creditsData.credits || {};
      setAllNodes(nodes);
      const found = nodes.find((n: PNode) => n.address.startsWith(ip));
      setNode(found || null);
      if (found) {
        setNodeCredits(credits[found.pubkey] || 0);
      }
      setCountdown(refreshInterval);
    } catch (err) {
      console.error('Failed to fetch node:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, refreshInterval * 1000);
    return () => clearInterval(interval);
  }, [ip, refreshInterval]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((c) => (c > 0 ? c - 1 : refreshInterval));
    }, 1000);
    return () => clearInterval(timer);
  }, [refreshInterval]);

  const nodeRank = useMemo(() => {
    if (!node || !allNodes.length) return { rank: 0, total: 0, percentile: 0 };
    const sorted = [...allNodes].filter((n) => n.online).sort((a, b) => (b.uptime || 0) - (a.uptime || 0));
    const rank = sorted.findIndex((n) => n.address === node.address) + 1;
    const percentile = Math.round(((sorted.length - rank) / sorted.length) * 100);
    return { rank, total: sorted.length, percentile };
  }, [node, allNodes]);

  const healthScore = useMemo(() => {
    if (!node) return null;
    return calculateHealthScore({
      online: node.online,
      uptime: node.uptime,
      cpu_percent: node.stats?.cpu_percent,
      ram_percent: node.stats?.ram_percent,
      storage_used: node.storage_used,
      storage_committed: node.storage_committed,
      is_public: node.is_public,
    });
  }, [node]);

  const formatUptime = (seconds: number) => {
    if (!seconds) return '0s';
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    if (days > 0) return `${days}d ${hours}h`;
    return `${hours}h ${mins}m`;
  };

  const formatBytes = (bytes: number) => {
    if (!bytes) return '0 B';
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

  const formatLastSeen = (timestamp: number) => {
    const ageMs = Date.now() - timestamp * 1000;
    const seconds = Math.floor(ageMs / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    return `${Math.floor(seconds / 60)}m ago`;
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: bgBase, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 40, height: 40, borderRadius: '50%', border: `2px solid ${border}`, borderTopColor: accentColor, animation: 'spin 1s linear infinite' }} />
          <p style={{ color: textSecondary, fontSize: 13 }}>Loading node details...</p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!node) {
    return (
      <div style={{ minHeight: '100vh', background: bgBase, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <Server size={64} color={textMuted} style={{ margin: '0 auto 16px' }} />
          <h2 style={{ fontSize: 20, fontWeight: 600, color: textPrimary, marginBottom: 8 }}>Node Not Found</h2>
          <p style={{ color: textSecondary, fontSize: 13, marginBottom: 24 }}>The node with IP {ip} could not be found.</p>
          <button
            onClick={() => router.push('/dashboard/nodes')}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 20px', background: accentColor, border: 'none', borderRadius: 6, color: '#000', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
          >
            <ChevronLeft size={16} />
            Back to Nodes
          </button>
        </div>
      </div>
    );
  }

  const dataServed = node.stats?.total_bytes || 0;
  const cpuPercent = node.stats?.cpu_percent || 0;
  const ramPercent = node.stats?.ram_percent || (node.stats?.ram_total ? (node.stats.ram_used / node.stats.ram_total) * 100 : 0);
  const storagePercent = node.storage_committed ? (node.storage_used / node.storage_committed) * 100 : 0;

  return (
    <div style={{ minHeight: '100vh', background: bgBase }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 24px', borderBottom: `1px solid ${border}`, background: bgRaised }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            onClick={() => router.push('/dashboard/nodes')}
            style={{ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', background: bgElevated, border: `1px solid ${border}`, borderRadius: 6, cursor: 'pointer' }}
          >
            <ChevronLeft size={16} color={textSecondary} />
          </button>
          <Server size={18} color={accentColor} />
          <span style={{ color: textPrimary, fontSize: 15, fontWeight: 600 }}>Node Details</span>
          <span style={{
            padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600,
            background: node.online ? (node.is_public ? 'rgba(34, 197, 94, 0.1)' : 'rgba(245, 158, 11, 0.1)') : 'rgba(239, 68, 68, 0.1)',
            color: node.online ? (node.is_public ? '#22c55e' : '#f59e0b') : '#ef4444'
          }}>
            {node.online ? (node.is_public ? 'Public' : 'Private') : 'Offline'}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ color: textMuted, fontSize: 11 }}>Refresh in {countdown}s</span>
          <button
            onClick={fetchData}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', background: bgElevated, border: `1px solid ${border}`, borderRadius: 6, cursor: 'pointer', color: textSecondary, fontSize: 12 }}
          >
            <RefreshCw size={12} />
            Refresh
          </button>
        </div>
      </div>

      <div style={{ padding: 24 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24, padding: 20, background: bgRaised, borderRadius: 8, border: `1px solid ${border}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 56, height: 56, borderRadius: 12, background: bgElevated, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Server size={28} color={accentColor} />
            </div>
            <div>
              <h1 style={{ fontSize: 20, fontWeight: 800, color: textPrimary, marginBottom: 4, fontFamily: 'monospace' }}>{node.address}</h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: textSecondary, fontSize: 12 }}>
                  <GitBranch size={12} />
                  v{node.version}
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: textSecondary, fontSize: 12 }}>
                  <MapPin size={12} />
                  {node.location?.city || 'Unknown'}, {node.location?.country || 'Unknown'}
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: textSecondary, fontSize: 12 }}>
                  <Clock size={12} />
                  Last seen {formatLastSeen(node.last_seen_timestamp)}
                </span>
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              onClick={() => copyToClipboard(node.address, 'address')}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', background: bgElevated, border: `1px solid ${border}`, borderRadius: 6, cursor: 'pointer', color: textSecondary, fontSize: 12 }}
            >
              {copied === 'address' ? <Check size={14} color="#22c55e" /> : <Copy size={14} />}
              Copy IP
            </button>
            <button
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', background: bgElevated, border: `1px solid ${border}`, borderRadius: 6, cursor: 'pointer', color: textSecondary, fontSize: 12 }}
            >
              <Share2 size={14} />
              Share
            </button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
          {[
            { label: 'Credits', value: formatCredits(nodeCredits), sub: 'Earned pod credits', color: '#8b5cf6', icon: Coins },
            { label: 'Uptime', value: formatUptime(node.uptime), sub: 'Current session', color: '#22c55e', icon: Clock },
            { label: 'Data Served', value: formatBytes(dataServed), sub: 'Total bytes served', color: '#f59e0b', icon: Send },
            { label: 'Rank', value: `#${nodeRank.rank}`, sub: `Top ${100 - nodeRank.percentile}% of ${nodeRank.total}`, color: '#3b82f6', icon: Trophy },
          ].map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} style={{ padding: '20px 16px', borderRadius: 8, background: bgRaised, border: `1px solid ${border}` }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <span style={{ color: textSecondary, fontSize: 12, fontWeight: 600 }}>{stat.label}</span>
                  <div style={{ width: 32, height: 32, borderRadius: 6, background: `${stat.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon size={16} color={stat.color} />
                  </div>
                </div>
                <div style={{ fontSize: 32, fontWeight: 800, color: textPrimary, marginBottom: 8, lineHeight: 1 }}>{stat.value}</div>
                <div style={{ color: textMuted, fontSize: 12 }}>{stat.sub}</div>
              </div>
            );
          })}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 24 }}>
          <div style={{ padding: 20, borderRadius: 8, background: bgRaised, border: `1px solid ${border}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
              <Activity size={16} color={textSecondary} />
              <span style={{ color: textPrimary, fontSize: 13, fontWeight: 600 }}>System Performance</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: textSecondary, fontSize: 12 }}>
                    <Cpu size={12} />
                    CPU Usage
                  </span>
                  <span style={{ color: textPrimary, fontSize: 14, fontWeight: 800 }}>{cpuPercent.toFixed(1)}%</span>
                </div>
                <div style={{ height: 6, background: bgElevated, borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${cpuPercent}%`, background: '#22c55e', borderRadius: 3 }} />
                </div>
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: textSecondary, fontSize: 12 }}>
                    <HardDrive size={12} />
                    Memory
                  </span>
                  <span style={{ color: textPrimary, fontSize: 14, fontWeight: 800 }}>
                    {node.stats?.ram_used ? formatBytes(node.stats.ram_used) : '-'} / {node.stats?.ram_total ? formatBytes(node.stats.ram_total) : '-'}
                  </span>
                </div>
                <div style={{ height: 6, background: bgElevated, borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${ramPercent}%`, background: '#3b82f6', borderRadius: 3 }} />
                </div>
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: textSecondary, fontSize: 12 }}>
                    <HardDrive size={12} />
                    Storage
                  </span>
                  <span style={{ color: textPrimary, fontSize: 14, fontWeight: 800 }}>
                    {formatBytes(node.storage_used)} / {formatBytes(node.storage_committed)}
                  </span>
                </div>
                <div style={{ height: 6, background: bgElevated, borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${storagePercent}%`, background: '#8b5cf6', borderRadius: 3 }} />
                </div>
              </div>
            </div>
          </div>

          <div style={{ padding: 20, borderRadius: 8, background: bgRaised, border: `1px solid ${border}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
              <Activity size={16} color={textSecondary} />
              <span style={{ color: textPrimary, fontSize: 13, fontWeight: 600 }}>Network Traffic</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div style={{ padding: 16, background: bgElevated, borderRadius: 8, textAlign: 'center' }}>
                <Download size={20} color="#22c55e" style={{ margin: '0 auto 8px' }} />
                <div style={{ fontSize: 22, fontWeight: 800, color: textPrimary, marginBottom: 4 }}>
                  {node.stats?.packets_received?.toLocaleString() || '-'}
                </div>
                <div style={{ color: textMuted, fontSize: 10 }}>Packets Received</div>
              </div>
              <div style={{ padding: 16, background: bgElevated, borderRadius: 8, textAlign: 'center' }}>
                <Send size={20} color="#3b82f6" style={{ margin: '0 auto 8px' }} />
                <div style={{ fontSize: 22, fontWeight: 800, color: textPrimary, marginBottom: 4 }}>
                  {node.stats?.packets_sent?.toLocaleString() || '-'}
                </div>
                <div style={{ color: textMuted, fontSize: 10 }}>Packets Sent</div>
              </div>
            </div>
            <div style={{ marginTop: 16, padding: 12, background: bgElevated, borderRadius: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 8, color: textSecondary, fontSize: 12 }}>
                  <GitBranch size={14} />
                  Active Streams
                </span>
                <span style={{ fontSize: 20, fontWeight: 800, color: textPrimary }}>{node.stats?.active_streams || 0}</span>
              </div>
            </div>
          </div>

          <div style={{ padding: 20, borderRadius: 8, background: bgRaised, border: `1px solid ${border}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
              <Globe size={16} color={textSecondary} />
              <span style={{ color: textPrimary, fontSize: 13, fontWeight: 600 }}>Location & Identity</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <div style={{ color: textMuted, fontSize: 10, fontWeight: 600, marginBottom: 6, letterSpacing: '0.5px' }}>PUBLIC KEY</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <code style={{ flex: 1, padding: '10px 12px', background: bgElevated, borderRadius: 6, color: textSecondary, fontSize: 11, fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {node.pubkey || 'Unknown'}
                  </code>
                  <button
                    onClick={() => copyToClipboard(node.pubkey || '', 'pubkey')}
                    style={{ width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', background: bgElevated, border: `1px solid ${border}`, borderRadius: 6, cursor: 'pointer' }}
                  >
                    {copied === 'pubkey' ? <Check size={14} color="#22c55e" /> : <Copy size={14} color={textSecondary} />}
                  </button>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <div style={{ color: textMuted, fontSize: 10, fontWeight: 600, marginBottom: 4, letterSpacing: '0.5px' }}>COUNTRY</div>
                  <div style={{ color: textPrimary, fontSize: 13, fontWeight: 600 }}>{node.location?.country || 'Unknown'}</div>
                </div>
                <div>
                  <div style={{ color: textMuted, fontSize: 10, fontWeight: 600, marginBottom: 4, letterSpacing: '0.5px' }}>CITY</div>
                  <div style={{ color: textPrimary, fontSize: 13, fontWeight: 600 }}>{node.location?.city || 'Unknown'}</div>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <div style={{ color: textMuted, fontSize: 10, fontWeight: 600, marginBottom: 4, letterSpacing: '0.5px' }}>VERSION</div>
                  <div style={{ color: textPrimary, fontSize: 13, fontWeight: 600 }}>{node.version}</div>
                </div>
                <div>
                  <div style={{ color: textMuted, fontSize: 10, fontWeight: 600, marginBottom: 4, letterSpacing: '0.5px' }}>TYPE</div>
                  <div style={{ color: node.is_public ? '#22c55e' : '#f59e0b', fontSize: 13, fontWeight: 600 }}>{node.is_public ? 'Public RPC' : 'Private'}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 16, marginBottom: 24 }}>
          {healthScore && (
            <div style={{ padding: 20, borderRadius: 8, background: bgRaised, border: `1px solid ${border}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
                <Trophy size={16} color={accentColor} />
                <span style={{ color: textPrimary, fontSize: 13, fontWeight: 600 }}>Operational Score</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
                <HealthScore score={healthScore} size="lg" showBreakdown />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div style={{ padding: 12, background: bgElevated, borderRadius: 6, textAlign: 'center' }}>
                  <div style={{ color: textSecondary, fontSize: 10, marginBottom: 4 }}>AVAILABILITY</div>
                  <div style={{ color: '#22c55e', fontSize: 18, fontWeight: 800 }}>{healthScore.components.availability.score}</div>
                </div>
                <div style={{ padding: 12, background: bgElevated, borderRadius: 6, textAlign: 'center' }}>
                  <div style={{ color: textSecondary, fontSize: 10, marginBottom: 4 }}>PERFORMANCE</div>
                  <div style={{ color: '#3b82f6', fontSize: 18, fontWeight: 800 }}>{healthScore.components.performance.score}</div>
                </div>
                <div style={{ padding: 12, background: bgElevated, borderRadius: 6, textAlign: 'center' }}>
                  <div style={{ color: textSecondary, fontSize: 10, marginBottom: 4 }}>STORAGE</div>
                  <div style={{ color: '#8b5cf6', fontSize: 18, fontWeight: 800 }}>{healthScore.components.storage.score}</div>
                </div>
                <div style={{ padding: 12, background: bgElevated, borderRadius: 6, textAlign: 'center' }}>
                  <div style={{ color: textSecondary, fontSize: 10, marginBottom: 4 }}>SESSION</div>
                  <div style={{ color: '#f59e0b', fontSize: 18, fontWeight: 800 }}>{healthScore.components.uptime.score}</div>
                </div>
              </div>
            </div>
          )}

          <div style={{ padding: 20, borderRadius: 8, background: bgRaised, border: `1px solid ${border}` }}>
            <MultiMetricChart
              metrics={[
                { label: 'CPU', value: cpuPercent, color: '#22c55e', unit: '%' },
                { label: 'RAM', value: ramPercent, color: '#3b82f6', unit: '%' },
                { label: 'Storage', value: storagePercent, color: '#8b5cf6', unit: '%' },
              ]}
              height={140}
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          <PerformanceChart
            value={cpuPercent}
            color="#22c55e"
            label="CPU Usage"
            unit="%"
            height={50}
          />
          <PerformanceChart
            value={ramPercent}
            color="#3b82f6"
            label="Memory Usage"
            unit="%"
            height={50}
          />
          <PerformanceChart
            value={storagePercent}
            color="#8b5cf6"
            label="Storage Usage"
            unit="%"
            height={50}
          />
        </div>
      </div>
    </div>
  );
}
