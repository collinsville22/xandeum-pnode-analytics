'use client';

import { useState, useRef, useEffect, ReactNode } from 'react';
import { HelpCircle } from 'lucide-react';
import { usePreferences } from '@/contexts/preferences-context';

interface TooltipProps {
  content: ReactNode;
  children: ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  delay?: number;
  maxWidth?: number;
}

export function Tooltip({
  content,
  children,
  position = 'top',
  delay = 200,
  maxWidth = 250,
}: TooltipProps) {
  const { resolvedTheme } = usePreferences();
  const [visible, setVisible] = useState(false);
  const [coords, setCoords] = useState({ x: 0, y: 0 });
  const triggerRef = useRef<HTMLSpanElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  const bgColor = resolvedTheme === 'light' ? '#1a1a1a' : '#ffffff';
  const textColor = resolvedTheme === 'light' ? '#ffffff' : '#1a1a1a';

  const showTooltip = () => {
    timeoutRef.current = setTimeout(() => {
      if (triggerRef.current) {
        const rect = triggerRef.current.getBoundingClientRect();
        setCoords({
          x: rect.left + rect.width / 2,
          y: position === 'top' ? rect.top : rect.bottom,
        });
        setVisible(true);
      }
    }, delay);
  };

  const hideTooltip = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setVisible(false);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const getPositionStyles = (): React.CSSProperties => {
    const base: React.CSSProperties = {
      position: 'fixed',
      zIndex: 9999,
      transform: 'translateX(-50%)',
    };

    switch (position) {
      case 'top':
        return { ...base, left: coords.x, top: coords.y - 8, transform: 'translate(-50%, -100%)' };
      case 'bottom':
        return { ...base, left: coords.x, top: coords.y + 8, transform: 'translateX(-50%)' };
      case 'left':
        return { ...base, left: coords.x - 8, top: coords.y, transform: 'translate(-100%, -50%)' };
      case 'right':
        return { ...base, left: coords.x + 8, top: coords.y, transform: 'translateY(-50%)' };
      default:
        return base;
    }
  };

  return (
    <>
      <span
        ref={triggerRef}
        onMouseEnter={showTooltip}
        onMouseLeave={hideTooltip}
        onFocus={showTooltip}
        onBlur={hideTooltip}
        style={{ display: 'inline-flex', alignItems: 'center' }}
      >
        {children}
      </span>
      {visible && (
        <div
          ref={tooltipRef}
          style={{
            ...getPositionStyles(),
            padding: '8px 12px',
            borderRadius: 6,
            background: bgColor,
            color: textColor,
            fontSize: 12,
            lineHeight: 1.4,
            maxWidth,
            boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
            pointerEvents: 'none',
          }}
        >
          {content}
        </div>
      )}
    </>
  );
}

interface InfoTooltipProps {
  content: ReactNode;
  size?: number;
}

export function InfoTooltip({ content, size = 14 }: InfoTooltipProps) {
  const { resolvedTheme } = usePreferences();
  const iconColor = resolvedTheme === 'light' ? '#999999' : '#666666';

  return (
    <Tooltip content={content}>
      <HelpCircle
        size={size}
        color={iconColor}
        style={{ cursor: 'help', marginLeft: 4 }}
      />
    </Tooltip>
  );
}

export const METRIC_EXPLANATIONS = {
  healthScore: {
    title: 'Health Score',
    description: 'A composite score (0-100) measuring node reliability based on uptime, performance, data served, availability, and storage efficiency.',
  },
  uptime: {
    title: 'Uptime',
    description: 'How long the node has been continuously running. Higher uptime indicates better reliability and earns a higher health score.',
  },
  dataServed: {
    title: 'Data Served',
    description: 'Total bytes of data this node has served to the network. Top performers serve more data and contribute more to network health.',
  },
  publicRpc: {
    title: 'Public RPC',
    description: 'Nodes with port 6900 accessible from the internet. Public RPC nodes are discoverable and can serve external requests.',
  },
  privateNode: {
    title: 'Private Node',
    description: 'Online nodes that are not publicly accessible. They still contribute to the network but cannot serve external RPC requests.',
  },
  cpuUsage: {
    title: 'CPU Usage',
    description: 'Current processor utilization. Lower CPU usage with high data served indicates an efficient node.',
  },
  ramUsage: {
    title: 'Memory Usage',
    description: 'Current RAM utilization. Optimal range is 20-60%. Too low may indicate underutilization, too high may cause issues.',
  },
  storageCommitted: {
    title: 'Storage Committed',
    description: 'Total storage space this node has pledged to the network for storing shards.',
  },
  storageUsed: {
    title: 'Storage Used',
    description: 'Actual storage being used by data shards. Higher utilization means more contribution to the network.',
  },
  activeStreams: {
    title: 'Active Streams',
    description: 'Number of concurrent data streams being served. Higher counts indicate the node is actively serving network requests.',
  },
  packetsReceived: {
    title: 'Packets Received',
    description: 'Total network packets received by this node since startup.',
  },
  packetsSent: {
    title: 'Packets Sent',
    description: 'Total network packets sent by this node since startup.',
  },
  lastSeen: {
    title: 'Last Seen',
    description: 'Time since the node was last detected via gossip protocol. Nodes not seen for >5 minutes may be experiencing issues.',
  },
  networkHealth: {
    title: 'Network Health',
    description: 'Overall network score based on percentage of online nodes and public RPC availability. Higher is better.',
  },
  stoinc: {
    title: 'STOINC',
    description: 'Storage Incentive ranking. Nodes are ranked by data served, and rewards are distributed based on this ranking.',
  },
};

interface MetricLabelProps {
  metricKey: keyof typeof METRIC_EXPLANATIONS;
  label?: string;
  style?: React.CSSProperties;
}

export function MetricLabel({ metricKey, label, style }: MetricLabelProps) {
  const metric = METRIC_EXPLANATIONS[metricKey];

  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', ...style }}>
      {label || metric.title}
      <InfoTooltip
        content={
          <div>
            <strong style={{ display: 'block', marginBottom: 4 }}>{metric.title}</strong>
            {metric.description}
          </div>
        }
      />
    </span>
  );
}
