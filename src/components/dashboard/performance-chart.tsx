'use client';

import { useRef, useEffect, useState } from 'react';
import { usePreferences } from '@/contexts/preferences-context';

interface DataPoint {
  timestamp: number;
  value: number;
}

interface PerformanceChartProps {
  value: number;
  maxPoints?: number;
  height?: number;
  color?: string;
  label?: string;
  unit?: string;
  formatValue?: (value: number) => string;
  showFill?: boolean;
}

export function PerformanceChart({
  value,
  maxPoints = 30,
  height = 60,
  color = '#22c55e',
  label,
  unit = '',
  formatValue,
  showFill = true,
}: PerformanceChartProps) {
  const { resolvedTheme } = usePreferences();
  const historyRef = useRef<DataPoint[]>([]);
  const [history, setHistory] = useState<DataPoint[]>([]);

  const bgElevated = resolvedTheme === 'light' ? '#f0f0f0' : '#252525';
  const textPrimary = resolvedTheme === 'light' ? '#1a1a1a' : '#ffffff';
  const textSecondary = resolvedTheme === 'light' ? '#666666' : '#888888';
  const textMuted = resolvedTheme === 'light' ? '#999999' : '#666666';

  useEffect(() => {
    const now = Date.now();
    const newPoint: DataPoint = { timestamp: now, value };

    const lastPoint = historyRef.current[historyRef.current.length - 1];
    if (!lastPoint || now - lastPoint.timestamp > 500) {
      historyRef.current = [...historyRef.current, newPoint].slice(-maxPoints);
      setHistory([...historyRef.current]);
    }
  }, [value, maxPoints]);

  const values = history.map(p => p.value);
  const min = values.length > 0 ? Math.min(...values) : 0;
  const max = values.length > 0 ? Math.max(...values) : 100;
  const avg = values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0;
  const range = max - min || 1;

  const generatePath = () => {
    if (history.length < 2) return '';

    const width = 100;
    const padding = 2;
    const effectiveHeight = height - padding * 2;
    const effectiveWidth = width - padding * 2;

    const points = history.map((point, index) => {
      const x = padding + (index / (history.length - 1)) * effectiveWidth;
      const y = padding + effectiveHeight - ((point.value - min) / range) * effectiveHeight;
      return { x, y };
    });

    const linePath = points
      .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(2)},${p.y.toFixed(2)}`)
      .join(' ');

    return linePath;
  };

  const generateAreaPath = () => {
    if (history.length < 2) return '';

    const width = 100;
    const padding = 2;
    const effectiveHeight = height - padding * 2;
    const effectiveWidth = width - padding * 2;

    const points = history.map((point, index) => {
      const x = padding + (index / (history.length - 1)) * effectiveWidth;
      const y = padding + effectiveHeight - ((point.value - min) / range) * effectiveHeight;
      return { x, y };
    });

    const linePath = points
      .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(2)},${p.y.toFixed(2)}`)
      .join(' ');

    const lastX = points[points.length - 1].x;
    const firstX = points[0].x;
    const bottomY = padding + effectiveHeight;

    return `${linePath} L ${lastX.toFixed(2)},${bottomY} L ${firstX.toFixed(2)},${bottomY} Z`;
  };

  const displayValue = formatValue ? formatValue(value) : `${value.toFixed(1)}${unit}`;

  return (
    <div style={{ borderRadius: 8, background: bgElevated, overflow: 'hidden' }}>
      <div style={{
        padding: '12px 14px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: `1px solid ${resolvedTheme === 'light' ? '#e0e0e0' : '#333'}`
      }}>
        <span style={{ color: textSecondary, fontSize: 11, fontWeight: 600 }}>{label}</span>
        <span style={{ color: textPrimary, fontSize: 16, fontWeight: 800 }}>{displayValue}</span>
      </div>

      <div style={{ padding: '8px 14px' }}>
        <svg
          viewBox={`0 0 100 ${height}`}
          style={{ width: '100%', height: height }}
          preserveAspectRatio="none"
        >
          <line x1="2" y1={height / 2} x2="98" y2={height / 2} stroke={textMuted} strokeWidth="0.3" strokeDasharray="2,2" />

          {showFill && history.length >= 2 && (
            <path
              d={generateAreaPath()}
              fill={`${color}15`}
            />
          )}

          {history.length >= 2 && (
            <path
              d={generatePath()}
              fill="none"
              stroke={color}
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {history.length > 0 && (
            <circle
              cx={98}
              cy={2 + (height - 4) - ((value - min) / range) * (height - 4)}
              r="3"
              fill={color}
            />
          )}
        </svg>

        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginTop: 8,
          paddingTop: 8,
          borderTop: `1px solid ${resolvedTheme === 'light' ? '#e0e0e0' : '#333'}`
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ color: textMuted, fontSize: 9, marginBottom: 2 }}>MIN</div>
            <div style={{ color: textSecondary, fontSize: 11, fontWeight: 600 }}>{min.toFixed(1)}{unit}</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ color: textMuted, fontSize: 9, marginBottom: 2 }}>AVG</div>
            <div style={{ color: textSecondary, fontSize: 11, fontWeight: 600 }}>{avg.toFixed(1)}{unit}</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ color: textMuted, fontSize: 9, marginBottom: 2 }}>MAX</div>
            <div style={{ color: textSecondary, fontSize: 11, fontWeight: 600 }}>{max.toFixed(1)}{unit}</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ color: textMuted, fontSize: 9, marginBottom: 2 }}>SAMPLES</div>
            <div style={{ color: textSecondary, fontSize: 11, fontWeight: 600 }}>{history.length}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface SparklineProps {
  values: number[];
  width?: number;
  height?: number;
  color?: string;
  showDot?: boolean;
}

