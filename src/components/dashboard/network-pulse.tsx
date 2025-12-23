'use client';

import { Activity, Zap, Server, Wifi } from 'lucide-react';
import { useNetworkOverview } from '@/hooks/usePNodes';
import { formatBytes } from '@/lib/utils';

export function NetworkPulse() {
  const { data, isLoading } = useNetworkOverview();

  const stats = data?.overview ? {
    totalNodes: data.overview.total_pnodes,
    onlineNodes: data.overview.online_pnodes,
    healthPercent: data.overview.total_pnodes > 0
      ? Math.round((data.overview.online_pnodes / data.overview.total_pnodes) * 100)
      : 0,
    totalStorage: data.overview.total_storage,
    avgUptime: data.overview.avg_uptime,
  } : { totalNodes: 0, onlineNodes: 0, healthPercent: 0, totalStorage: 0, avgUptime: 0 };

  if (isLoading) {
    return (
      <div className="glass-panel rounded-xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <Activity className="h-5 w-5 text-[var(--accent-cyan)]" />
          <h3 className="text-sm font-semibold text-[var(--text-bright)] uppercase tracking-wider">Network Pulse</h3>
        </div>
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-12 shimmer-bg rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    return `${days}d avg`;
  };

  return (
    <div className="glass-panel rounded-xl p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="relative">
          <Activity className="h-5 w-5 text-[var(--accent-cyan)]" />
          <div className="absolute inset-0 bg-[var(--accent-cyan)] blur-md opacity-50" />
        </div>
        <h3 className="text-sm font-semibold text-[var(--text-bright)] uppercase tracking-wider">Network Pulse</h3>
      </div>

      <div className="space-y-4">
        <PulseItem
          icon={<Zap className="h-4 w-4" />}
          label="HEALTH"
          value={stats.healthPercent + '%'}
          color={stats.healthPercent > 80 ? 'lime' : stats.healthPercent > 50 ? 'orange' : 'magenta'}
        />
        <PulseItem
          icon={<Server className="h-4 w-4" />}
          label="ONLINE"
          value={stats.onlineNodes + ' / ' + stats.totalNodes}
          color="cyan"
        />
        <PulseItem
          icon={<Wifi className="h-4 w-4" />}
          label="STORAGE"
          value={formatBytes(stats.totalStorage)}
          color="magenta"
        />
        <PulseItem
          icon={<Activity className="h-4 w-4" />}
          label="UPTIME"
          value={formatUptime(stats.avgUptime)}
          color="lime"
        />
      </div>

      <div className="mt-6 pt-4 border-t border-[var(--border-subtle)]">
        <div className="flex items-center justify-between text-xs mono">
          <span className="text-[var(--text-muted)]">DATA SOURCE</span>
          <span className="text-[var(--accent-cyan)]">pRPC PORT 6000</span>
        </div>
        <div className="mt-2 h-1.5 bg-[var(--bg-deep)] rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[var(--accent-cyan)] to-[var(--accent-lime)] rounded-full"
            style={{ width: `${Math.min(100, stats.healthPercent + 20)}%` }}
          />
        </div>
      </div>
    </div>
  );
}

function PulseItem({
  icon,
  label,
  value,
  color
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: 'cyan' | 'lime' | 'orange' | 'magenta';
}) {
  const colorClasses = {
    cyan: 'text-[var(--accent-cyan)] bg-[var(--accent-cyan)]',
    lime: 'text-[var(--accent-lime)] bg-[var(--accent-lime)]',
    orange: 'text-[var(--accent-orange)] bg-[var(--accent-orange)]',
    magenta: 'text-[var(--accent-magenta)] bg-[var(--accent-magenta)]',
  };

  const textColor = colorClasses[color].split(' ')[0];
  const bgColor = colorClasses[color].split(' ')[1];

  return (
    <div className="flex items-center justify-between p-3 rounded-lg bg-[var(--bg-elevated)]/50 hover:bg-[var(--bg-elevated)] transition-colors">
      <div className="flex items-center gap-3">
        <div className={'p-2 rounded-lg bg-opacity-10 ' + bgColor + '/10 ' + textColor}>
          {icon}
        </div>
        <span className="text-xs mono text-[var(--text-muted)] uppercase tracking-wider">{label}</span>
      </div>
      <span className={'text-sm mono font-medium ' + textColor}>{value}</span>
    </div>
  );
}
