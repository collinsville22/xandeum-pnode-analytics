'use client';

import { useState } from 'react';
import { Info, Cpu, HardDrive, Wifi, Clock } from 'lucide-react';
import { HealthScoreBreakdown, getGradeColor, getHealthScoreColor, formatUptime } from '@/lib/health-score';
import { usePreferences } from '@/contexts/preferences-context';

interface HealthScoreProps {
  score: HealthScoreBreakdown;
  size?: 'sm' | 'md' | 'lg';
  showBreakdown?: boolean;
}

export function HealthScore({ score, size = 'md', showBreakdown = false }: HealthScoreProps) {
  const [showDetails, setShowDetails] = useState(false);
  const { resolvedTheme } = usePreferences();

  const gradeColors = getGradeColor(score.grade);
  const scoreColor = getHealthScoreColor(score.overall);

  const bgRaised = resolvedTheme === 'light' ? '#ffffff' : '#1a1a1a';
  const bgElevated = resolvedTheme === 'light' ? '#f5f5f5' : '#252525';
  const textPrimary = resolvedTheme === 'light' ? '#1a1a1a' : '#ffffff';
  const textSecondary = resolvedTheme === 'light' ? '#666666' : '#888888';
  const textMuted = resolvedTheme === 'light' ? '#999999' : '#666666';
  const border = resolvedTheme === 'light' ? '#e0e0e0' : '#2a2a2a';

  const sizes = {
    sm: { badge: 28, fontSize: 11, gradeSize: 12 },
    md: { badge: 40, fontSize: 14, gradeSize: 16 },
    lg: { badge: 56, fontSize: 18, gradeSize: 24 },
  };

  const s = sizes[size];

  return (
    <div style={{ position: 'relative' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: size === 'lg' ? 16 : 10,
          cursor: showBreakdown ? 'pointer' : 'default',
        }}
        onClick={() => showBreakdown && setShowDetails(!showDetails)}
      >
        <div
          style={{
            width: s.badge,
            height: s.badge,
            borderRadius: '50%',
            background: `conic-gradient(${scoreColor} ${score.overall * 3.6}deg, ${bgElevated} 0deg)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
          }}
        >
          <div
            style={{
              width: s.badge - 6,
              height: s.badge - 6,
              borderRadius: '50%',
              background: bgRaised,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <span style={{ fontSize: s.fontSize, fontWeight: 700, color: textPrimary }}>
              {score.overall}
            </span>
          </div>
        </div>

        <div
          style={{
            padding: size === 'lg' ? '6px 12px' : '4px 8px',
            borderRadius: 6,
            background: gradeColors.bg,
            display: 'flex',
            alignItems: 'center',
            gap: 4,
          }}
        >
          <span style={{ fontSize: s.gradeSize, fontWeight: 800, color: gradeColors.text }}>
            {score.grade}
          </span>
        </div>

        {score.percentile !== undefined && size !== 'sm' && (
          <span style={{ color: textMuted, fontSize: s.fontSize - 2 }}>
            Top {100 - score.percentile}%
          </span>
        )}

        {showBreakdown && (
          <Info size={14} color={textMuted} style={{ marginLeft: 'auto' }} />
        )}
      </div>

      {showBreakdown && showDetails && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            left: 0,
            right: 0,
            minWidth: 280,
            padding: 16,
            background: bgRaised,
            border: `1px solid ${border}`,
            borderRadius: 12,
            boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
            zIndex: 100,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <span style={{ color: textPrimary, fontSize: 13, fontWeight: 600 }}>Operational Score</span>
            <span style={{ color: scoreColor, fontSize: 18, fontWeight: 800 }}>{score.overall}/100</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <ScoreComponent
              icon={<Wifi size={14} />}
              label="Availability"
              score={score.components.availability.score}
              weight={score.components.availability.weight}
              detail={score.components.availability.raw ? 'Online' : 'Offline'}
              bgElevated={bgElevated}
              textSecondary={textSecondary}
              textMuted={textMuted}
            />

            <ScoreComponent
              icon={<Cpu size={14} />}
              label="Performance"
              score={score.components.performance.score}
              weight={score.components.performance.weight}
              detail={`CPU: ${score.components.performance.raw.cpu.toFixed(1)}% | RAM: ${score.components.performance.raw.ram.toFixed(1)}%`}
              bgElevated={bgElevated}
              textSecondary={textSecondary}
              textMuted={textMuted}
            />

            <ScoreComponent
              icon={<HardDrive size={14} />}
              label="Storage"
              score={score.components.storage.score}
              weight={score.components.storage.weight}
              detail={formatBytes(score.components.storage.raw)}
              bgElevated={bgElevated}
              textSecondary={textSecondary}
              textMuted={textMuted}
            />

            <ScoreComponent
              icon={<Clock size={14} />}
              label="Session"
              score={score.components.uptime.score}
              weight={score.components.uptime.weight}
              detail={formatUptime(score.components.uptime.raw)}
              bgElevated={bgElevated}
              textSecondary={textSecondary}
              textMuted={textMuted}
            />
          </div>

          <div style={{ marginTop: 12, padding: 8, background: bgElevated, borderRadius: 6 }}>
            <p style={{ color: textMuted, fontSize: 10, lineHeight: 1.4, margin: 0 }}>
              Operational Score measures current node status. For historical reputation, see Credits.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

interface ScoreComponentProps {
  icon: React.ReactNode;
  label: string;
  score: number;
  weight: number;
  detail: string;
  bgElevated: string;
  textSecondary: string;
  textMuted: string;
}

function ScoreComponent({ icon, label, score, weight, detail, bgElevated, textSecondary, textMuted }: ScoreComponentProps) {
  const color = getHealthScoreColor(score);

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ color: textMuted }}>{icon}</span>
          <span style={{ color: textSecondary, fontSize: 11, fontWeight: 500 }}>{label}</span>
          <span style={{ color: textMuted, fontSize: 9 }}>({(weight * 100).toFixed(0)}%)</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ color: textMuted, fontSize: 10 }}>{detail}</span>
          <span style={{ color, fontSize: 12, fontWeight: 700 }}>{score}</span>
        </div>
      </div>
      <div style={{ height: 4, background: bgElevated, borderRadius: 2, overflow: 'hidden' }}>
        <div
          style={{
            width: `${score}%`,
            height: '100%',
            background: color,
            borderRadius: 2,
            transition: 'width 0.3s ease',
          }}
        />
      </div>
    </div>
  );
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

export function HealthScoreBadge({ score, grade }: { score: number; grade: string }) {
  const gradeColors = getGradeColor(grade as HealthScoreBreakdown['grade']);

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <span style={{ fontSize: 13, fontWeight: 700, color: getHealthScoreColor(score) }}>{score}</span>
      <span
        style={{
          padding: '2px 6px',
          borderRadius: 4,
          background: gradeColors.bg,
          color: gradeColors.text,
          fontSize: 10,
          fontWeight: 700,
        }}
      >
        {grade}
      </span>
    </div>
  );
}
