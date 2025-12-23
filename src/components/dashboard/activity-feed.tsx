'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Activity,
  Server,
  ServerOff,
  TrendingUp,
  Globe,
  RefreshCw,
  Zap,
  Database,
} from 'lucide-react';
import { usePreferences } from '@/contexts/preferences-context';

export interface ActivityEvent {
  id: string;
  type: 'node_online' | 'node_offline' | 'data_served' | 'new_version' | 'high_traffic' | 'storage_milestone';
  timestamp: Date;
  nodeAddress?: string;
  nodeLocation?: string;
  details: string;
  value?: string | number;
}

interface ActivityFeedProps {
  events: ActivityEvent[];
  maxItems?: number;
}

export function generateActivityEvents(
  currentNodes: any[],
  previousNodes: any[] | null,
  existingEvents: ActivityEvent[] = []
): ActivityEvent[] {
  const events: ActivityEvent[] = [...existingEvents];
  const now = new Date();

  if (!previousNodes) {
    const onlineCount = currentNodes.filter(n => n.online).length;
    const publicCount = currentNodes.filter(n => n.is_public).length;
    const totalStorage = currentNodes.reduce((sum, n) => sum + (n.storage_committed || 0), 0);
    const totalDataServed = currentNodes.reduce((sum, n) => sum + (n.stats?.total_bytes || 0), 0);

    events.push({
      id: `init-${now.getTime()}`,
      type: 'node_online',
      timestamp: now,
      details: `Network online with ${onlineCount} active nodes`,
      value: onlineCount,
    });

    if (publicCount > 0) {
      events.push({
        id: `public-${now.getTime()}`,
        type: 'high_traffic',
        timestamp: new Date(now.getTime() - 5000),
        details: `${publicCount} public RPC endpoints available`,
        value: publicCount,
      });
    }

    if (totalDataServed > 0) {
      events.push({
        id: `data-total-${now.getTime()}`,
        type: 'data_served',
        timestamp: new Date(now.getTime() - 15000),
        details: `Network has served ${formatBytes(totalDataServed)} total`,
        value: totalDataServed,
      });
    }

    if (totalStorage > 0) {
      events.push({
        id: `storage-${now.getTime()}`,
        type: 'storage_milestone',
        timestamp: new Date(now.getTime() - 30000),
        details: `${formatBytes(totalStorage)} storage committed`,
        value: totalStorage,
      });
    }

    const topNodes = [...currentNodes]
      .filter(n => n.online && n.stats?.total_bytes)
      .sort((a, b) => (b.stats?.total_bytes || 0) - (a.stats?.total_bytes || 0))
      .slice(0, 3);

    topNodes.forEach((node, i) => {
      events.push({
        id: `active-${node.address}-${now.getTime()}`,
        type: 'data_served',
        timestamp: new Date(now.getTime() - (60000 + i * 30000)),
        nodeAddress: node.address,
        nodeLocation: node.location?.city || node.location?.country,
        details: `Top performer serving data`,
        value: node.address.split(':')[0],
      });
    });

    return events.slice(-50);
  }

  const prevMap = new Map(previousNodes.map(n => [n.address, n]));
  const currMap = new Map(currentNodes.map(n => [n.address, n]));

  currentNodes.forEach(node => {
    const prev = prevMap.get(node.address);

    if (node.online && prev && !prev.online) {
      events.push({
        id: `online-${node.address}-${now.getTime()}`,
        type: 'node_online',
        timestamp: now,
        nodeAddress: node.address,
        nodeLocation: node.location?.city || node.location?.country,
        details: `Node came online`,
        value: node.address.split(':')[0],
      });
    }

    if (!node.online && prev && prev.online) {
      events.push({
        id: `offline-${node.address}-${now.getTime()}`,
        type: 'node_offline',
        timestamp: now,
        nodeAddress: node.address,
        nodeLocation: node.location?.city || node.location?.country,
        details: `Node went offline`,
        value: node.address.split(':')[0],
      });
    }

    if (prev && node.version !== prev.version && node.version) {
      events.push({
        id: `version-${node.address}-${now.getTime()}`,
        type: 'new_version',
        timestamp: now,
        nodeAddress: node.address,
        details: `Upgraded to version ${node.version}`,
        value: node.version,
      });
    }

    if (prev && node.stats?.total_bytes && prev.stats?.total_bytes) {
      const dataIncrease = node.stats.total_bytes - prev.stats.total_bytes;
      if (dataIncrease > 100 * 1024 * 1024) {
        events.push({
          id: `data-${node.address}-${now.getTime()}`,
          type: 'data_served',
          timestamp: now,
          nodeAddress: node.address,
          details: `Served ${formatBytes(dataIncrease)} to network`,
          value: dataIncrease,
        });
      }
    }

    if (node.stats?.active_streams && node.stats.active_streams > 50 && (!prev?.stats?.active_streams || prev.stats.active_streams <= 50)) {
      events.push({
        id: `traffic-${node.address}-${now.getTime()}`,
        type: 'high_traffic',
        timestamp: now,
        nodeAddress: node.address,
        details: `High traffic: ${node.stats.active_streams} active streams`,
        value: node.stats.active_streams,
      });
    }
  });

  currentNodes.forEach(node => {
    if (!prevMap.has(node.address)) {
      events.push({
        id: `new-${node.address}-${now.getTime()}`,
        type: 'node_online',
        timestamp: now,
        nodeAddress: node.address,
        nodeLocation: node.location?.city || node.location?.country,
        details: `New node joined the network`,
        value: node.address.split(':')[0],
      });
    }
  });

  return events
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    .slice(0, 50);
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function getRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);

  if (diffSec < 10) return 'just now';
  if (diffSec < 60) return `${diffSec}s ago`;
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHour < 24) return `${diffHour}h ago`;
  return date.toLocaleDateString();
}

