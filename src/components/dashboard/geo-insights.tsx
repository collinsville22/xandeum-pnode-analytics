'use client';

interface GeoInsightsProps {
  totalLocations: number;
  totalCountries: number;
  versionDistribution: { version: string; count: number }[];
  topCountries: { country: string; count: number }[];
  topCities: { city: string; count: number }[];
}

export function GeoInsights({
  totalLocations,
  totalCountries,
  versionDistribution,
}: GeoInsightsProps) {
  return (
    <div
      className="rounded-xl overflow-hidden h-full"
      style={{
        background: 'var(--bg-raised)',
        border: '1px solid var(--border)',
      }}
    >
      <div
        className="px-4 py-3"
        style={{ borderBottom: '1px solid var(--border)' }}
      >
        <span className="text-[14px] font-semibold" style={{ color: 'var(--text-primary)' }}>
          Geographic Insights
        </span>
      </div>

      <div className="p-4 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div
            className="p-3 rounded-lg"
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border)',
            }}
          >
            <p
              className="text-2xl font-bold font-mono"
              style={{ color: 'var(--accent)' }}
            >
              {totalLocations}
            </p>
            <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
              Locations
            </p>
          </div>
          <div
            className="p-3 rounded-lg"
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border)',
            }}
          >
            <p
              className="text-2xl font-bold font-mono"
              style={{ color: 'var(--text-primary)' }}
            >
              {totalCountries}
            </p>
            <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
              Countries
            </p>
          </div>
        </div>

        {versionDistribution.length > 0 && (
          <div>
            <h4
              className="text-[11px] font-medium mb-3"
              style={{ color: 'var(--text-muted)' }}
            >
              Version Distribution
            </h4>
            <div className="space-y-2">
              {versionDistribution.slice(0, 4).map((v) => (
                <div
                  key={v.version}
                  className="flex items-center justify-between text-[12px]"
                >
                  <span
                    className="font-mono truncate max-w-[160px]"
                    style={{ color: 'var(--text-secondary)' }}
                    title={v.version}
                  >
                    {v.version}
                  </span>
                  <span
                    className="font-mono font-medium"
                    style={{ color: 'var(--accent)' }}
                  >
                    {v.count}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
