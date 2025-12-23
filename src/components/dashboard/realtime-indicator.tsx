'use client';

import { useState } from 'react';
import {
  Wifi, WifiOff, Radio, ChevronDown,
  CircleCheck, CircleOff, BarChart3, TrendingUp, TrendingDown,
  Plus, Minus, Activity
} from 'lucide-react';
import { useRealtime, RealtimeEvent, formatRealtimeEvent } from '@/hooks/use-realtime';
import { usePreferences } from '@/contexts/preferences-context';

const realtimeIconMap: Record<string, React.ComponentType<{ size?: number; color?: string }>> = {
  CircleCheck,
  CircleOff,
  BarChart3,
  TrendingUp,
  TrendingDown,
  Plus,
  Minus,
  Activity,
};

function EventIcon({ iconName, size = 16, color }: { iconName: string; size?: number; color?: string }) {
  const IconComponent = realtimeIconMap[iconName];
  if (!IconComponent) return <Activity size={size} color={color} />;
  return <IconComponent size={size} color={color} />;
}

interface RealtimeIndicatorProps {
  onEvent?: (event: RealtimeEvent) => void;
}

export function RealtimeIndicator({ onEvent }: RealtimeIndicatorProps) {
  const { resolvedTheme } = usePreferences();
  const [showFeed, setShowFeed] = useState(false);

  const { connected, lastUpdate, eventCount, connectionType, events, refresh, clearEvents } = useRealtime({
    enabled: true,
    pollInterval: 5000,
    onEvent,
  });

  const bgRaised = resolvedTheme === 'light' ? '#ffffff' : '#1a1a1a';
  const bgElevated = resolvedTheme === 'light' ? '#f0f0f0' : '#252525';
  const textPrimary = resolvedTheme === 'light' ? '#1a1a1a' : '#ffffff';
  const textSecondary = resolvedTheme === 'light' ? '#666' : '#888';
  const textMuted = resolvedTheme === 'light' ? '#999' : '#666';
  const border = resolvedTheme === 'light' ? '#e0e0e0' : '#2a2a2a';

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  const timeSinceUpdate = lastUpdate
    ? Math.floor((Date.now() - lastUpdate.getTime()) / 1000)
    : null;

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setShowFeed(!showFeed)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '6px 12px',
          background: bgElevated,
          border: `1px solid ${border}`,
          borderRadius: 6,
          cursor: 'pointer',
        }}
      >
        <div style={{ position: 'relative' }}>
          {connected ? (
            <>
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: '#22c55e',
                  display: 'block',
                }}
              />
              <span
                style={{
                  position: 'absolute',
                  top: -2,
                  left: -2,
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  background: '#22c55e',
                  opacity: 0.3,
                  animation: 'pulse 2s infinite',
                }}
              />
            </>
          ) : (
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: '#ef4444',
                display: 'block',
              }}
            />
          )}
        </div>

        <span style={{ color: textSecondary, fontSize: 11, fontWeight: 500 }}>
          {connected ? 'Live' : 'Disconnected'}
        </span>

        {timeSinceUpdate !== null && connected && (
          <span style={{ color: textMuted, fontSize: 10 }}>
            {timeSinceUpdate}s ago
          </span>
        )}

        <ChevronDown
          size={12}
          color={textMuted}
          style={{
            transform: showFeed ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s',
          }}
        />
      </button>

      {showFeed && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            right: 0,
            width: 320,
            maxHeight: 400,
            background: bgRaised,
            border: `1px solid ${border}`,
            borderRadius: 8,
            boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
            overflow: 'hidden',
            zIndex: 1000,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: `1px solid ${border}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Radio size={14} color={connected ? '#22c55e' : '#ef4444'} />
              <span style={{ color: textPrimary, fontSize: 13, fontWeight: 600 }}>Live Feed</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ color: textMuted, fontSize: 10 }}>{eventCount} events</span>
              {events.length > 0 && (
                <button
                  onClick={clearEvents}
                  style={{ color: textSecondary, fontSize: 10, background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          <div style={{ padding: '8px 16px', background: bgElevated, borderBottom: `1px solid ${border}` }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                {connected ? <Wifi size={12} color="#22c55e" /> : <WifiOff size={12} color="#ef4444" />}
                <span style={{ color: textSecondary, fontSize: 11 }}>
                  {connectionType === 'polling' ? 'Polling (5s interval)' : connectionType === 'sse' ? 'Server-Sent Events' : 'Not connected'}
                </span>
              </div>
              <button
                onClick={refresh}
                style={{ color: textSecondary, fontSize: 10, background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
              >
                Refresh now
              </button>
            </div>
          </div>

          <div style={{ maxHeight: 280, overflowY: 'auto' }}>
            {events.length === 0 ? (
              <div style={{ padding: 32, textAlign: 'center' }}>
                <Radio size={24} color={textMuted} style={{ margin: '0 auto 8px' }} />
                <p style={{ color: textSecondary, fontSize: 12, margin: 0 }}>Listening for events...</p>
                <p style={{ color: textMuted, fontSize: 10, marginTop: 4 }}>Changes will appear here in real-time</p>
              </div>
            ) : (
              events.map((event, idx) => {
                const formatted = formatRealtimeEvent(event);
                return (
                  <div
                    key={`${event.type}-${event.timestamp.getTime()}-${idx}`}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 10,
                      padding: '10px 16px',
                      borderBottom: `1px solid ${border}`,
                    }}
                  >
                    <EventIcon iconName={formatted.icon} size={16} color={textSecondary} />
                    <div style={{ flex: 1 }}>
                      <div style={{ color: textPrimary, fontSize: 12, fontWeight: 600 }}>{formatted.title}</div>
                      <div style={{ color: textSecondary, fontSize: 11, marginTop: 2 }}>{formatted.description}</div>
                    </div>
                    <span style={{ color: textMuted, fontSize: 9 }}>{formatTime(event.timestamp)}</span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes pulse {
          0% { transform: scale(1); opacity: 0.3; }
          50% { transform: scale(1.5); opacity: 0; }
          100% { transform: scale(1); opacity: 0.3; }
        }
      `}</style>
    </div>
  );
}
