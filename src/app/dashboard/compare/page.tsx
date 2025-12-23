'use client';

import { useState, useEffect, useMemo, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  GitCompare,
  Plus,
  X,
  Search,
  Server,
  Clock,
  Cpu,
  HardDrive,
  Activity,
  Send,
  Trophy,
  ChevronLeft,
  Check,
} from 'lucide-react';
import { usePreferences } from '@/contexts/preferences-context';
import { calculateHealthScore, HealthScoreBreakdown } from '@/lib/health-score';
import { HealthScoreBadge } from '@/components/dashboard/health-score';

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

interface ComparedNode extends PNode {
  healthScore: HealthScoreBreakdown;
  rank: number;
}

export default function ComparePage() {
  return (
    <Suspense fallback={<ComparePageLoading />}>
      <ComparePageContent />
    </Suspense>
  );
}

function ComparePageLoading() {
  return (
    <div style={{ minHeight: '100vh', background: '#121212', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 32, height: 32, border: '2px solid #2a2a2a', borderTopColor: '#f59e0b', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 12px' }} />
        <p style={{ color: '#888', fontSize: 13 }}>Loading comparison...</p>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function ComparePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { resolvedTheme } = usePreferences();
  const [allNodes, setAllNodes] = useState<PNode[]>([]);
  const [selectedNodes, setSelectedNodes] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [loading, setLoading] = useState(true);

  const bgBase = resolvedTheme === 'light' ? '#f5f5f5' : '#121212';
  const bgRaised = resolvedTheme === 'light' ? '#ffffff' : '#1a1a1a';
  const bgElevated = resolvedTheme === 'light' ? '#f0f0f0' : '#252525';
  const textPrimary = resolvedTheme === 'light' ? '#1a1a1a' : '#ffffff';
  const textSecondary = resolvedTheme === 'light' ? '#666666' : '#888888';
  const textMuted = resolvedTheme === 'light' ? '#999999' : '#666666';
  const border = resolvedTheme === 'light' ? '#e0e0e0' : '#2a2a2a';
  const accentColor = '#f59e0b';

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/pnodes');
        const data = await res.json();
        setAllNodes(data.pNodes || []);

        const nodesParam = searchParams.get('nodes');
        if (nodesParam) {
          setSelectedNodes(nodesParam.split(',').slice(0, 3));
        }
      } catch (err) {
        console.error('Failed to fetch nodes:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [searchParams]);

  const maxDataServed = useMemo(() => {
    return Math.max(...allNodes.map(n => n.stats?.total_bytes || 0), 1);
  }, [allNodes]);

  const comparedNodes: ComparedNode[] = useMemo(() => {
    const sortedByUptime = [...allNodes].filter(n => n.online).sort((a, b) => (b.uptime || 0) - (a.uptime || 0));

    return selectedNodes
      .map(addr => allNodes.find(n => n.address === addr))
      .filter((n): n is PNode => !!n)
      .map(node => {
        const rank = sortedByUptime.findIndex(n => n.address === node.address) + 1;
        const healthScore = calculateHealthScore({
          online: node.online,
          uptime: node.uptime,
          cpu_percent: node.stats?.cpu_percent,
          ram_percent: node.stats?.ram_percent,
          storage_used: node.storage_used,
          storage_committed: node.storage_committed,
          is_public: node.is_public,
        });

        return { ...node, healthScore, rank };
      });
  }, [selectedNodes, allNodes]);

  const availableNodes = useMemo(() => {
    let nodes = allNodes.filter(n => !selectedNodes.includes(n.address));

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      nodes = nodes.filter(n =>
        n.address.toLowerCase().includes(term) ||
        n.pubkey.toLowerCase().includes(term) ||
        n.location?.city?.toLowerCase().includes(term) ||
        n.location?.country?.toLowerCase().includes(term)
      );
    }

    return nodes.sort((a, b) => {
      if (a.online && !b.online) return -1;
      if (!a.online && b.online) return 1;
      return (b.uptime || 0) - (a.uptime || 0);
    });
  }, [searchTerm, allNodes, selectedNodes]);

  const addNode = (address: string) => {
    if (selectedNodes.length < 3 && !selectedNodes.includes(address)) {
      const newSelected = [...selectedNodes, address];
      setSelectedNodes(newSelected);
      setSearchTerm('');
      setShowSearch(false);
      router.replace(`/dashboard/compare?nodes=${newSelected.join(',')}`);
    }
  };

  const removeNode = (address: string) => {
    const newSelected = selectedNodes.filter(a => a !== address);
    setSelectedNodes(newSelected);
    if (newSelected.length > 0) {
      router.replace(`/dashboard/compare?nodes=${newSelected.join(',')}`);
    } else {
      router.replace('/dashboard/compare');
    }
  };

  const formatBytes = (bytes: number) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatUptime = (seconds: number) => {
    if (!seconds) return '0s';
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    if (days > 0) return `${days}d ${hours}h`;
    return `${hours}h ${Math.floor((seconds % 3600) / 60)}m`;
  };

  const getBestValue = (metric: 'uptime' | 'healthScore' | 'dataServed' | 'cpu' | 'ram') => {
    if (comparedNodes.length < 2) return null;

    switch (metric) {
      case 'uptime':
        return Math.max(...comparedNodes.map(n => n.uptime || 0));
      case 'healthScore':
        return Math.max(...comparedNodes.map(n => n.healthScore.overall));
      case 'dataServed':
        return Math.max(...comparedNodes.map(n => n.stats?.total_bytes || 0));
      case 'cpu':
        return Math.min(...comparedNodes.filter(n => n.stats).map(n => n.stats?.cpu_percent || 100));
      case 'ram':
        return Math.min(...comparedNodes.filter(n => n.stats).map(n => n.stats?.ram_percent || 100));
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: bgBase, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 32, height: 32, border: `2px solid ${border}`, borderTopColor: accentColor, borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 12px' }} />
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
          <button
            onClick={() => router.push('/dashboard/nodes')}
            style={{ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', background: bgElevated, border: `1px solid ${border}`, borderRadius: 6, cursor: 'pointer' }}
          >
            <ChevronLeft size={16} color={textSecondary} />
          </button>
          <GitCompare size={18} color={accentColor} />
          <span style={{ color: textPrimary, fontSize: 15, fontWeight: 600 }}>Compare Nodes</span>
          <span style={{ color: textMuted, fontSize: 12 }}>
            ({selectedNodes.length}/3 selected)
          </span>
        </div>
      </div>

      <div style={{ padding: 24 }}>
        <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
          {[0, 1, 2].map((slot) => {
            const node = comparedNodes[slot];
            return (
              <div
                key={slot}
                style={{
                  flex: 1,
                  padding: 16,
                  borderRadius: 8,
                  background: node ? bgRaised : bgElevated,
                  border: `2px dashed ${node ? 'transparent' : border}`,
                  borderColor: node ? border : undefined,
                  borderStyle: node ? 'solid' : 'dashed',
                  minHeight: 100,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {node ? (
                  <div style={{ width: '100%' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Server size={16} color={accentColor} />
                        <span style={{ color: textPrimary, fontSize: 13, fontWeight: 600, fontFamily: 'monospace' }}>
                          {node.address.split(':')[0]}
                        </span>
                      </div>
                      <button
                        onClick={() => removeNode(node.address)}
                        style={{ width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: 'none', cursor: 'pointer', borderRadius: 4 }}
                      >
                        <X size={14} color={textMuted} />
                      </button>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{
                        padding: '2px 6px',
                        borderRadius: 4,
                        fontSize: 10,
                        fontWeight: 600,
                        background: node.online ? (node.is_public ? 'rgba(34,197,94,0.15)' : 'rgba(245,158,11,0.15)') : 'rgba(239,68,68,0.15)',
                        color: node.online ? (node.is_public ? '#22c55e' : '#f59e0b') : '#ef4444',
                      }}>
                        {node.online ? (node.is_public ? 'Public' : 'Private') : 'Offline'}
                      </span>
                      <span style={{ color: textMuted, fontSize: 11 }}>
                        {node.location?.city || node.location?.country || 'Unknown'}
                      </span>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowSearch(true)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '10px 16px',
                      background: 'transparent',
                      border: `1px solid ${border}`,
                      borderRadius: 6,
                      cursor: 'pointer',
                      color: textSecondary,
                      fontSize: 13,
                    }}
                  >
                    <Plus size={16} />
                    Add Node
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {showSearch && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.6)',
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'center',
            paddingTop: 100,
            zIndex: 1000,
          }}>
            <div style={{
              width: 500,
              background: bgRaised,
              borderRadius: 12,
              border: `1px solid ${border}`,
              boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
              overflow: 'hidden',
            }}>
              <div style={{ padding: 16, borderBottom: `1px solid ${border}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <Search size={18} color={textMuted} />
                  <input
                    type="text"
                    placeholder="Search by IP, pubkey, city, or country..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    autoFocus
                    style={{
                      flex: 1,
                      background: 'transparent',
                      border: 'none',
                      outline: 'none',
                      color: textPrimary,
                      fontSize: 15,
                    }}
                  />
                  <button
                    onClick={() => { setShowSearch(false); setSearchTerm(''); }}
                    style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 4 }}
                  >
                    <X size={18} color={textMuted} />
                  </button>
                </div>
              </div>
              <div style={{ padding: '8px 16px', background: bgElevated, borderBottom: `1px solid ${border}` }}>
                <span style={{ color: textMuted, fontSize: 11 }}>
                  {availableNodes.length} nodes available {searchTerm && `matching "${searchTerm}"`}
                </span>
              </div>
              <div style={{ maxHeight: 400, overflowY: 'auto' }}>
                {availableNodes.length > 0 ? (
                  availableNodes.map((node) => (
                    <div
                      key={node.address}
                      onClick={() => addNode(node.address)}
                      style={{
                        padding: '12px 16px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        borderBottom: `1px solid ${border}`,
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = bgElevated}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ color: textPrimary, fontSize: 13, fontWeight: 600, fontFamily: 'monospace' }}>
                            {node.address}
                          </span>
                          <span style={{
                            padding: '2px 6px',
                            borderRadius: 4,
                            fontSize: 9,
                            fontWeight: 600,
                            background: node.online ? (node.is_public ? 'rgba(34,197,94,0.15)' : 'rgba(245,158,11,0.15)') : 'rgba(239,68,68,0.15)',
                            color: node.online ? (node.is_public ? '#22c55e' : '#f59e0b') : '#ef4444',
                          }}>
                            {node.online ? (node.is_public ? 'Public' : 'Private') : 'Offline'}
                          </span>
                        </div>
                        <div style={{ color: textMuted, fontSize: 11, marginTop: 2 }}>
                          {node.location?.city || 'Unknown'}, {node.location?.country || 'Unknown'} • v{node.version}
                        </div>
                      </div>
                      <Plus size={16} color={textMuted} />
                    </div>
                  ))
                ) : (
                  <div style={{ padding: 24, textAlign: 'center', color: textMuted, fontSize: 13 }}>
                    No nodes found {searchTerm && `matching "${searchTerm}"`}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {comparedNodes.length >= 2 && (
          <div style={{ borderRadius: 8, background: bgRaised, border: `1px solid ${border}`, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ padding: '14px 20px', textAlign: 'left', color: textMuted, fontSize: 11, fontWeight: 600, borderBottom: `1px solid ${border}`, width: 180 }}>
                    METRIC
                  </th>
                  {comparedNodes.map((node) => (
                    <th key={node.address} style={{ padding: '14px 20px', textAlign: 'center', color: textPrimary, fontSize: 12, fontWeight: 600, borderBottom: `1px solid ${border}` }}>
                      {node.address.split(':')[0]}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ padding: '14px 20px', color: textSecondary, fontSize: 13, fontWeight: 600, borderBottom: `1px solid ${border}` }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Trophy size={14} color={accentColor} />
                      Health Score
                    </div>
                  </td>
                  {comparedNodes.map((node) => {
                    const isBest = getBestValue('healthScore') === node.healthScore.overall;
                    return (
                      <td key={node.address} style={{ padding: '14px 20px', textAlign: 'center', borderBottom: `1px solid ${border}`, background: isBest ? 'rgba(34,197,94,0.1)' : 'transparent' }}>
                        <HealthScoreBadge score={node.healthScore.overall} grade={node.healthScore.grade} />
                      </td>
                    );
                  })}
                </tr>

                <tr>
                  <td style={{ padding: '14px 20px', color: textSecondary, fontSize: 13, fontWeight: 600, borderBottom: `1px solid ${border}` }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Clock size={14} color="#22c55e" />
                      Uptime
                    </div>
                  </td>
                  {comparedNodes.map((node) => {
                    const isBest = getBestValue('uptime') === node.uptime;
                    return (
                      <td key={node.address} style={{ padding: '14px 20px', textAlign: 'center', color: textPrimary, fontSize: 14, fontWeight: 700, borderBottom: `1px solid ${border}`, background: isBest ? 'rgba(34,197,94,0.1)' : 'transparent' }}>
                        {formatUptime(node.uptime)}
                        {isBest && <Check size={12} color="#22c55e" style={{ marginLeft: 6 }} />}
                      </td>
                    );
                  })}
                </tr>

                <tr>
                  <td style={{ padding: '14px 20px', color: textSecondary, fontSize: 13, fontWeight: 600, borderBottom: `1px solid ${border}` }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Send size={14} color="#3b82f6" />
                      Data Served
                    </div>
                  </td>
                  {comparedNodes.map((node) => {
                    const isBest = getBestValue('dataServed') === (node.stats?.total_bytes || 0);
                    return (
                      <td key={node.address} style={{ padding: '14px 20px', textAlign: 'center', color: textPrimary, fontSize: 14, fontWeight: 700, borderBottom: `1px solid ${border}`, background: isBest ? 'rgba(34,197,94,0.1)' : 'transparent' }}>
                        {formatBytes(node.stats?.total_bytes || 0)}
                        {isBest && <Check size={12} color="#22c55e" style={{ marginLeft: 6 }} />}
                      </td>
                    );
                  })}
                </tr>

                <tr>
                  <td style={{ padding: '14px 20px', color: textSecondary, fontSize: 13, fontWeight: 600, borderBottom: `1px solid ${border}` }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Cpu size={14} color="#a855f7" />
                      CPU Usage
                    </div>
                  </td>
                  {comparedNodes.map((node) => {
                    const cpu = node.stats?.cpu_percent;
                    const isBest = cpu !== undefined && getBestValue('cpu') === cpu;
                    return (
                      <td key={node.address} style={{ padding: '14px 20px', textAlign: 'center', color: textPrimary, fontSize: 14, fontWeight: 700, borderBottom: `1px solid ${border}`, background: isBest ? 'rgba(34,197,94,0.1)' : 'transparent' }}>
                        {cpu !== undefined ? `${cpu.toFixed(1)}%` : '–'}
                        {isBest && <Check size={12} color="#22c55e" style={{ marginLeft: 6 }} />}
                      </td>
                    );
                  })}
                </tr>

                <tr>
                  <td style={{ padding: '14px 20px', color: textSecondary, fontSize: 13, fontWeight: 600, borderBottom: `1px solid ${border}` }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <HardDrive size={14} color="#22c55e" />
                      RAM Usage
                    </div>
                  </td>
                  {comparedNodes.map((node) => {
                    const ram = node.stats?.ram_percent;
                    const isBest = ram !== undefined && getBestValue('ram') === ram;
                    return (
                      <td key={node.address} style={{ padding: '14px 20px', textAlign: 'center', color: textPrimary, fontSize: 14, fontWeight: 700, borderBottom: `1px solid ${border}`, background: isBest ? 'rgba(34,197,94,0.1)' : 'transparent' }}>
                        {ram !== undefined ? `${ram.toFixed(1)}%` : '–'}
                        {isBest && <Check size={12} color="#22c55e" style={{ marginLeft: 6 }} />}
                      </td>
                    );
                  })}
                </tr>

                <tr>
                  <td style={{ padding: '14px 20px', color: textSecondary, fontSize: 13, fontWeight: 600, borderBottom: `1px solid ${border}` }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <HardDrive size={14} color="#8b5cf6" />
                      Storage
                    </div>
                  </td>
                  {comparedNodes.map((node) => (
                    <td key={node.address} style={{ padding: '14px 20px', textAlign: 'center', color: textPrimary, fontSize: 14, fontWeight: 700, borderBottom: `1px solid ${border}` }}>
                      {formatBytes(node.storage_used)} / {formatBytes(node.storage_committed)}
                    </td>
                  ))}
                </tr>

                <tr>
                  <td style={{ padding: '14px 20px', color: textSecondary, fontSize: 13, fontWeight: 600, borderBottom: `1px solid ${border}` }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Activity size={14} color="#f59e0b" />
                      Network Rank
                    </div>
                  </td>
                  {comparedNodes.map((node) => {
                    const isBest = Math.min(...comparedNodes.map(n => n.rank)) === node.rank;
                    return (
                      <td key={node.address} style={{ padding: '14px 20px', textAlign: 'center', color: textPrimary, fontSize: 14, fontWeight: 700, borderBottom: `1px solid ${border}`, background: isBest ? 'rgba(34,197,94,0.1)' : 'transparent' }}>
                        #{node.rank}
                        {isBest && <Check size={12} color="#22c55e" style={{ marginLeft: 6 }} />}
                      </td>
                    );
                  })}
                </tr>

                <tr>
                  <td style={{ padding: '14px 20px', color: textSecondary, fontSize: 13, fontWeight: 600 }}>
                    Version
                  </td>
                  {comparedNodes.map((node) => (
                    <td key={node.address} style={{ padding: '14px 20px', textAlign: 'center', color: textSecondary, fontSize: 13, fontWeight: 600 }}>
                      v{node.version}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {comparedNodes.length < 2 && (
          <div style={{
            padding: 60,
            textAlign: 'center',
            background: bgRaised,
            borderRadius: 8,
            border: `1px solid ${border}`,
          }}>
            <GitCompare size={48} color={textMuted} style={{ margin: '0 auto 16px' }} />
            <h3 style={{ color: textPrimary, fontSize: 18, fontWeight: 600, marginBottom: 8 }}>
              Compare Nodes Side by Side
            </h3>
            <p style={{ color: textSecondary, fontSize: 13, marginBottom: 20 }}>
              Select at least 2 nodes to compare their performance, health scores, and metrics.
            </p>
            <button
              onClick={() => setShowSearch(true)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '12px 24px',
                background: accentColor,
                border: 'none',
                borderRadius: 6,
                color: '#000',
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <Plus size={18} />
              Add Nodes to Compare
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
