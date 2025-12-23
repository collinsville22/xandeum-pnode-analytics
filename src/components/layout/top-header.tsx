'use client';

import { useState, useEffect, useCallback } from 'react';
import { RefreshCw, Search, Download, Sun, Sparkles } from 'lucide-react';
import { useAI } from '@/context/ai-context';
import { AlertsPanel } from '@/components/dashboard/alerts-panel';
import { RealtimeIndicator } from '@/components/dashboard/realtime-indicator';
import { Alert, loadAlerts, saveAlerts, checkNodeAlerts, loadAlertRules } from '@/lib/alerts';

interface TopHeaderProps {
  title: string;
  onRefresh?: () => void;
  refreshInterval?: number;
  onSearch?: (query: string) => void;
  onExport?: () => void;
}

export function TopHeader({
  title,
  onRefresh,
  refreshInterval = 30,
  onSearch,
  onExport,
}: TopHeaderProps) {
  const [countdown, setCountdown] = useState(refreshInterval);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const { toggleAi } = useAI();

  useEffect(() => {
    setAlerts(loadAlerts());
  }, []);

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    onRefresh?.();
    setTimeout(() => setIsRefreshing(false), 1000);
    setCountdown(refreshInterval);
  }, [onRefresh, refreshInterval]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          handleRefresh();
          return refreshInterval;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [refreshInterval, handleRefresh]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch?.(searchQuery);
  };

  return (
    <header
      className="h-12 flex items-center justify-between px-4 sticky top-0 z-30"
      style={{
        background: 'var(--bg-raised)',
        borderBottom: '1px solid var(--border)',
      }}
    >
      <div className="flex items-center gap-3 shrink-0">
        <div
          className="flex items-center gap-1.5 px-2 py-1 rounded-full"
          style={{ background: 'var(--success-muted)' }}
        >
          <span
            className="w-1.5 h-1.5 rounded-full animate-pulse"
            style={{ background: 'var(--success)' }}
          />
          <span className="text-[10px] font-medium" style={{ color: 'var(--success)' }}>
            Live
          </span>
        </div>
        <h1
          className="text-[14px] font-semibold"
          style={{ color: 'var(--text-primary)' }}
        >
          {title}
        </h1>
      </div>

      <form onSubmit={handleSearchSubmit} className="flex-1 max-w-sm mx-4">
        <div
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg"
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border)',
          }}
        >
          <Search className="w-3.5 h-3.5 shrink-0" style={{ color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Search nodes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 bg-transparent text-[12px] outline-none placeholder:text-[var(--text-muted)] min-w-0"
            style={{ color: 'var(--text-primary)' }}
          />
        </div>
      </form>

      <div className="flex items-center gap-1.5 shrink-0">
        <RealtimeIndicator />

        <AlertsPanel alerts={alerts} onAlertsChange={setAlerts} />

        <button
          onClick={onExport}
          className="flex items-center gap-1 px-2 py-1.5 rounded-md text-[11px] font-medium transition-colors"
          style={{
            color: 'var(--text-secondary)',
          }}
        >
          <Download className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Export</span>
        </button>

        <div
          className="flex items-center gap-1.5 px-2 py-1.5 rounded-md"
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border)',
          }}
        >
          <span className="text-[11px] hidden sm:inline" style={{ color: 'var(--text-muted)' }}>
            Next refresh
          </span>
          <span
            className="text-[11px] font-mono font-semibold"
            style={{ color: 'var(--accent)' }}
          >
            {countdown}s
          </span>
          <button
            onClick={handleRefresh}
            className="p-0.5 rounded transition-colors"
            style={{ color: 'var(--text-secondary)' }}
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`}
            />
          </button>
        </div>

        <button
          onClick={toggleAi}
          className="flex items-center gap-1 px-2 py-1.5 rounded-md text-[11px] font-medium transition-colors"
          style={{
            background: 'var(--accent-muted)',
            color: 'var(--accent)',
          }}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Ask AI</span>
        </button>

        <button
          className="p-1.5 rounded-md transition-colors"
          style={{
            color: 'var(--text-secondary)',
          }}
        >
          <Sun className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
