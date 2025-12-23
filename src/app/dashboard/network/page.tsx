'use client';

import { useEffect, useState, useMemo } from 'react';
import { RefreshCw, Users, Zap, Hash, Cpu, MemoryStick, Activity, Network, Award } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { usePreferences } from '@/contexts/preferences-context';

interface PNodeStats {
  cpu_percent: number;
  ram_used: number;
  ram_total: number;
  ram_percent: number;
  packets_received: number;
  packets_sent: number;
  active_streams: number;
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
  location?: { country: string; city: string };
  stats?: PNodeStats | null;
}

interface NetworkOverview {
  total_pnodes: number;
  online_pnodes: number;
  version_distribution: Record<string, number>;
  location_distribution: Record<string, number>;
  avg_cpu_percent: number;
  avg_ram_percent: number;
  total_ram: number;
  total_packets_received: number;
  total_packets_sent: number;
  total_active_streams: number;
}

const COLORS = ['#22c55e', '#f59e0b', '#3b82f6', '#ef4444', '#8b5cf6', '#ec4899'];

export default function NetworkPage() {
  const { preferences, resolvedTheme } = usePreferences();
  const refreshInterval = preferences.autoRefreshInterval;
  const [pNodes, setPNodes] = useState<PNode[]>([]);
  const [overview, setOverview] = useState<NetworkOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [countdown, setCountdown] = useState(refreshInterval);
  const [activeTab, setActiveTab] = useState<'overview' | 'performance'>('overview');

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
      const [pnodesRes, networkRes] = await Promise.all([
        fetch('/api/pnodes'),
        fetch('/api/network'),
      ]);
      const pnodesData = await pnodesRes.json();
      const networkData = await networkRes.json();
      setPNodes(pnodesData.pNodes || []);
      setOverview(networkData.overview || null);
    } catch (err) {
      console.error('Failed to fetch data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) { fetchData(); return refreshInterval; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [refreshInterval]);

  const stats = useMemo(() => {
    const online = pNodes.filter((n) => n.online).length;
    const publicRpc = pNodes.filter((n) => n.is_public && n.online).length;
    const avgUptime = pNodes.length > 0 ? Math.round(pNodes.reduce((sum, n) => sum + (n.uptime || 0), 0) / pNodes.length) : 0;
    return { online, total: pNodes.length, publicRpc, avgUptime };
  }, [pNodes]);

  const versionData = useMemo(() => {
    if (!overview?.version_distribution) return [];
    return Object.entries(overview.version_distribution)
      .map(([version, count]) => ({ name: version, value: count }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  }, [overview]);

  const countryData = useMemo(() => {
    if (!overview?.location_distribution) return [];
    const entries = Object.entries(overview.location_distribution)
      .map(([country, count]) => ({ country, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
    const max = entries[0]?.count || 1;
    return entries.map(e => ({ ...e, percent: (e.count / max) * 100 }));
  }, [overview]);

  const topNodes = useMemo(() => {
    return [...pNodes]
      .filter(n => n.online)
      .sort((a, b) => (b.uptime || 0) - (a.uptime || 0))
      .slice(0, 5);
  }, [pNodes]);

  const nodesWithStats = useMemo(() => {
    return pNodes.filter(n => n.stats !== null && n.stats !== undefined);
  }, [pNodes]);

  const cpuData = useMemo(() => {
    return nodesWithStats.slice(0, 20).map(n => ({
      name: n.address.split(':')[0].split('.').slice(-1)[0],
      value: n.stats?.cpu_percent || 0,
    }));
  }, [nodesWithStats]);

  const ramData = useMemo(() => {
    return nodesWithStats.slice(0, 20).map(n => ({
      name: n.address.split(':')[0].split('.').slice(-1)[0],
      value: n.stats?.ram_percent || 0,
    }));
  }, [nodesWithStats]);

  const trafficPerNode = useMemo(() => {
    return nodesWithStats.slice(0, 20).map(n => ({
      name: n.address.split(':')[0].split('.').slice(-1)[0],
      value: (n.stats?.packets_received || 0) + (n.stats?.packets_sent || 0),
    }));
  }, [nodesWithStats]);

  const streamsData = useMemo(() => {
    return nodesWithStats.slice(0, 20).map(n => ({
      name: n.address.split(':')[0].split('.').slice(-1)[0],
      value: n.stats?.active_streams || 0,
    }));
  }, [nodesWithStats]);

  const topPerformers = useMemo(() => {
    return [...pNodes]
      .sort((a, b) => {
        if (a.stats && !b.stats) return -1;
        if (!a.stats && b.stats) return 1;
        return (b.uptime || 0) - (a.uptime || 0);
      })
      .slice(0, 10);
  }, [pNodes]);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: bgBase }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 32, height: 32, border: `2px solid ${borderHover}`, borderTopColor: '#22c55e', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 12px' }} />
          <p style={{ color: textSecondary, fontSize: 13 }}>Loading network data...</p>
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
          <span style={{ color: textPrimary, fontSize: 15, fontWeight: 600 }}>Network</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px', borderRadius: 6, background: bgElevated, border: `1px solid ${borderHover}` }}>
            <span style={{ color: textMuted, fontSize: 12 }}>Next refresh</span>
            <span style={{ color: accentColor, fontSize: 12, fontWeight: 600, fontFamily: 'monospace' }}>{countdown}s</span>
            <button onClick={() => { fetchData(); setCountdown(30); }} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 2 }}>
              <RefreshCw size={14} color={textMuted} />
            </button>
          </div>
        </div>
      </header>

      <div style={{ padding: 20 }}>
        <div style={{ marginBottom: 20 }}>
          <h1 style={{ color: textPrimary, fontSize: 20, fontWeight: 600, marginBottom: 4 }}>Network Overview</h1>
          <p style={{ color: textMuted, fontSize: 13 }}>Real-time network statistics and performance metrics</p>
        </div>

        <div style={{ display: 'inline-flex', gap: 0, marginBottom: 20, background: bgRaised, borderRadius: 6, padding: 4, border: `1px solid ${border}` }}>
          <button
            onClick={() => setActiveTab('overview')}
            style={{
              padding: '8px 20px', borderRadius: 4, fontSize: 13, fontWeight: 500, cursor: 'pointer', border: 'none',
              background: activeTab === 'overview' ? bgElevated : 'transparent',
              color: activeTab === 'overview' ? textPrimary : textMuted,
            }}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('performance')}
            style={{
              padding: '8px 20px', borderRadius: 4, fontSize: 13, fontWeight: 500, cursor: 'pointer', border: 'none',
              background: activeTab === 'performance' ? bgElevated : 'transparent',
              color: activeTab === 'performance' ? textPrimary : textMuted,
            }}
          >
            Performance
          </button>
        </div>

        {activeTab === 'overview' && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
              {[
                { label: 'Active Nodes', value: stats.online, sub: `of ${stats.total} total`, icon: Users },
                { label: 'Network Traffic', value: ((overview?.total_packets_received || 0) + (overview?.total_packets_sent || 0)).toLocaleString(), sub: 'total packets', icon: Activity },
                { label: 'Active Streams', value: overview?.total_active_streams || 0, sub: 'across network', icon: Hash },
                { label: 'Nodes Reporting', value: nodesWithStats.length, sub: 'with stats data', icon: Zap },
              ].map((stat) => {
                const Icon = stat.icon;
                return (
                  <div key={stat.label} style={{ padding: '20px 16px', borderRadius: 8, background: bgRaised, border: `1px solid ${border}` }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                      <Icon size={16} color={textSecondary} />
                      <span style={{ color: textSecondary, fontSize: 12, fontWeight: 600 }}>{stat.label}</span>
                    </div>
                    <p style={{ color: textPrimary, fontSize: 36, fontWeight: 800, lineHeight: 1, marginBottom: 4 }}>{stat.value}</p>
                    <p style={{ color: textMuted, fontSize: 12 }}>{stat.sub}</p>
                  </div>
                );
              })}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
              <div style={{ borderRadius: 8, background: bgRaised, border: `1px solid ${border}` }}>
                <div style={{ padding: '14px 16px', borderBottom: `1px solid ${border}` }}>
                  <p style={{ color: textPrimary, fontSize: 14, fontWeight: 600 }}>Version Distribution</p>
                  <p style={{ color: textMuted, fontSize: 12 }}>Software versions across network</p>
                </div>
                <div style={{ padding: 20, display: 'flex', alignItems: 'center', gap: 28 }}>
                  <div style={{ width: 150, height: 150 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={versionData} cx="50%" cy="50%" innerRadius={45} outerRadius={65} dataKey="value" paddingAngle={2}>
                          {versionData.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle">
                          <tspan x="50%" dy="-0.3em" fill={textPrimary} fontSize="28" fontWeight="800">{stats.total}</tspan>
                          <tspan x="50%" dy="1.4em" fill={textSecondary} fontSize="11">nodes</tspan>
                        </text>
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div style={{ flex: 1 }}>
                    {versionData.map((v, idx) => (
                      <div key={v.name} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                        <span style={{ width: 10, height: 10, borderRadius: '50%', background: COLORS[idx % COLORS.length] }} />
                        <span style={{ flex: 1, color: textSecondary, fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v.name}</span>
                        <span style={{ color: textPrimary, fontSize: 16, fontWeight: 800 }}>{v.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div style={{ borderRadius: 8, background: bgRaised, border: `1px solid ${border}` }}>
                <div style={{ padding: '14px 16px', borderBottom: `1px solid ${border}` }}>
                  <p style={{ color: textPrimary, fontSize: 14, fontWeight: 600 }}>Geographic Distribution</p>
                  <p style={{ color: textMuted, fontSize: 12 }}>Top countries by node count</p>
                </div>
                <div style={{ padding: 20 }}>
                  {countryData.map((c, idx) => (
                    <div key={c.country} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                      <span style={{ color: textSecondary, fontSize: 13, fontWeight: 600, width: 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.country}</span>
                      <div style={{ flex: 1, height: 8, background: borderHover, borderRadius: 4, overflow: 'hidden' }}>
                        <div style={{ width: `${c.percent}%`, height: '100%', background: COLORS[idx % COLORS.length], borderRadius: 4 }} />
                      </div>
                      <span style={{ color: textPrimary, fontSize: 16, fontWeight: 800, width: 40, textAlign: 'right' }}>{c.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ borderRadius: 8, background: bgRaised, border: `1px solid ${border}` }}>
              <div style={{ padding: '12px 20px', borderBottom: `1px solid ${border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <p style={{ color: textPrimary, fontSize: 16, fontWeight: 600 }}>Top Active Nodes</p>
                  <p style={{ color: textMuted, fontSize: 12 }}>Highest uptime performers</p>
                </div>
                <a href="/dashboard/nodes" style={{ color: textSecondary, fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>View All →</a>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    {['#', 'Address', 'Version', 'Status', 'Uptime'].map((h) => (
                      <th key={h} style={{ padding: '10px 20px', textAlign: 'left', color: textMuted, fontSize: 12, fontWeight: 500 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {topNodes.map((node, i) => (
                    <tr key={node.pubkey} style={{ borderTop: `1px solid ${bgElevated}` }}>
                      <td style={{ padding: '10px 20px', color: textMuted, fontSize: 13 }}>{i + 1}</td>
                      <td style={{ padding: '10px 20px', fontSize: 13 }}>
                        <span style={{ color: textPrimary, fontWeight: 600 }}>{node.address}</span>
                        <span style={{ color: textMuted }}>:9001</span>
                      </td>
                      <td style={{ padding: '10px 20px', color: textSecondary, fontSize: 13, fontWeight: 600 }}>{node.version}</td>
                      <td style={{ padding: '10px 20px' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e' }} />
                          <span style={{ color: textSecondary, fontWeight: 600 }}>
                            Online ({node.is_public ? 'Public' : 'Private'})
                          </span>
                        </span>
                      </td>
                      <td style={{ padding: '10px 20px', color: textPrimary, fontSize: 15, fontWeight: 800 }}>
                        {Math.round((node.uptime || 0) / 3600)}h
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {activeTab === 'performance' && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
              <div style={{ borderRadius: 8, background: bgRaised, border: `1px solid ${border}`, overflow: 'hidden' }}>
                <div style={{ padding: '14px 16px', borderBottom: `1px solid ${border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Cpu size={16} color={textSecondary} />
                      <span style={{ color: textPrimary, fontSize: 14, fontWeight: 600 }}>CPU Usage</span>
                    </div>
                    <p style={{ color: textSecondary, fontSize: 12 }}>CPU utilization per node</p>
                  </div>
                  <span style={{ padding: '4px 10px', borderRadius: 4, background: 'rgba(34,197,94,0.15)', color: '#22c55e', fontSize: 11, fontWeight: 500 }}>Live</span>
                </div>
                <div style={{ padding: '16px 16px 8px' }}>
                  <p style={{ color: '#a855f7', fontSize: 28, fontWeight: 800, marginBottom: 16 }}>{overview?.avg_cpu_percent?.toFixed(1) || 0}% avg</p>
                </div>
                <div style={{ height: 180, padding: '0 16px 16px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={cpuData}>
                      <XAxis dataKey="name" tick={{ fill: textMuted, fontSize: 9 }} axisLine={false} tickLine={false} interval={0} angle={-45} textAnchor="end" height={50} />
                      <YAxis tick={{ fill: textMuted, fontSize: 10 }} axisLine={false} tickLine={false} domain={[0, 100]} />
                      <Tooltip contentStyle={{ backgroundColor: bgElevated, border: `1px solid ${borderHover}`, borderRadius: 6, fontSize: 12 }} formatter={(value: number) => [`${value.toFixed(1)}%`, 'CPU']} />
                      <Bar dataKey="value" fill="#a855f7" radius={[2, 2, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div style={{ borderRadius: 8, background: bgRaised, border: `1px solid ${border}`, overflow: 'hidden' }}>
                <div style={{ padding: '14px 16px', borderBottom: `1px solid ${border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <MemoryStick size={16} color={textSecondary} />
                      <span style={{ color: textPrimary, fontSize: 14, fontWeight: 600 }}>RAM Usage</span>
                    </div>
                    <p style={{ color: textSecondary, fontSize: 12 }}>Memory utilization per node</p>
                  </div>
                  <span style={{ padding: '4px 10px', borderRadius: 4, background: 'rgba(34,197,94,0.15)', color: '#22c55e', fontSize: 11, fontWeight: 500 }}>Live</span>
                </div>
                <div style={{ padding: '16px 16px 8px' }}>
                  <p style={{ color: '#22c55e', fontSize: 28, fontWeight: 800, marginBottom: 16 }}>{overview?.avg_ram_percent?.toFixed(1) || 0}% avg</p>
                </div>
                <div style={{ height: 180, padding: '0 16px 16px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={ramData}>
                      <XAxis dataKey="name" tick={{ fill: textMuted, fontSize: 9 }} axisLine={false} tickLine={false} interval={0} angle={-45} textAnchor="end" height={50} />
                      <YAxis tick={{ fill: textMuted, fontSize: 10 }} axisLine={false} tickLine={false} domain={[0, 100]} />
                      <Tooltip contentStyle={{ backgroundColor: bgElevated, border: `1px solid ${borderHover}`, borderRadius: 6, fontSize: 12 }} formatter={(value: number) => [`${value.toFixed(1)}%`, 'RAM']} />
                      <Bar dataKey="value" fill="#22c55e" radius={[2, 2, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
              <div style={{ borderRadius: 8, background: bgRaised, border: `1px solid ${border}`, overflow: 'hidden' }}>
                <div style={{ padding: '14px 16px', borderBottom: `1px solid ${border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Activity size={16} color={textSecondary} />
                      <span style={{ color: textPrimary, fontSize: 14, fontWeight: 600 }}>Network Traffic</span>
                    </div>
                    <p style={{ color: textSecondary, fontSize: 12 }}>Packets sent/received per node</p>
                  </div>
                  <span style={{ padding: '4px 10px', borderRadius: 4, background: 'rgba(34,197,94,0.15)', color: '#22c55e', fontSize: 11, fontWeight: 500 }}>Live</span>
                </div>
                <div style={{ padding: '16px 16px 8px' }}>
                  <p style={{ color: accentColor, fontSize: 28, fontWeight: 800, marginBottom: 16 }}>{((overview?.total_packets_received || 0) + (overview?.total_packets_sent || 0)).toLocaleString()} pkts</p>
                </div>
                <div style={{ height: 180, padding: '0 16px 16px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={trafficPerNode}>
                      <XAxis dataKey="name" tick={{ fill: textMuted, fontSize: 9 }} axisLine={false} tickLine={false} interval={0} angle={-45} textAnchor="end" height={50} />
                      <YAxis tick={{ fill: textMuted, fontSize: 10 }} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={{ backgroundColor: bgElevated, border: `1px solid ${borderHover}`, borderRadius: 6, fontSize: 12 }} formatter={(value: number) => [value.toLocaleString(), 'Packets']} />
                      <Bar dataKey="value" fill={accentColor} radius={[2, 2, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div style={{ borderRadius: 8, background: bgRaised, border: `1px solid ${border}`, overflow: 'hidden' }}>
                <div style={{ padding: '14px 16px', borderBottom: `1px solid ${border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Zap size={16} color={textSecondary} />
                      <span style={{ color: textPrimary, fontSize: 14, fontWeight: 600 }}>Active Streams</span>
                    </div>
                    <p style={{ color: textSecondary, fontSize: 12 }}>Data streams per node</p>
                  </div>
                  <span style={{ padding: '4px 10px', borderRadius: 4, background: 'rgba(34,197,94,0.15)', color: '#22c55e', fontSize: 11, fontWeight: 500 }}>Live</span>
                </div>
                <div style={{ padding: '16px 16px 8px' }}>
                  <p style={{ color: accentColor, fontSize: 28, fontWeight: 800, marginBottom: 16 }}>{overview?.total_active_streams || 0} total</p>
                </div>
                <div style={{ height: 180, padding: '0 16px 16px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={streamsData}>
                      <XAxis dataKey="name" tick={{ fill: textMuted, fontSize: 9 }} axisLine={false} tickLine={false} interval={0} angle={-45} textAnchor="end" height={50} />
                      <YAxis tick={{ fill: textMuted, fontSize: 10 }} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={{ backgroundColor: bgElevated, border: `1px solid ${borderHover}`, borderRadius: 6, fontSize: 12 }} formatter={(value: number) => [value, 'Streams']} />
                      <Bar dataKey="value" fill={accentColor} radius={[2, 2, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            <div style={{ marginBottom: 20 }}>
              <h2 style={{ color: textPrimary, fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Top Active Nodes</h2>
            </div>

            <div style={{ borderRadius: 8, background: bgRaised, border: `1px solid ${border}` }}>
              <div style={{ padding: '12px 20px', borderBottom: `1px solid ${border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Award size={18} color={accentColor} />
                  <span style={{ color: textPrimary, fontSize: 14, fontWeight: 600 }}>Top Performers by Uptime</span>
                </div>
                <a href="/dashboard/nodes" style={{ color: textSecondary, fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>View All →</a>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    {['#', 'Uptime', 'Status', 'Address', 'Version', 'CPU', 'RAM', 'Last Seen'].map((h) => (
                      <th key={h} style={{ padding: '10px 20px', textAlign: 'left', color: textMuted, fontSize: 12, fontWeight: 500 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {topPerformers.map((node, i) => (
                    <tr key={node.pubkey} style={{ borderTop: `1px solid ${bgElevated}` }}>
                      <td style={{ padding: '10px 20px', color: textMuted, fontSize: 13 }}>{i + 1}</td>
                      <td style={{ padding: '10px 20px', color: textPrimary, fontSize: 14, fontWeight: 800 }}>{Math.round((node.uptime || 0) / 3600)}h</td>
                      <td style={{ padding: '10px 20px' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                          <span style={{ width: 6, height: 6, borderRadius: '50%', background: node.online ? '#22c55e' : '#ef4444' }} />
                          <span style={{ color: textSecondary, fontWeight: 600 }}>
                            {node.online ? `Online (${node.is_public ? 'Public' : 'Private'})` : 'Offline'}
                          </span>
                        </span>
                      </td>
                      <td style={{ padding: '10px 20px', fontSize: 13 }}>
                        <span style={{ color: textPrimary, fontWeight: 600 }}>{node.address}</span>
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
          </>
        )}

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
