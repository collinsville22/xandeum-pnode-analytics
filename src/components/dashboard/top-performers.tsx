'use client';

import Link from 'next/link';

interface TopPerformer {
  rank: number;
  dataServed: number;
  status: 'public' | 'private' | 'offline';
  address: string;
  version: string;
  lastSeen: string;
}

interface TopPerformersProps {
  performers: TopPerformer[];
}

export function TopPerformers({ performers }: TopPerformersProps) {
  const statusColors = {
    public: 'var(--success)',
    private: 'var(--accent)',
    offline: 'var(--error)',
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{
        background: 'var(--bg-raised)',
        border: '1px solid var(--border)',
      }}
    >
      <div
        className="flex items-center justify-between p-4"
        style={{ borderBottom: '1px solid var(--border)' }}
      >
        <h3 className="text-[13px] font-medium" style={{ color: 'var(--text-primary)' }}>
          Top Performers
        </h3>
        <Link
          href="/dashboard/nodes"
          className="text-[11px] transition-colors"
          style={{ color: 'var(--text-muted)' }}
          onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--accent)')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
        >
          View All
        </Link>
      </div>

      <table className="w-full">
        <thead>
          <tr style={{ borderBottom: '1px solid var(--border)' }}>
            <th
              className="px-4 py-2 text-left text-[10px] uppercase tracking-wider"
              style={{ color: 'var(--text-muted)' }}
            >
              #
            </th>
            <th
              className="px-4 py-2 text-left text-[10px] uppercase tracking-wider"
              style={{ color: 'var(--text-muted)' }}
            >
              Address
            </th>
            <th
              className="px-4 py-2 text-left text-[10px] uppercase tracking-wider"
              style={{ color: 'var(--text-muted)' }}
            >
              Data Served
            </th>
            <th
              className="px-4 py-2 text-left text-[10px] uppercase tracking-wider"
              style={{ color: 'var(--text-muted)' }}
            >
              Status
            </th>
            <th
              className="px-4 py-2 text-left text-[10px] uppercase tracking-wider"
              style={{ color: 'var(--text-muted)' }}
            >
              Version
            </th>
          </tr>
        </thead>
        <tbody>
          {performers.map((p) => (
            <tr
              key={p.address}
              className="transition-colors"
              style={{ borderBottom: '1px solid var(--border)' }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-surface)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              <td className="px-4 py-2.5">
                <span className="text-[12px]" style={{ color: 'var(--text-muted)' }}>
                  {p.rank}
                </span>
              </td>
              <td className="px-4 py-2.5">
                <span
                  className="text-[12px] font-mono"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  {p.address}
                </span>
              </td>
              <td className="px-4 py-2.5">
                <span
                  className="text-[12px] font-mono"
                  style={{ color: 'var(--accent)' }}
                >
                  {formatBytes(p.dataServed)}
                </span>
              </td>
              <td className="px-4 py-2.5">
                <div className="flex items-center gap-2">
                  <span
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ background: statusColors[p.status] }}
                  />
                  <span
                    className="text-[12px] capitalize"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    {p.status}
                  </span>
                </div>
              </td>
              <td className="px-4 py-2.5">
                <span
                  className="text-[12px] font-mono"
                  style={{ color: 'var(--text-muted)' }}
                >
                  {p.version}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
