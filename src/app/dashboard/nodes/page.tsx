'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Server, Wifi, WifiOff, Clock, Search, ChevronLeft, ChevronRight, ArrowUpDown, RefreshCw, Filter, Coins } from 'lucide-react';
import { usePreferences } from '@/contexts/preferences-context';

interface CreditsMap {
  [pubkey: string]: number;
}

interface PNodeStats {
  cpu_percent: number;
  ram_percent: number;
  packets_received: number;
  packets_sent: number;
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
  location?: {
    country: string;
    city: string;
  };
  stats?: PNodeStats | null;
}

type SortField = 'status' | 'address' | 'version' | 'uptime' | 'last_seen' | 'credits';
type SortOrder = 'asc' | 'desc';

export default function NodesPage() {
  const router = useRouter();
  const { preferences, resolvedTheme } = usePreferences();
  const refreshInterval = preferences.autoRefreshInterval;
  const [pNodes, setPNodes] = useState<PNode[]>([]);
  const [credits, setCredits] = useState<CreditsMap>({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'online' | 'offline'>('all');
  const [versionFilter, setVersionFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<SortField>('credits');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [page, setPage] = useState(1);
  const [countdown, setCountdown] = useState(refreshInterval);
  const pageSize = 15;

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
      setPNodes(nodesData.pNodes || []);
      setCredits(creditsData.credits || {});
      setCountdown(refreshInterval);
    } catch (err) {
      console.error('Failed to fetch data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, refreshInterval * 1000);
    return () => clearInterval(interval);
  }, [refreshInterval]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((c) => (c > 0 ? c - 1 : refreshInterval));
    }, 1000);
    return () => clearInterval(timer);
  }, [refreshInterval]);

  const versions = useMemo(() => {
    const v = new Set(pNodes.map((n) => n.version));
    return Array.from(v).sort();
  }, [pNodes]);

  const filteredNodes = useMemo(() => {
    return pNodes
      .filter((n) => {
        if (statusFilter === 'online' && !n.online) return false;
        if (statusFilter === 'offline' && n.online) return false;
        if (versionFilter !== 'all' && n.version !== versionFilter) return false;
        if (searchTerm) {
          const term = searchTerm.toLowerCase();
          return (
            n.address.toLowerCase().includes(term) ||
            n.pubkey?.toLowerCase().includes(term) ||
            n.location?.country?.toLowerCase().includes(term) ||
            n.location?.city?.toLowerCase().includes(term)
          );
        }
        return true;
      })
      .sort((a, b) => {
        let comparison = 0;
        switch (sortField) {
          case 'status':
            comparison = (a.online ? 1 : 0) - (b.online ? 1 : 0);
            break;
          case 'address':
            comparison = a.address.localeCompare(b.address);
            break;
          case 'version':
            comparison = a.version.localeCompare(b.version);
            break;
          case 'uptime':
            comparison = (a.uptime || 0) - (b.uptime || 0);
            break;
          case 'last_seen':
            comparison = a.last_seen_timestamp - b.last_seen_timestamp;
            break;
          case 'credits':
            comparison = (credits[a.pubkey] || 0) - (credits[b.pubkey] || 0);
            break;
        }
        return sortOrder === 'asc' ? comparison : -comparison;
      });
  }, [pNodes, searchTerm, statusFilter, versionFilter, sortField, sortOrder, credits]);

  const paginatedNodes = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredNodes.slice(start, start + pageSize);
  }, [filteredNodes, page]);

  const totalPages = Math.ceil(filteredNodes.length / pageSize);

  const stats = useMemo(() => {
    const total = pNodes.length;
    const online = pNodes.filter((n) => n.online).length;
    const publicNodes = pNodes.filter((n) => n.online && n.is_public).length;
    const offline = total - online;
    const avgUptime = pNodes.reduce((sum, n) => sum + (n.uptime || 0), 0) / (pNodes.length || 1);
    const days = Math.floor(avgUptime / 86400);
    const totalCredits = Object.values(credits).reduce((sum, c) => sum + c, 0);
    return { total, online, publicNodes, offline, avgUptime: `${days}d`, totalCredits };
  }, [pNodes, credits]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const formatUptime = (seconds: number) => {
    if (!seconds) return '-';
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    if (days > 0) return `${days}d ${hours}h`;
    const mins = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${mins}m`;
  };

  const formatLastSeen = (timestamp: number) => {
    const ageMs = Date.now() - timestamp * 1000;
    const seconds = Math.floor(ageMs / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
  };

  const formatStorage = (bytes: number) => {
    if (!bytes) return '-';
    const gb = bytes / (1024 * 1024 * 1024);
    if (gb >= 1000) return `${(gb / 1000).toFixed(1)} TB`;
    return `${gb.toFixed(1)} GB`;
  };

  const formatCredits = (amount: number) => {
    if (!amount) return '0';
    if (amount >= 1000000) return `${(amount / 1000000).toFixed(1)}M`;
    if (amount >= 1000) return `${(amount / 1000).toFixed(1)}K`;
    return amount.toLocaleString();
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: bgBase, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 40, height: 40, borderRadius: '50%', border: `2px solid ${border}`, borderTopColor: accentColor, animation: 'spin 1s linear infinite' }} />
          <p style={{ color: textSecondary, fontSize: 13 }}>Loading nodes...</p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: bgBase }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 24px', borderBottom: `1px solid ${border}`, background: bgRaised }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Server size={18} color={accentColor} />
          <span style={{ color: textPrimary, fontSize: 15, fontWeight: 600 }}>All Nodes</span>
          <span style={{ padding: '2px 8px', borderRadius: 4, background: 'rgba(34, 197, 94, 0.1)', color: '#22c55e', fontSize: 11, fontWeight: 600 }}>
            {stats.online} Online
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ color: textMuted, fontSize: 11 }}>Refresh in {countdown}s</span>
          <button
            onClick={fetchData}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', background: bgElevated, border: `1px solid ${borderHover}`, borderRadius: 6, cursor: 'pointer', color: textSecondary, fontSize: 12 }}
          >
            <RefreshCw size={12} />
            Refresh
          </button>
        </div>
      </div>

      <div style={{ padding: 24 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
          {[
            { label: 'Total Nodes', value: stats.total, sub: 'Registered pNodes', color: '#3b82f6', icon: Server },
            { label: 'Online', value: stats.online, sub: 'Currently active', color: '#22c55e', icon: Wifi },
            { label: 'Public RPC', value: stats.publicNodes, sub: 'Public endpoints', color: accentColor, icon: Wifi },
            { label: 'Total Credits', value: formatCredits(stats.totalCredits), sub: `Across ${Object.keys(credits).length} pods`, color: '#8b5cf6', icon: Coins },
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
                <div style={{ fontSize: 36, fontWeight: 800, color: textPrimary, marginBottom: 8, lineHeight: 1 }}>{stat.value}</div>
                <div style={{ color: textMuted, fontSize: 12 }}>{stat.sub}</div>
              </div>
            );
          })}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, padding: 12, background: bgRaised, borderRadius: 8, border: `1px solid ${border}` }}>
          <Filter size={14} color={textMuted} />
          <div style={{ position: 'relative', flex: 1, maxWidth: 300 }}>
            <Search size={14} color={textMuted} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              placeholder="Search IP, Pubkey, Location..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
              style={{ width: '100%', height: 32, paddingLeft: 32, paddingRight: 12, borderRadius: 6, background: bgElevated, border: `1px solid ${borderHover}`, color: textPrimary, fontSize: 12, outline: 'none' }}
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value as typeof statusFilter); setPage(1); }}
            style={{ height: 32, padding: '0 12px', borderRadius: 6, background: bgElevated, border: `1px solid ${borderHover}`, color: textSecondary, fontSize: 12, cursor: 'pointer', outline: 'none' }}
          >
            <option value="all">All Status</option>
            <option value="online">Online</option>
            <option value="offline">Offline</option>
          </select>
          <select
            value={versionFilter}
            onChange={(e) => { setVersionFilter(e.target.value); setPage(1); }}
            style={{ height: 32, padding: '0 12px', borderRadius: 6, background: bgElevated, border: `1px solid ${borderHover}`, color: textSecondary, fontSize: 12, cursor: 'pointer', outline: 'none' }}
          >
            <option value="all">All Versions</option>
            {versions.map((v) => (
              <option key={v} value={v}>{v}</option>
            ))}
          </select>
          <span style={{ marginLeft: 'auto', color: textMuted, fontSize: 11 }}>
            {filteredNodes.length} results
          </span>
        </div>

        <div style={{ borderRadius: 8, overflow: 'hidden', background: bgRaised, border: `1px solid ${border}` }}>
          <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', minWidth: 1000, borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {[
                  { field: 'status' as SortField, label: 'Status', width: 130 },
                  { field: 'address' as SortField, label: 'Address', width: 180 },
                  { field: 'credits' as SortField, label: 'Credits', width: 90 },
                  { field: 'version' as SortField, label: 'Version', width: 80 },
                  { field: null, label: 'Location', width: 110 },
                  { field: null, label: 'CPU', width: 60 },
                  { field: null, label: 'RAM', width: 60 },
                  { field: null, label: 'Storage', width: 80 },
                  { field: 'uptime' as SortField, label: 'Uptime', width: 80 },
                  { field: 'last_seen' as SortField, label: 'Last Seen', width: 80 },
                ].map((col) => (
                  <th
                    key={col.label}
                    onClick={() => col.field && handleSort(col.field)}
                    style={{ padding: '10px 20px', textAlign: 'left', fontSize: 12, fontWeight: 500, color: textMuted, cursor: col.field ? 'pointer' : 'default', width: col.width }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      {col.label}
                      {col.field && (
                        <ArrowUpDown size={10} color={sortField === col.field ? accentColor : textMuted} />
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginatedNodes.map((node, idx) => (
                <tr
                  key={node.address}
                  onClick={() => router.push(`/dashboard/nodes/${node.address.split(':')[0]}`)}
                  style={{ cursor: 'pointer', borderTop: `1px solid ${bgElevated}` }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = bgElevated)}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
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
                    <span style={{ color: textMuted }}>:{node.address.split(':')[1] || '9001'}</span>
                  </td>
                  <td style={{ padding: '10px 20px' }}>
                    <span style={{ fontSize: 14, color: credits[node.pubkey] ? accentColor : textMuted, fontWeight: 800 }}>
                      {formatCredits(credits[node.pubkey] || 0)}
                    </span>
                  </td>
                  <td style={{ padding: '10px 20px' }}>
                    <span style={{ fontSize: 13, color: textSecondary, fontWeight: 600 }}>{node.version}</span>
                  </td>
                  <td style={{ padding: '10px 20px' }}>
                    <span style={{ fontSize: 13, color: textSecondary, fontWeight: 600 }}>
                      {node.location ? `${node.location.city || ''}, ${node.location.country || ''}` : '–'}
                    </span>
                  </td>
                  <td style={{ padding: '10px 20px' }}>
                    <span style={{ fontSize: 13, color: node.stats ? '#a855f7' : textMuted, fontWeight: 600 }}>
                      {node.stats ? `${node.stats.cpu_percent.toFixed(1)}%` : '–'}
                    </span>
                  </td>
                  <td style={{ padding: '10px 20px' }}>
                    <span style={{ fontSize: 13, color: node.stats ? '#22c55e' : textMuted, fontWeight: 600 }}>
                      {node.stats ? `${node.stats.ram_percent.toFixed(1)}%` : '–'}
                    </span>
                  </td>
                  <td style={{ padding: '10px 20px' }}>
                    <span style={{ fontSize: 13, color: textSecondary, fontWeight: 600 }}>
                      {formatStorage(node.storage_committed)}
                    </span>
                  </td>
                  <td style={{ padding: '10px 20px' }}>
                    <span style={{ fontSize: 14, color: textPrimary, fontWeight: 800 }}>{formatUptime(node.uptime)}</span>
                  </td>
                  <td style={{ padding: '10px 20px' }}>
                    <span style={{ fontSize: 13, color: textSecondary, fontWeight: 600 }}>{formatLastSeen(node.last_seen_timestamp)}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderTop: `1px solid ${border}`, background: resolvedTheme === 'light' ? '#fafafa' : '#151515' }}>
            <span style={{ color: textMuted, fontSize: 11 }}>
              Showing {(page - 1) * pageSize + 1} - {Math.min(page * pageSize, filteredNodes.length)} of {filteredNodes.length} nodes
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 10px', borderRadius: 6, background: bgElevated, border: `1px solid ${borderHover}`, color: page === 1 ? textMuted : textSecondary, fontSize: 11, cursor: page === 1 ? 'not-allowed' : 'pointer' }}
              >
                <ChevronLeft size={12} />
                Prev
              </button>
              <div style={{ display: 'flex', gap: 4 }}>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (page <= 3) {
                    pageNum = i + 1;
                  } else if (page >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = page - 2 + i;
                  }
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setPage(pageNum)}
                      style={{
                        width: 28, height: 28, borderRadius: 4, fontSize: 11, cursor: 'pointer', border: 'none',
                        background: page === pageNum ? accentColor : bgElevated,
                        color: page === pageNum ? '#000' : textSecondary
                      }}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages || totalPages === 0}
                style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 10px', borderRadius: 6, background: bgElevated, border: `1px solid ${borderHover}`, color: page === totalPages ? textMuted : textSecondary, fontSize: 11, cursor: page === totalPages ? 'not-allowed' : 'pointer' }}
              >
                Next
                <ChevronRight size={12} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
