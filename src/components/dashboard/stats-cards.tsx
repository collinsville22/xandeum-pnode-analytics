'use client';

import { useNetworkOverview } from '@/hooks/usePNodes';
import { formatBytes, formatNumber } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ReactNode;
  accentColor: string;
  delay: number;
}

function StatCard({ title, value, subtitle, icon, accentColor, delay }: StatCardProps) {
  return (
    <div
      className="group relative overflow-hidden rounded-2xl glass-panel hover-lift opacity-0 animate-fade-in-up"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
        <div className={`absolute inset-0 bg-gradient-to-br ${accentColor} opacity-5`} />
      </div>
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[var(--accent-cyan-dim)] to-transparent" />
      <div className="relative p-6">
        <div className="flex items-start justify-between mb-4">
          <div className={`p-3 rounded-xl bg-gradient-to-br ${accentColor} bg-opacity-10 border border-current/20`}>
            {icon}
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-[var(--accent-lime)] animate-pulse" />
            <span className="mono text-[10px] text-[var(--text-muted)] uppercase">Live</span>
          </div>
        </div>
        <div className="space-y-1">
          <p className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">{title}</p>
          <p className="text-4xl font-bold text-[var(--text-bright)] mono tracking-tight">{value}</p>
          <p className="text-xs text-[var(--text-muted)]">{subtitle}</p>
        </div>
      </div>
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[var(--border-accent)] to-transparent" />
    </div>
  );
}

function StatCardSkeleton({ delay }: { delay: number }) {
  return (
    <div
      className="relative overflow-hidden rounded-2xl glass-panel opacity-0 animate-fade-in-up"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="w-12 h-12 rounded-xl shimmer-bg" />
          <div className="w-12 h-4 rounded shimmer-bg" />
        </div>
        <div className="space-y-2">
          <div className="w-24 h-3 rounded shimmer-bg" />
          <div className="w-32 h-10 rounded shimmer-bg" />
          <div className="w-20 h-3 rounded shimmer-bg" />
        </div>
      </div>
    </div>
  );
}

export function StatsCards() {
  const { data, isLoading, error } = useNetworkOverview();

  if (isLoading) {
    return (
      <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
        {[0, 100, 200, 300].map((delay) => (
          <StatCardSkeleton key={delay} delay={delay} />
        ))}
      </div>
    );
  }

  if (error || !data?.overview) {
    return (
      <div className="glass-panel rounded-2xl p-8 text-center">
        <div className="text-[var(--accent-magenta)] mono text-sm">
          [ ERROR ] Failed to load network statistics
        </div>
      </div>
    );
  }

  const stats = data.overview;
  const healthPercent = stats.total_pnodes > 0
    ? (stats.online_pnodes / stats.total_pnodes) * 100
    : 0;

  return (
    <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard
        title="Total pNodes"
        value={formatNumber(stats.total_pnodes)}
        subtitle="Discovered via pRPC"
        icon={
          <svg className="w-6 h-6 text-[var(--accent-cyan)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 14.25h13.5m-13.5 0a3 3 0 01-3-3m3 3a3 3 0 100 6h13.5a3 3 0 100-6m-16.5-3a3 3 0 013-3h13.5a3 3 0 013 3m-19.5 0a4.5 4.5 0 01.9-2.7L5.737 5.1a3.375 3.375 0 012.7-1.35h7.126c1.062 0 2.062.5 2.7 1.35l2.587 3.45a4.5 4.5 0 01.9 2.7m0 0a3 3 0 01-3 3m0 3h.008v.008h-.008v-.008zm0-6h.008v.008h-.008v-.008zm-3 6h.008v.008h-.008v-.008zm0-6h.008v.008h-.008v-.008z" />
          </svg>
        }
        accentColor="from-[var(--accent-cyan)] to-blue-500"
        delay={0}
      />
      <StatCard
        title="Online Nodes"
        value={formatNumber(stats.online_pnodes)}
        subtitle={`${healthPercent.toFixed(1)}% operational`}
        icon={
          <svg className="w-6 h-6 text-[var(--accent-lime)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
          </svg>
        }
        accentColor="from-[var(--accent-lime)] to-green-500"
        delay={100}
      />
      <StatCard
        title="Total Storage"
        value={formatBytes(stats.total_storage)}
        subtitle="Across all nodes"
        icon={
          <svg className="w-6 h-6 text-[var(--accent-magenta)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v3.75m-16.5-3.75v3.75m16.5 0v3.75C20.25 16.153 16.556 18 12 18s-8.25-1.847-8.25-4.125v-3.75m16.5 0c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125" />
          </svg>
        }
        accentColor="from-[var(--accent-magenta)] to-pink-500"
        delay={200}
      />
      <StatCard
        title="Avg CPU"
        value={`${stats.avg_cpu_percent.toFixed(1)}%`}
        subtitle={`RAM: ${stats.avg_ram_percent.toFixed(1)}%`}
        icon={
          <svg className="w-6 h-6 text-[var(--accent-orange)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 3v1.5M4.5 8.25H3m18 0h-1.5M4.5 12H3m18 0h-1.5m-15 3.75H3m18 0h-1.5M8.25 19.5V21M12 3v1.5m0 15V21m3.75-18v1.5m0 15V21m-9-1.5h10.5a2.25 2.25 0 002.25-2.25V6.75a2.25 2.25 0 00-2.25-2.25H6.75A2.25 2.25 0 004.5 6.75v10.5a2.25 2.25 0 002.25 2.25zm.75-12h9v9h-9v-9z" />
          </svg>
        }
        accentColor="from-[var(--accent-orange)] to-amber-500"
        delay={300}
      />
    </div>
  );
}
