'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Settings,
  Palette,
  Monitor,
  Sun,
  Moon,
  Database,
  Star,
  Check,
  Trash2,
  ExternalLink,
} from 'lucide-react';
import { usePreferences } from '@/contexts/preferences-context';

export default function SettingsPage() {
  const router = useRouter();
  const { preferences, updatePreference, savePreferences, removeFromWatchlist, resolvedTheme } = usePreferences();
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  const handleSave = () => {
    setSaveStatus('saving');
    savePreferences();
    setTimeout(() => {
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    }, 500);
  };

  const bgBase = resolvedTheme === 'light' ? '#f5f5f5' : '#121212';
  const bgRaised = resolvedTheme === 'light' ? '#ffffff' : '#1a1a1a';
  const bgElevated = resolvedTheme === 'light' ? '#ffffff' : '#252525';
  const textPrimary = resolvedTheme === 'light' ? '#1a1a1a' : '#ffffff';
  const textSecondary = resolvedTheme === 'light' ? '#666666' : '#888888';
  const textMuted = resolvedTheme === 'light' ? '#999999' : '#666666';
  const border = resolvedTheme === 'light' ? '#e0e0e0' : '#2a2a2a';
  const borderHover = resolvedTheme === 'light' ? '#d0d0d0' : '#333333';
  const accentColor = preferences.xandeumTheme ? '#14b8a6' : '#f59e0b';

  const themeOptions = [
    { id: 'light', label: 'Light', icon: Sun },
    { id: 'dark', label: 'Dark', icon: Moon },
    { id: 'system', label: 'System', icon: Monitor },
  ] as const;

  const refreshOptions = [
    { value: 15, label: '15 Seconds' },
    { value: 30, label: '30 Seconds' },
    { value: 60, label: '1 Minute' },
    { value: 120, label: '2 Minutes' },
    { value: 300, label: '5 Minutes' },
  ];

  return (
    <div style={{ minHeight: '100vh', background: bgBase }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 24px', borderBottom: `1px solid ${border}`, background: bgRaised }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Settings size={18} color={accentColor} />
          <span style={{ color: textPrimary, fontSize: 15, fontWeight: 600 }}>Settings</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ color: textMuted, fontSize: 11, textTransform: 'uppercase' }}>Home &gt; Dashboard &gt; Settings</span>
        </div>
      </div>

      <div style={{ padding: 24, maxWidth: 800, margin: '0 auto' }}>
        <div style={{ padding: 24, borderRadius: 8, background: bgRaised, border: `1px solid ${border}`, marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <Palette size={18} color="#8b5cf6" />
            <h2 style={{ color: textPrimary, fontSize: 16, fontWeight: 600, margin: 0 }}>Visual Options</h2>
          </div>
          <p style={{ color: textMuted, fontSize: 12, marginBottom: 24 }}>Customize the appearance of your dashboard</p>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
            <div>
              <h3 style={{ color: textPrimary, fontSize: 14, fontWeight: 600, margin: '0 0 4px 0' }}>Xandeum Theme</h3>
              <p style={{ color: textMuted, fontSize: 12, margin: 0 }}>Use the official Xandeum brand colors (Teal & Navy)</p>
            </div>
            <button
              onClick={() => updatePreference('xandeumTheme', !preferences.xandeumTheme)}
              style={{
                width: 48,
                height: 26,
                borderRadius: 13,
                border: 'none',
                background: preferences.xandeumTheme ? '#14b8a6' : borderHover,
                cursor: 'pointer',
                position: 'relative',
                transition: 'background 0.2s',
              }}
            >
              <span style={{
                position: 'absolute',
                top: 3,
                left: preferences.xandeumTheme ? 25 : 3,
                width: 20,
                height: 20,
                borderRadius: '50%',
                background: '#fff',
                transition: 'left 0.2s',
              }} />
            </button>
          </div>

          <div>
            <h3 style={{ color: textPrimary, fontSize: 14, fontWeight: 600, margin: '0 0 12px 0' }}>Theme Mode</h3>
            <div style={{ display: 'flex', gap: 8 }}>
              {themeOptions.map((option) => {
                const Icon = option.icon;
                const isActive = preferences.theme === option.id;
                return (
                  <button
                    key={option.id}
                    onClick={() => updatePreference('theme', option.id)}
                    style={{
                      flex: 1,
                      padding: '12px 16px',
                      borderRadius: 8,
                      border: isActive ? `1px solid ${accentColor}` : `1px solid ${borderHover}`,
                      background: isActive ? `${accentColor}1a` : bgElevated,
                      color: isActive ? textPrimary : textSecondary,
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                      transition: 'all 0.15s',
                    }}
                  >
                    <Icon size={16} color={isActive ? accentColor : textMuted} />
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div style={{ padding: 24, borderRadius: 8, background: bgRaised, border: `1px solid ${border}`, marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <Database size={18} color="#3b82f6" />
            <h2 style={{ color: textPrimary, fontSize: 16, fontWeight: 600, margin: 0 }}>Dashboard Configuration</h2>
          </div>
          <p style={{ color: textMuted, fontSize: 12, marginBottom: 24 }}>Manage network connections and data preferences</p>

          <div style={{ marginBottom: 20 }}>
            <h3 style={{ color: textPrimary, fontSize: 14, fontWeight: 600, margin: '0 0 8px 0' }}>Custom RPC Endpoint</h3>
            <input
              type="text"
              value={preferences.customRpcEndpoint}
              onChange={(e) => updatePreference('customRpcEndpoint', e.target.value)}
              placeholder="https://api.mainnet-beta.solana.com"
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: 8,
                border: `1px solid ${borderHover}`,
                background: bgElevated,
                color: textPrimary,
                fontSize: 13,
                fontFamily: 'monospace',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
            <p style={{ color: textMuted, fontSize: 11, marginTop: 8 }}>
              Leave empty to use the default Xandeum RPC aggregator.
            </p>
          </div>

          <div style={{ marginBottom: 24 }}>
            <h3 style={{ color: textPrimary, fontSize: 14, fontWeight: 600, margin: '0 0 8px 0' }}>Auto-Refresh Interval</h3>
            <select
              value={preferences.autoRefreshInterval}
              onChange={(e) => updatePreference('autoRefreshInterval', parseInt(e.target.value))}
              style={{
                padding: '10px 14px',
                borderRadius: 8,
                border: `1px solid ${borderHover}`,
                background: bgElevated,
                color: textPrimary,
                fontSize: 13,
                cursor: 'pointer',
                outline: 'none',
              }}
            >
              {refreshOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button
              onClick={handleSave}
              disabled={saveStatus === 'saving'}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '10px 20px',
                borderRadius: 8,
                border: 'none',
                background: saveStatus === 'saved' ? '#22c55e' : accentColor,
                color: '#000',
                fontSize: 13,
                fontWeight: 600,
                cursor: saveStatus === 'saving' ? 'wait' : 'pointer',
                transition: 'background 0.2s',
              }}
            >
              <Check size={16} />
              {saveStatus === 'saving' ? 'Saving...' : saveStatus === 'saved' ? 'Saved!' : 'Save Preferences'}
            </button>
          </div>
        </div>

        <div style={{ padding: 24, borderRadius: 8, background: bgRaised, border: `1px solid ${border}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <Star size={18} color={accentColor} />
            <h2 style={{ color: textPrimary, fontSize: 16, fontWeight: 600, margin: 0 }}>Watchlist</h2>
          </div>
          <p style={{ color: textMuted, fontSize: 12, marginBottom: 24 }}>
            Manage your watched nodes. Click on a node address to view its details.
          </p>

          {preferences.watchlist.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px' }}>
              <div style={{
                width: 64, height: 64, borderRadius: 16,
                background: `${accentColor}1a`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 16px',
              }}>
                <Star size={28} color={textMuted} />
              </div>
              <h3 style={{ color: textPrimary, fontSize: 16, fontWeight: 600, marginBottom: 8 }}>
                No nodes in watchlist
              </h3>
              <p style={{ color: textMuted, fontSize: 13, marginBottom: 20, lineHeight: 1.6 }}>
                Add nodes to your watchlist from the node details<br />
                page to quickly access them here.
              </p>
              <button
                onClick={() => router.push('/dashboard/nodes')}
                style={{
                  padding: '10px 20px',
                  borderRadius: 8,
                  border: `1px solid ${borderHover}`,
                  background: 'transparent',
                  color: textPrimary,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Browse Nodes
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {preferences.watchlist.map((node) => (
                <div
                  key={node.ip}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 16px',
                    borderRadius: 8,
                    background: bgElevated,
                    border: `1px solid ${borderHover}`,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{
                      width: 8, height: 8, borderRadius: '50%',
                      background: '#22c55e',
                    }} />
                    <div>
                      <button
                        onClick={() => router.push(`/dashboard/nodes/${node.ip}`)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: textPrimary,
                          fontSize: 14,
                          fontWeight: 600,
                          fontFamily: 'monospace',
                          cursor: 'pointer',
                          padding: 0,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                        }}
                      >
                        {node.ip}
                        <ExternalLink size={12} color={textMuted} />
                      </button>
                      {node.name && (
                        <p style={{ color: textMuted, fontSize: 11, margin: '2px 0 0 0' }}>{node.name}</p>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => removeFromWatchlist(node.ip)}
                    style={{
                      width: 32, height: 32, borderRadius: 6,
                      background: 'transparent', border: `1px solid ${borderHover}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      cursor: 'pointer',
                    }}
                  >
                    <Trash2 size={14} color={textMuted} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
