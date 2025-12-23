'use client';

import { usePNodes } from '@/hooks/usePNodes';

export function NetworkChart() {
  const { data, isLoading } = usePNodes();

  if (isLoading) {
    return (
      <div className="glass-panel rounded-xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-5 h-5 shimmer-bg rounded" />
          <div className="w-32 h-4 shimmer-bg rounded" />
        </div>
        <div className="h-48 shimmer-bg rounded-xl" />
      </div>
    );
  }

  const online = data?.online || 0;
  const offline = data?.offline || 0;
  const total = data?.total || 1;
  const onlinePercent = Math.round((online / total) * 100);

  return (
    <div className="glass-panel rounded-xl p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="relative">
          <svg className="w-5 h-5 text-[var(--accent-cyan)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6a7.5 7.5 0 107.5 7.5h-7.5V6z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5H21A7.5 7.5 0 0013.5 3v7.5z" />
          </svg>
        </div>
        <h3 className="text-sm font-semibold text-[var(--text-bright)] uppercase tracking-wider">Status Distribution</h3>
      </div>

      <div className="flex items-center justify-center mb-6">
        <div className="relative w-32 h-32">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="40"
              fill="none"
              stroke="var(--bg-elevated)"
              strokeWidth="12"
            />
            <circle
              cx="50"
              cy="50"
              r="40"
              fill="none"
              stroke="var(--accent-lime)"
              strokeWidth="12"
              strokeDasharray={`${onlinePercent * 2.51} 251`}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold text-[var(--text-bright)] mono">{onlinePercent}%</span>
            <span className="text-[10px] text-[var(--text-muted)] uppercase">Online</span>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-[var(--accent-lime)]" />
            <span className="text-xs text-[var(--text-secondary)]">Online</span>
          </div>
          <span className="text-sm font-medium text-[var(--text-bright)] mono">{online}</span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-[var(--accent-magenta)]" />
            <span className="text-xs text-[var(--text-secondary)]">Offline</span>
          </div>
          <span className="text-sm font-medium text-[var(--text-bright)] mono">{offline}</span>
        </div>
      </div>
    </div>
  );
}