export function Sparkline({
  values,
  width = 80,
  height = 24,
  color = '#22c55e',
  showDot = true,
}: SparklineProps) {
  if (values.length < 2) {
    return (
      <svg width={width} height={height}>
        <line x1="0" y1={height / 2} x2={width} y2={height / 2} stroke={color} strokeWidth="1" opacity="0.3" />
      </svg>
    );
  }

  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const padding = 2;

  const points = values.map((value, index) => {
    const x = padding + (index / (values.length - 1)) * (width - padding * 2);
    const y = padding + (height - padding * 2) - ((value - min) / range) * (height - padding * 2);
    return { x, y };
  });

  const path = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(2)},${p.y.toFixed(2)}`)
    .join(' ');

  const lastPoint = points[points.length - 1];

  return (
    <svg width={width} height={height}>
      <path
        d={path}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {showDot && (
        <circle cx={lastPoint.x} cy={lastPoint.y} r="2" fill={color} />
      )}
    </svg>
  );
}

interface MultiMetricChartProps {
  metrics: Array<{
    label: string;
    value: number;
    color: string;
    unit?: string;
  }>;
  height?: number;
}

export function MultiMetricChart({ metrics, height = 120 }: MultiMetricChartProps) {
  const { resolvedTheme } = usePreferences();
  const historyRef = useRef<Map<string, DataPoint[]>>(new Map());
  const [history, setHistory] = useState<Map<string, DataPoint[]>>(new Map());

  const bgElevated = resolvedTheme === 'light' ? '#f0f0f0' : '#252525';
  const textPrimary = resolvedTheme === 'light' ? '#1a1a1a' : '#ffffff';
  const textSecondary = resolvedTheme === 'light' ? '#666666' : '#888888';
  const textMuted = resolvedTheme === 'light' ? '#999999' : '#666666';
  const border = resolvedTheme === 'light' ? '#e0e0e0' : '#333';

  const maxPoints = 30;

  useEffect(() => {
    const now = Date.now();
    const newHistory = new Map(historyRef.current);

    metrics.forEach(metric => {
      const existing = newHistory.get(metric.label) || [];
      const lastPoint = existing[existing.length - 1];

      if (!lastPoint || now - lastPoint.timestamp > 500) {
        const updated = [...existing, { timestamp: now, value: metric.value }].slice(-maxPoints);
        newHistory.set(metric.label, updated);
      }
    });

    historyRef.current = newHistory;
    setHistory(new Map(newHistory));
  }, [metrics]);

  return (
    <div style={{ borderRadius: 8, background: bgElevated, padding: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <span style={{ color: textPrimary, fontSize: 13, fontWeight: 600 }}>Performance History</span>
        <span style={{ color: textMuted, fontSize: 10 }}>Last {maxPoints} samples</span>
      </div>

      <svg
        viewBox={`0 0 100 ${height}`}
        style={{ width: '100%', height: height }}
        preserveAspectRatio="none"
      >
        {[0.25, 0.5, 0.75].map(y => (
          <line
            key={y}
            x1="0"
            y1={y * height}
            x2="100"
            y2={y * height}
            stroke={textMuted}
            strokeWidth="0.3"
            strokeDasharray="2,2"
          />
        ))}

        {metrics.map(metric => {
          const points = history.get(metric.label) || [];
          if (points.length < 2) return null;

          const values = points.map(p => p.value);
          const min = 0;
          const max = 100;
          const range = max - min;
          const padding = 4;

          const pathPoints = points.map((point, index) => {
            const x = padding + (index / (points.length - 1)) * (100 - padding * 2);
            const y = padding + (height - padding * 2) - ((point.value - min) / range) * (height - padding * 2);
            return { x, y };
          });

          const path = pathPoints
            .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(2)},${p.y.toFixed(2)}`)
            .join(' ');

          const lastPoint = pathPoints[pathPoints.length - 1];

          return (
            <g key={metric.label}>
              <path
                d={path}
                fill="none"
                stroke={metric.color}
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle cx={lastPoint.x} cy={lastPoint.y} r="3" fill={metric.color} />
            </g>
          );
        })}
      </svg>

      <div style={{
        display: 'flex',
        gap: 16,
        marginTop: 12,
        paddingTop: 12,
        borderTop: `1px solid ${border}`
      }}>
        {metrics.map(metric => (
          <div key={metric.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 8, height: 8, borderRadius: 2, background: metric.color }} />
            <span style={{ color: textSecondary, fontSize: 11 }}>{metric.label}</span>
            <span style={{ color: textPrimary, fontSize: 12, fontWeight: 700 }}>
              {metric.value.toFixed(1)}{metric.unit || '%'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
