'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Bell, X, Check, Settings, Trash2, ChevronRight,
  CircleOff, CircleCheck, TrendingDown, TrendingUp,
  Cpu, MemoryStick, HardDrive, RefreshCw, AlertTriangle, Award
} from 'lucide-react';
import { Alert, AlertRule, AlertType, getAlertColor, getAlertIcon, loadAlerts, saveAlerts, loadAlertRules, saveAlertRules, DEFAULT_ALERT_RULES } from '@/lib/alerts';

const iconMap: Record<string, React.ComponentType<{ size?: number; color?: string }>> = {
  CircleOff,
  CircleCheck,
  TrendingDown,
  TrendingUp,
  Cpu,
  MemoryStick,
  HardDrive,
  RefreshCw,
  AlertTriangle,
  Award,
};

function AlertIcon({ type, size = 14, color }: { type: AlertType; size?: number; color?: string }) {
  const iconName = getAlertIcon(type);
  const IconComponent = iconMap[iconName];
  if (!IconComponent) return null;
  return <IconComponent size={size} color={color} />;
}
import { usePreferences } from '@/contexts/preferences-context';

interface AlertsPanelProps {
  alerts: Alert[];
  onAlertsChange: (alerts: Alert[]) => void;
}

export function AlertsPanel({ alerts, onAlertsChange }: AlertsPanelProps) {
  const { resolvedTheme } = usePreferences();
  const [isOpen, setIsOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [rules, setRules] = useState<AlertRule[]>([]);
  const panelRef = useRef<HTMLDivElement>(null);

  const bgRaised = resolvedTheme === 'light' ? '#ffffff' : '#1a1a1a';
  const bgElevated = resolvedTheme === 'light' ? '#f0f0f0' : '#252525';
  const textPrimary = resolvedTheme === 'light' ? '#1a1a1a' : '#ffffff';
  const textSecondary = resolvedTheme === 'light' ? '#666' : '#888';
  const textMuted = resolvedTheme === 'light' ? '#999' : '#666';
  const border = resolvedTheme === 'light' ? '#e0e0e0' : '#2a2a2a';

  useEffect(() => {
    setRules(loadAlertRules());
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setShowSettings(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = alerts.filter(a => !a.read).length;

  const markAsRead = (alertId: string) => {
    const updated = alerts.map(a => a.id === alertId ? { ...a, read: true } : a);
    onAlertsChange(updated);
    saveAlerts(updated);
  };

  const markAllAsRead = () => {
    const updated = alerts.map(a => ({ ...a, read: true }));
    onAlertsChange(updated);
    saveAlerts(updated);
  };

  const dismissAlert = (alertId: string) => {
    const updated = alerts.filter(a => a.id !== alertId);
    onAlertsChange(updated);
    saveAlerts(updated);
  };

  const clearAll = () => {
    onAlertsChange([]);
    saveAlerts([]);
  };

  const toggleRule = (ruleId: string) => {
    const updated = rules.map(r => r.id === ruleId ? { ...r, enabled: !r.enabled } : r);
    setRules(updated);
    saveAlertRules(updated);
  };

  const updateThreshold = (ruleId: string, threshold: number) => {
    const updated = rules.map(r => r.id === ruleId ? { ...r, threshold } : r);
    setRules(updated);
    saveAlertRules(updated);
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  return (
    <div ref={panelRef} style={{ position: 'relative' }}>
      <button
        onClick={() => { setIsOpen(!isOpen); setShowSettings(false); }}
        style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 36,
          height: 36,
          background: bgElevated,
          border: `1px solid ${border}`,
          borderRadius: 6,
          cursor: 'pointer',
        }}
      >
        <Bell size={16} color={textSecondary} />
        {unreadCount > 0 && (
          <span
            style={{
              position: 'absolute',
              top: -4,
              right: -4,
              minWidth: 16,
              height: 16,
              padding: '0 4px',
              borderRadius: 8,
              background: '#ef4444',
              color: '#fff',
              fontSize: 10,
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            right: 0,
            width: 360,
            maxHeight: 480,
            background: bgRaised,
            border: `1px solid ${border}`,
            borderRadius: 8,
            boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
            overflow: 'hidden',
            zIndex: 1000,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: `1px solid ${border}` }}>
            <span style={{ color: textPrimary, fontSize: 14, fontWeight: 600 }}>
              {showSettings ? 'Alert Settings' : 'Alerts'}
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {!showSettings && alerts.length > 0 && (
                <>
                  <button
                    onClick={markAllAsRead}
                    style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 8px', background: 'transparent', border: 'none', cursor: 'pointer', color: textSecondary, fontSize: 11 }}
                    title="Mark all as read"
                  >
                    <Check size={12} />
                  </button>
                  <button
                    onClick={clearAll}
                    style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 8px', background: 'transparent', border: 'none', cursor: 'pointer', color: textMuted, fontSize: 11 }}
                    title="Clear all"
                  >
                    <Trash2 size={12} />
                  </button>
                </>
              )}
              <button
                onClick={() => setShowSettings(!showSettings)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 24,
                  height: 24,
                  background: showSettings ? bgElevated : 'transparent',
                  border: 'none',
                  borderRadius: 4,
                  cursor: 'pointer',
                }}
              >
                <Settings size={14} color={textSecondary} />
              </button>
            </div>
          </div>

          {showSettings ? (
            <div style={{ maxHeight: 400, overflowY: 'auto', padding: 12 }}>
              <p style={{ color: textSecondary, fontSize: 11, marginBottom: 12 }}>
                Configure which alerts you want to receive
              </p>
              {rules.map((rule) => (
                <div
                  key={rule.id}
                  style={{
                    padding: 12,
                    marginBottom: 8,
                    borderRadius: 6,
                    background: bgElevated,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ color: textPrimary, fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <AlertIcon type={rule.type} size={14} color={textSecondary} />
                      {rule.type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </span>
                    <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={rule.enabled}
                        onChange={() => toggleRule(rule.id)}
                        style={{ marginRight: 6 }}
                      />
                      <span style={{ color: textSecondary, fontSize: 11 }}>Enabled</span>
                    </label>
                  </div>
                  <p style={{ color: textMuted, fontSize: 11, margin: 0 }}>{rule.description}</p>
                  {rule.threshold !== undefined && (
                    <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ color: textSecondary, fontSize: 10 }}>Threshold:</span>
                      <input
                        type="number"
                        value={rule.threshold}
                        onChange={(e) => updateThreshold(rule.id, parseInt(e.target.value) || 0)}
                        style={{
                          width: 60,
                          padding: '4px 8px',
                          background: bgRaised,
                          border: `1px solid ${border}`,
                          borderRadius: 4,
                          color: textPrimary,
                          fontSize: 11,
                        }}
                      />
                      <span style={{ color: textMuted, fontSize: 10 }}>
                        {rule.type.includes('cpu') || rule.type.includes('ram') || rule.type.includes('storage') || rule.type.includes('health') ? '%' : ''}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div style={{ maxHeight: 400, overflowY: 'auto' }}>
              {alerts.length === 0 ? (
                <div style={{ padding: 40, textAlign: 'center' }}>
                  <Bell size={32} color={textMuted} style={{ margin: '0 auto 12px' }} />
                  <p style={{ color: textSecondary, fontSize: 13, marginBottom: 4 }}>No alerts yet</p>
                  <p style={{ color: textMuted, fontSize: 11 }}>You'll be notified when important events occur</p>
                </div>
              ) : (
                alerts.slice(0, 50).map((alert) => (
                  <div
                    key={alert.id}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 10,
                      padding: '12px 16px',
                      borderBottom: `1px solid ${border}`,
                      background: alert.read ? 'transparent' : `${getAlertColor(alert.severity)}08`,
                      cursor: 'pointer',
                    }}
                    onClick={() => markAsRead(alert.id)}
                  >
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 8,
                        background: `${getAlertColor(alert.severity)}20`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <AlertIcon type={alert.type} size={16} color={getAlertColor(alert.severity)} />
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                        <span style={{ color: textPrimary, fontSize: 12, fontWeight: 600 }}>{alert.title}</span>
                        {!alert.read && (
                          <span style={{ width: 6, height: 6, borderRadius: '50%', background: getAlertColor(alert.severity) }} />
                        )}
                      </div>
                      <p style={{ color: textSecondary, fontSize: 11, margin: 0, marginBottom: 4 }}>{alert.message}</p>
                      <span style={{ color: textMuted, fontSize: 10 }}>{formatTime(alert.timestamp)}</span>
                    </div>

                    <button
                      onClick={(e) => { e.stopPropagation(); dismissAlert(alert.id); }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: 20,
                        height: 20,
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        opacity: 0.5,
                      }}
                    >
                      <X size={12} color={textMuted} />
                    </button>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface AlertBadgeProps {
  count: number;
}

export function AlertBadge({ count }: AlertBadgeProps) {
  if (count === 0) return null;

  return (
    <span
      style={{
        minWidth: 18,
        height: 18,
        padding: '0 5px',
        borderRadius: 9,
        background: '#ef4444',
        color: '#fff',
        fontSize: 10,
        fontWeight: 700,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {count > 99 ? '99+' : count}
    </span>
  );
}
