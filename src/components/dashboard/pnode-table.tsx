'use client';

import { useState, useMemo } from 'react';
import { Search, ArrowUpDown, Copy, Check } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { usePNodes } from '@/hooks/usePNodes';
import { truncateAddress, formatBytes, cn } from '@/lib/utils';
import type { PNode } from '@/types/pnode';

type SortField = 'address' | 'status' | 'cpu' | 'ram' | 'uptime' | 'location';
type SortDirection = 'asc' | 'desc';

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className="rounded p-1 text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-elevated)] hover:text-[var(--text-secondary)]"
    >
      {copied ? <Check className="h-3.5 w-3.5 text-[var(--accent-lime)]" /> : <Copy className="h-3.5 w-3.5" />}
    </button>
  );
}

function TableSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 rounded-lg bg-[var(--bg-elevated)]/50 p-4">
          <div className="h-10 w-10 rounded-full shimmer-bg" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-48 shimmer-bg rounded" />
            <div className="h-3 w-32 shimmer-bg rounded" />
          </div>
          <div className="h-6 w-16 rounded-full shimmer-bg" />
        </div>
      ))}
    </div>
  );
}

function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  return `${days}d ${hours}h`;
}

export function PNodeTable() {
  const { data, isLoading, error } = usePNodes();
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState<SortField>('status');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [filter, setFilter] = useState<'all' | 'online' | 'offline'>('all');

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const filteredAndSorted = useMemo(() => {
    if (!data?.pNodes) return [];

    let result = data.pNodes.filter((pnode) => {
      const matchesSearch =
        (pnode.pubkey?.toLowerCase() || '').includes(search.toLowerCase()) ||
        pnode.address.toLowerCase().includes(search.toLowerCase());
      const matchesFilter =
        filter === 'all' ||
        (filter === 'online' && pnode.online) ||
        (filter === 'offline' && !pnode.online);
      return matchesSearch && matchesFilter;
    });

    result.sort((a, b) => {
      let comparison = 0;

      switch (sortField) {
        case 'address':
          comparison = a.address.localeCompare(b.address);
          break;
        case 'status':
          comparison = (a.online ? 1 : 0) - (b.online ? 1 : 0);
          break;
        case 'cpu':
          comparison = (a.stats?.cpu_percent || 0) - (b.stats?.cpu_percent || 0);
          break;
        case 'ram':
          comparison = (a.stats?.ram_percent || 0) - (b.stats?.ram_percent || 0);
          break;
        case 'uptime':
          comparison = (a.stats?.uptime || 0) - (b.stats?.uptime || 0);
          break;
        case 'location':
          comparison = (a.location?.country || '').localeCompare(b.location?.country || '');
          break;
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [data?.pNodes, search, sortField, sortDirection, filter]);

  if (isLoading) {
    return (
      <div className="glass-panel rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-[var(--text-bright)]">Node Registry</h3>
        </div>
        <TableSkeleton />
      </div>
    );
  }

  if (error || !data?.pNodes) {
    return (
      <div className="glass-panel rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-[var(--text-bright)]">Node Registry</h3>
        </div>
        <div className="rounded-lg border border-[var(--accent-magenta)]/20 bg-[var(--accent-magenta)]/10 p-4 text-center text-[var(--accent-magenta)]">
          Failed to load pNode data
        </div>
      </div>
    );
  }

  return (
    <div className="glass-panel rounded-xl overflow-hidden">
      <div className="p-6 border-b border-[var(--border-subtle)]">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-[var(--text-bright)]">Node Registry</h3>
            <p className="text-xs text-[var(--text-muted)] mt-1">
              {data.online} online / {data.total} total via pRPC
            </p>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:flex-none sm:w-[250px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
              <input
                type="text"
                placeholder="Search by address..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full h-9 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-elevated)] pl-9 pr-4 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:border-[var(--accent-cyan)] focus:outline-none"
              />
            </div>
            <div className="flex gap-1">
              {(['all', 'online', 'offline'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={cn(
                    'px-3 py-1.5 text-xs rounded-lg transition-colors',
                    filter === f
                      ? 'bg-[var(--accent-cyan)] text-black font-medium'
                      : 'bg-[var(--bg-elevated)] text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
                  )}
                >
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-[var(--bg-elevated)]/50">
            <tr>
              <th className="text-left p-4 text-xs font-medium text-[var(--text-muted)] uppercase">
                Node ID
              </th>
              <th className="text-left p-4 text-xs font-medium text-[var(--text-muted)] uppercase">
                Address
              </th>
              <th
                className="text-left p-4 text-xs font-medium text-[var(--text-muted)] uppercase cursor-pointer hover:text-[var(--text-secondary)]"
                onClick={() => handleSort('location')}
              >
                <div className="flex items-center gap-1">
                  Location
                  <ArrowUpDown className="h-3 w-3" />
                </div>
              </th>
              <th
                className="text-left p-4 text-xs font-medium text-[var(--text-muted)] uppercase cursor-pointer hover:text-[var(--text-secondary)]"
                onClick={() => handleSort('cpu')}
              >
                <div className="flex items-center gap-1">
                  CPU
                  <ArrowUpDown className="h-3 w-3" />
                </div>
              </th>
              <th
                className="text-left p-4 text-xs font-medium text-[var(--text-muted)] uppercase cursor-pointer hover:text-[var(--text-secondary)]"
                onClick={() => handleSort('ram')}
              >
                <div className="flex items-center gap-1">
                  RAM
                  <ArrowUpDown className="h-3 w-3" />
                </div>
              </th>
              <th
                className="text-left p-4 text-xs font-medium text-[var(--text-muted)] uppercase cursor-pointer hover:text-[var(--text-secondary)]"
                onClick={() => handleSort('uptime')}
              >
                <div className="flex items-center gap-1">
                  Uptime
                  <ArrowUpDown className="h-3 w-3" />
                </div>
              </th>
              <th
                className="text-left p-4 text-xs font-medium text-[var(--text-muted)] uppercase cursor-pointer hover:text-[var(--text-secondary)]"
                onClick={() => handleSort('status')}
              >
                <div className="flex items-center gap-1">
                  Status
                  <ArrowUpDown className="h-3 w-3" />
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border-subtle)]">
            {filteredAndSorted.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-[var(--text-muted)]">
                  No nodes found
                </td>
              </tr>
            ) : (
              filteredAndSorted.map((pnode) => (
                <PNodeRow key={pnode.address} pnode={pnode} />
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="p-4 border-t border-[var(--border-subtle)] text-center text-xs text-[var(--text-muted)]">
        Showing {filteredAndSorted.length} of {data.total} nodes
      </div>
    </div>
  );
}

function PNodeRow({ pnode }: { pnode: PNode }) {
  const [host] = pnode.address.split(':');

  return (
    <tr className="group transition-colors hover:bg-[var(--bg-elevated)]/30">
      <td className="p-4">
        <div className="flex items-center gap-2">
          <code className="text-xs font-mono bg-[var(--bg-elevated)] px-2 py-1 rounded text-[var(--text-primary)]">
            {pnode.pubkey ? truncateAddress(pnode.pubkey, 4) : 'N/A'}
          </code>
          {pnode.pubkey && <CopyButton value={pnode.pubkey} />}
        </div>
      </td>
      <td className="p-4 text-sm font-mono text-[var(--text-muted)]">
        {host}
      </td>
      <td className="p-4">
        <Badge variant="default" className="font-mono text-xs">
          {pnode.location?.country || 'Unknown'}
        </Badge>
      </td>
      <td className="p-4 text-sm font-mono text-[var(--text-secondary)]">
        {pnode.stats ? `${pnode.stats.cpu_percent.toFixed(1)}%` : '-'}
      </td>
      <td className="p-4 text-sm font-mono text-[var(--text-secondary)]">
        {pnode.stats ? `${pnode.stats.ram_percent.toFixed(1)}%` : '-'}
      </td>
      <td className="p-4 text-sm font-mono text-[var(--text-secondary)]">
        {pnode.stats ? formatUptime(pnode.stats.uptime) : '-'}
      </td>
      <td className="p-4">
        <Badge variant={pnode.online ? 'success' : 'danger'}>
          <span className={cn(
            'w-1.5 h-1.5 rounded-full mr-2',
            pnode.online ? 'bg-[var(--accent-lime)] animate-pulse' : 'bg-[var(--accent-magenta)]'
          )} />
          {pnode.online ? 'online' : 'offline'}
        </Badge>
      </td>
    </tr>
  );
}
