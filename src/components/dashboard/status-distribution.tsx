'use client';

import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

interface StatusDistributionProps {
  publicRpc: number;
  privateNodes: number;
  notRecentlySeen: number;
}

export function StatusDistribution({
  publicRpc,
  privateNodes,
  notRecentlySeen,
}: StatusDistributionProps) {
  const total = publicRpc + privateNodes + notRecentlySeen;

  const data = [
    { name: 'Public', value: publicRpc, color: 'var(--success)' },
    { name: 'Private', value: privateNodes, color: 'var(--accent)' },
    { name: 'Offline', value: notRecentlySeen, color: 'var(--error)' },
  ];

  const chartColors = ['#22c55e', '#f59e0b', '#ef4444'];

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
        Status Distribution
      </h3>

      <div className="flex items-center gap-4">
        <div className="relative w-28 h-28">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={30}
                outerRadius={45}
                paddingAngle={2}
                dataKey="value"
                strokeWidth={0}
              >
                {data.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={chartColors[index]} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span
              className="text-lg font-bold font-mono"
              style={{ color: 'var(--text-primary)' }}
            >
              {total}
            </span>
          </div>
        </div>

        <div className="flex-1 space-y-2">
          {data.map((item, idx) => (
            <div key={item.name} className="flex items-center justify-between text-[12px]">
              <div className="flex items-center gap-2">
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: chartColors[idx] }}
                />
                <span style={{ color: 'var(--text-secondary)' }}>{item.name}</span>
              </div>
              <span className="font-mono" style={{ color: 'var(--text-primary)' }}>
                {item.value}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
