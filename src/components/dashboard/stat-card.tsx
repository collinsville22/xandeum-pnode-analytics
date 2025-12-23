'use client';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  status?: 'success' | 'warning' | 'error' | 'neutral';
  className?: string;
}

export function StatCard({
  title,
  value,
  subtitle,
  status = 'neutral',
  className = '',
}: StatCardProps) {
  const valueColors = {
    success: 'var(--success)',
    warning: 'var(--warning)',
    error: 'var(--error)',
    neutral: 'var(--text-primary)',
  };

  return (
    <div
      className={`p-4 rounded-xl ${className}`}
      style={{
        background: 'var(--bg-raised)',
        border: '1px solid var(--border)',
      }}
    >
      <p
        className="text-[12px] font-medium mb-1"
        style={{ color: 'var(--text-muted)' }}
      >
        {title}
      </p>
      <p
        className="text-[28px] font-bold font-mono leading-tight"
        style={{ color: valueColors[status] }}
      >
        {value}
      </p>
      {subtitle && (
        <p
          className="text-[11px] mt-1"
          style={{ color: 'var(--text-muted)' }}
        >
          {subtitle}
        </p>
      )}
    </div>
  );
}
