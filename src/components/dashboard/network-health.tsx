'use client';

import { useMemo } from 'react';

interface NetworkHealthProps {
  score: number;
  onlinePercent: number;
  publicRpcPercent: number;
  qualityPercent: number;
}

export function NetworkHealth({
  score,
  onlinePercent,
  publicRpcPercent,
}: NetworkHealthProps) {
  const { label, color } = useMemo(() => {
    if (score >= 80) return { label: 'Excellent', color: '#22c55e' };
    if (score >= 60) return { label: 'Good', color: '#f59e0b' };
    if (score >= 40) return { label: 'Fair', color: '#eab308' };
    return { label: 'Poor', color: '#ef4444' };
  }, [score]);

  return (
    <div
      className="rounded-xl p-4"
      style={{
        background: 'var(--bg-raised)',
        border: '1px solid var(--border)',
      }}
    >
      <h3
        className="text-[13px] font-medium mb-4"
        style={{ color: 'var(--text-primary)' }}
      >
        Network Health
      </h3>

      <div className="text-center mb-4">
        <span className="text-4xl font-bold font-mono" style={{ color }}>
          {score}%
        </span>
        <p className="text-[11px] mt-1" style={{ color }}>
          {label}
        </p>
      </div>

      <div className="space-y-3">
        <div>
          <div className="flex justify-between text-[12px] mb-1">
            <span style={{ color: 'var(--text-muted)' }}>Online</span>
            <span className="font-mono" style={{ color: 'var(--text-primary)' }}>
              {onlinePercent}%
            </span>
          </div>
          <div
            className="h-1.5 rounded-full overflow-hidden"
            style={{ background: 'var(--bg-surface)' }}
          >
            <div
              className="h-full rounded-full"
              style={{ width: `${onlinePercent}%`, background: 'var(--success)' }}
            />
          </div>
        </div>
        <div>
          <div className="flex justify-between text-[12px] mb-1">
            <span style={{ color: 'var(--text-muted)' }}>Public RPC</span>
            <span className="font-mono" style={{ color: 'var(--text-primary)' }}>
              {publicRpcPercent}%
            </span>
          </div>
          <div
            className="h-1.5 rounded-full overflow-hidden"
            style={{ background: 'var(--bg-surface)' }}
          >
            <div
              className="h-full rounded-full"
              style={{ width: `${publicRpcPercent}%`, background: 'var(--accent)' }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
