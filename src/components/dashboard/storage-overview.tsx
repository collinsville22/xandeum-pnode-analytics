'use client';

interface StorageOverviewProps {
  totalCapacity: number;
  usedStorage: number;
  available: number;
  utilization: number;
  nodesWithData: number;
  totalNodes: number;
  avgUtilization: number;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function StorageOverview({
  totalCapacity,
  usedStorage,
  utilization,
  nodesWithData,
  totalNodes,
}: StorageOverviewProps) {
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
        Storage
      </h3>

      <div className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-[12px]">
            <span style={{ color: 'var(--text-muted)' }}>Used</span>
            <span className="font-mono" style={{ color: 'var(--text-primary)' }}>
              {formatBytes(usedStorage)}
            </span>
          </div>
          <div className="flex justify-between text-[12px]">
            <span style={{ color: 'var(--text-muted)' }}>Total</span>
            <span className="font-mono" style={{ color: 'var(--text-primary)' }}>
              {formatBytes(totalCapacity)}
            </span>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-[12px]">
            <span style={{ color: 'var(--text-muted)' }}>Utilization</span>
            <span className="font-mono" style={{ color: 'var(--accent)' }}>
              {utilization.toFixed(1)}%
            </span>
          </div>
          <div
            className="h-2 rounded-full overflow-hidden"
            style={{ background: 'var(--bg-surface)' }}
          >
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{
                width: `${Math.min(utilization, 100)}%`,
                background: 'var(--accent)',
              }}
            />
          </div>
        </div>

        <div
          className="flex justify-between text-[12px] pt-2"
          style={{ borderTop: '1px solid var(--border)' }}
        >
          <span style={{ color: 'var(--text-muted)' }}>Nodes with data</span>
          <span className="font-mono" style={{ color: 'var(--text-primary)' }}>
            {nodesWithData} / {totalNodes}
          </span>
        </div>
      </div>
    </div>
  );
}