export function ActivityFeed({ events, maxItems = 10 }: ActivityFeedProps) {
  const { resolvedTheme, preferences } = usePreferences();
  const [visibleCount, setVisibleCount] = useState(maxItems);
  const feedRef = useRef<HTMLDivElement>(null);

  const bgRaised = resolvedTheme === 'light' ? '#ffffff' : '#1a1a1a';
  const bgElevated = resolvedTheme === 'light' ? '#f5f5f5' : '#252525';
  const textPrimary = resolvedTheme === 'light' ? '#1a1a1a' : '#ffffff';
  const textSecondary = resolvedTheme === 'light' ? '#666666' : '#888888';
  const textMuted = resolvedTheme === 'light' ? '#999999' : '#666666';
  const border = resolvedTheme === 'light' ? '#e0e0e0' : '#2a2a2a';
  const accentColor = preferences.xandeumTheme ? '#14b8a6' : '#f59e0b';

  const getEventIcon = (type: ActivityEvent['type']) => {
    switch (type) {
      case 'node_online':
        return <Server size={14} color="#22c55e" />;
      case 'node_offline':
        return <ServerOff size={14} color="#ef4444" />;
      case 'data_served':
        return <TrendingUp size={14} color={accentColor} />;
      case 'new_version':
        return <RefreshCw size={14} color="#3b82f6" />;
      case 'high_traffic':
        return <Zap size={14} color="#f59e0b" />;
      case 'storage_milestone':
        return <Database size={14} color="#8b5cf6" />;
      default:
        return <Activity size={14} color={textMuted} />;
    }
  };

  const getEventColor = (type: ActivityEvent['type']) => {
    switch (type) {
      case 'node_online':
        return '#22c55e';
      case 'node_offline':
        return '#ef4444';
      case 'data_served':
        return accentColor;
      case 'new_version':
        return '#3b82f6';
      case 'high_traffic':
        return '#f59e0b';
      case 'storage_milestone':
        return '#8b5cf6';
      default:
        return textMuted;
    }
  };

  const displayedEvents = events.slice(0, visibleCount);

  if (events.length === 0) {
    return (
      <div style={{ padding: 20, borderRadius: 8, background: bgRaised, border: `1px solid ${border}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <Activity size={16} color={accentColor} />
          <span style={{ color: textPrimary, fontSize: 14, fontWeight: 600 }}>Live Activity</span>
        </div>
        <div style={{ textAlign: 'center', padding: 20, color: textMuted, fontSize: 12 }}>
          Monitoring network activity...
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: 20, borderRadius: 8, background: bgRaised, border: `1px solid ${border}` }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Activity size={16} color={accentColor} />
          <span style={{ color: textPrimary, fontSize: 14, fontWeight: 600 }}>Live Activity</span>
          <span style={{
            width: 6, height: 6, borderRadius: '50%', background: '#22c55e',
            animation: 'pulse 2s infinite',
          }} />
        </div>
        <span style={{ color: textMuted, fontSize: 11 }}>
          {events.length} events
        </span>
      </div>

      <div ref={feedRef} style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 400, overflowY: 'auto' }}>
        {displayedEvents.map((event, index) => (
          <div
            key={event.id}
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 10,
              padding: 10,
              borderRadius: 6,
              background: index === 0 ? `${getEventColor(event.type)}10` : 'transparent',
              borderLeft: `2px solid ${getEventColor(event.type)}`,
              animation: index === 0 ? 'fadeIn 0.3s ease' : 'none',
            }}
          >
            <div style={{ marginTop: 2 }}>
              {getEventIcon(event.type)}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                <span style={{ color: textPrimary, fontSize: 12, fontWeight: 500 }}>
                  {event.details}
                </span>
                {event.nodeLocation && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 2, color: textMuted, fontSize: 10 }}>
                    <Globe size={10} />
                    {event.nodeLocation}
                  </span>
                )}
              </div>
              {event.value && (
                <div style={{ color: textSecondary, fontSize: 11, marginTop: 2, fontFamily: 'monospace' }}>
                  {typeof event.value === 'number' && event.type === 'data_served'
                    ? formatBytes(event.value)
                    : event.value}
                </div>
              )}
            </div>
            <span style={{ color: textMuted, fontSize: 10, whiteSpace: 'nowrap' }}>
              {getRelativeTime(event.timestamp)}
            </span>
          </div>
        ))}
      </div>

      {events.length > visibleCount && (
        <button
          onClick={() => setVisibleCount(prev => prev + 10)}
          style={{
            width: '100%',
            padding: 8,
            marginTop: 12,
            borderRadius: 6,
            border: `1px solid ${border}`,
            background: 'transparent',
            color: textSecondary,
            fontSize: 11,
            cursor: 'pointer',
          }}
        >
          Show more ({events.length - visibleCount} remaining)
        </button>
      )}

      <style jsx global>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
