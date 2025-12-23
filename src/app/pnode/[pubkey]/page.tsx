'use client';

import { use } from 'react';
import Link from 'next/link';
import { ArrowLeft, Copy, Check, Server, Cpu, HardDrive, MapPin, Activity } from 'lucide-react';
import { useState } from 'react';
import { Header } from '@/components/layout/header';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { usePNodes } from '@/hooks/usePNodes';
import { formatBytes } from '@/lib/utils';

function CopyButton({ value, size = 'default' }: { value: string; size?: 'default' | 'sm' }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const iconSize = size === 'sm' ? 'h-3 w-3' : 'h-4 w-4';

  return (
    <button
      onClick={handleCopy}
      className="rounded p-1.5 transition-colors"
      style={{ color: 'var(--text-muted)' }}
    >
      {copied ? (
        <Check className={`${iconSize}`} style={{ color: 'var(--success)' }} />
      ) : (
        <Copy className={iconSize} />
      )}
    </button>
  );
}

function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${days}d ${hours}h ${minutes}m`;
}

interface PageProps {
  params: Promise<{ pubkey: string }>;
}

export default function PNodeDetailPage({ params }: PageProps) {
  const { pubkey } = use(params);
  const { data, isLoading, error } = usePNodes();

  const pnode = data?.pNodes?.find((p) => p.pubkey === pubkey);

  if (isLoading) {
    return (
      <div style={{ background: 'var(--bg-base)', minHeight: '100vh' }}>
        <Header />
        <div className="mx-auto max-w-4xl px-6 py-8">
          <Skeleton className="mb-8 h-8 w-48" />
          <div className="space-y-6">
            <Skeleton className="h-32 w-full rounded-xl" />
            <Skeleton className="h-64 w-full rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !pnode) {
    return (
      <div style={{ background: 'var(--bg-base)', minHeight: '100vh' }}>
        <Header />
        <div className="mx-auto max-w-4xl px-6 py-8">
          <Link
            href="/pnodes"
            className="mb-8 inline-flex items-center gap-2 transition-colors"
            style={{ color: 'var(--text-muted)' }}
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Explorer
          </Link>
          <Card>
            <CardContent className="py-12">
              <div className="text-center">
                <Server className="mx-auto h-12 w-12" style={{ color: 'var(--text-muted)' }} />
                <h2 className="mt-4 text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>
                  pNode Not Found
                </h2>
                <p className="mt-2" style={{ color: 'var(--text-muted)' }}>
                  The pNode with pubkey {pubkey} could not be found.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const [host] = pnode.address.split(':');

  return (
    <div style={{ background: 'var(--bg-base)', minHeight: '100vh' }}>
      <Header />
      <div className="mx-auto max-w-4xl px-6 py-8">
        <Link
          href="/pnodes"
          className="mb-8 inline-flex items-center gap-2 transition-colors"
          style={{ color: 'var(--text-muted)' }}
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Explorer
        </Link>

        <div className="mb-6 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                pNode Details
              </h1>
              <Badge variant={pnode.online ? 'success' : 'danger'}>
                {pnode.online ? 'online' : 'offline'}
              </Badge>
            </div>
            <div className="mt-2 flex items-center gap-2">
              <code className="font-mono text-sm" style={{ color: 'var(--text-muted)' }}>
                {pnode.pubkey || 'Unknown'}
              </code>
              {pnode.pubkey && <CopyButton value={pnode.pubkey} size="sm" />}
            </div>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Server className="h-5 w-5" style={{ color: 'var(--accent)' }} />
                Node Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between pb-3" style={{ borderBottom: '1px solid var(--border)' }}>
                <span style={{ color: 'var(--text-muted)' }}>Status</span>
                <Badge variant={pnode.online ? 'success' : 'danger'}>
                  {pnode.online ? 'online' : 'offline'}
                </Badge>
              </div>
              <div className="flex justify-between pb-3" style={{ borderBottom: '1px solid var(--border)' }}>
                <span style={{ color: 'var(--text-muted)' }}>IP Address</span>
                <span className="font-mono" style={{ color: 'var(--text-primary)' }}>{host}</span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: 'var(--text-muted)' }}>Version</span>
                <span className="font-mono" style={{ color: 'var(--text-primary)' }}>{pnode.version || '-'}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" style={{ color: 'var(--accent)' }} />
                Location
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {pnode.location ? (
                <>
                  <div className="flex justify-between pb-3" style={{ borderBottom: '1px solid var(--border)' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Country</span>
                    <span style={{ color: 'var(--text-primary)' }}>{pnode.location.country}</span>
                  </div>
                  <div className="flex justify-between pb-3" style={{ borderBottom: '1px solid var(--border)' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Region</span>
                    <span style={{ color: 'var(--text-primary)' }}>{pnode.location.region || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: 'var(--text-muted)' }}>City</span>
                    <span style={{ color: 'var(--text-primary)' }}>{pnode.location.city || '-'}</span>
                  </div>
                </>
              ) : (
                <div className="py-4 text-center" style={{ color: 'var(--text-muted)' }}>
                  Location information not available
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Cpu className="h-5 w-5" style={{ color: 'var(--accent)' }} />
                System Resources
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {pnode.stats ? (
                <>
                  <div className="flex justify-between pb-3" style={{ borderBottom: '1px solid var(--border)' }}>
                    <span style={{ color: 'var(--text-muted)' }}>CPU Usage</span>
                    <span className="font-mono" style={{ color: 'var(--text-primary)' }}>
                      {pnode.stats.cpu_percent.toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between pb-3" style={{ borderBottom: '1px solid var(--border)' }}>
                    <span style={{ color: 'var(--text-muted)' }}>RAM Usage</span>
                    <span className="font-mono" style={{ color: 'var(--text-primary)' }}>
                      {pnode.stats.ram_percent.toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: 'var(--text-muted)' }}>RAM Used</span>
                    <span className="font-mono" style={{ color: 'var(--text-primary)' }}>
                      {formatBytes(pnode.stats.ram_used)} / {formatBytes(pnode.stats.ram_total)}
                    </span>
                  </div>
                </>
              ) : (
                <div className="py-4 text-center" style={{ color: 'var(--text-muted)' }}>
                  Resource information not available
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" style={{ color: 'var(--success)' }} />
                Activity
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {pnode.stats ? (
                <>
                  <div className="flex justify-between pb-3" style={{ borderBottom: '1px solid var(--border)' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Uptime</span>
                    <span className="font-mono" style={{ color: 'var(--text-primary)' }}>
                      {formatUptime(pnode.stats.uptime)}
                    </span>
                  </div>
                  <div className="flex justify-between pb-3" style={{ borderBottom: '1px solid var(--border)' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Packets Received</span>
                    <span className="font-mono" style={{ color: 'var(--text-primary)' }}>
                      {pnode.stats.packets_received?.toLocaleString() || '-'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: 'var(--text-muted)' }}>Packets Sent</span>
                    <span className="font-mono" style={{ color: 'var(--text-primary)' }}>
                      {pnode.stats.packets_sent?.toLocaleString() || '-'}
                    </span>
                  </div>
                </>
              ) : (
                <div className="py-4 text-center" style={{ color: 'var(--text-muted)' }}>
                  Activity information not available
                </div>
              )}
            </CardContent>
          </Card>

          {pnode.stats && (
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <HardDrive className="h-5 w-5" style={{ color: 'var(--accent)' }} />
                  Storage
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="flex justify-between p-3 rounded-lg" style={{ background: 'var(--bg-surface)' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Disk Total</span>
                    <span className="font-mono" style={{ color: 'var(--text-primary)' }}>
                      {formatBytes(pnode.stats.disk_total)}
                    </span>
                  </div>
                  <div className="flex justify-between p-3 rounded-lg" style={{ background: 'var(--bg-surface)' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Disk Used</span>
                    <span className="font-mono" style={{ color: 'var(--text-primary)' }}>
                      {formatBytes(pnode.stats.disk_used)}
                    </span>
                  </div>
                  <div className="flex justify-between p-3 rounded-lg" style={{ background: 'var(--bg-surface)' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Disk Available</span>
                    <span className="font-mono" style={{ color: 'var(--text-primary)' }}>
                      {formatBytes(pnode.stats.disk_total - pnode.stats.disk_used)}
                    </span>
                  </div>
                  <div className="flex justify-between p-3 rounded-lg" style={{ background: 'var(--bg-surface)' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Disk Usage</span>
                    <span className="font-mono" style={{ color: 'var(--text-primary)' }}>
                      {((pnode.stats.disk_used / pnode.stats.disk_total) * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
