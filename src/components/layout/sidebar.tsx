'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import {
  Home,
  TrendingUp,
  Server,
  ArrowLeftRight,
  Coins,
  FileText,
  Settings,
  ChevronLeft,
  Zap,
  ExternalLink,
  Wallet,
  GitCompare,
} from 'lucide-react';
import { WalletButton } from '@/components/wallet/wallet-button';
import { usePreferences } from '@/contexts/preferences-context';

interface NavItem {
  name: string;
  href: string;
  icon: React.ElementType;
  section?: string;
}

const navItems: NavItem[] = [
  { name: 'Overview', href: '/dashboard', icon: Home },
  { name: 'Network', href: '/dashboard/network', icon: TrendingUp, section: 'pNodes' },
  { name: 'Nodes', href: '/dashboard/nodes', icon: Server },
  { name: 'Compare', href: '/dashboard/compare', icon: GitCompare },
  { name: 'Trade XAND', href: '/dashboard/trade', icon: ArrowLeftRight, section: 'Trading' },
  { name: 'Stake SOL', href: '/dashboard/stake', icon: Coins },
  { name: 'Docs', href: '/dashboard/docs', icon: FileText, section: 'Learn' },
];

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const { resolvedTheme, preferences } = usePreferences();

  const bgRaised = resolvedTheme === 'light' ? '#ffffff' : '#1a1a1a';
  const bgElevated = resolvedTheme === 'light' ? '#f5f5f5' : '#252525';
  const textPrimary = resolvedTheme === 'light' ? '#1a1a1a' : '#ffffff';
  const textSecondary = resolvedTheme === 'light' ? '#666666' : '#999999';
  const textMuted = resolvedTheme === 'light' ? '#999999' : '#666666';
  const border = resolvedTheme === 'light' ? '#e0e0e0' : '#2a2a2a';
  const borderHover = resolvedTheme === 'light' ? '#d0d0d0' : '#333333';
  const accentColor = preferences.xandeumTheme ? '#14b8a6' : '#f59e0b';

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === href;
    return pathname.startsWith(href);
  };

  let lastSection = '';

  if (collapsed) {
    return (
      <aside style={{
        position: 'fixed', left: 0, top: 0, width: 60, height: '100vh',
        background: bgRaised, borderRight: `1px solid ${border}`,
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        paddingTop: 12, zIndex: 40,
      }}>
        <button
          onClick={() => setCollapsed(false)}
          style={{ width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', background: bgElevated, border: `1px solid ${borderHover}`, borderRadius: 6, cursor: 'pointer', marginBottom: 16 }}
        >
          <ChevronLeft size={16} color={textSecondary} style={{ transform: 'rotate(180deg)' }} />
        </button>
        {navItems.filter(item => !item.section || item.section !== lastSection).map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center',
                borderRadius: 6, marginBottom: 4,
                background: active ? `${accentColor}1a` : 'transparent',
              }}
            >
              <Icon size={18} color={active ? accentColor : textSecondary} />
            </Link>
          );
        })}
      </aside>
    );
  }

  return (
    <aside style={{
      position: 'fixed', left: 0, top: 0, width: 220, height: '100vh',
      background: bgRaised, borderRight: `1px solid ${border}`,
      display: 'flex', flexDirection: 'column', zIndex: 40,
    }}>
      <div style={{ height: 48, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 12px', borderBottom: `1px solid ${border}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <img src="/xandeum-logo.png" alt="Xandeum" width={28} height={28} style={{ borderRadius: 6 }} />
          <span style={{ color: textPrimary, fontSize: 14, fontWeight: 600 }}>Xandeum Analytics</span>
        </div>
        <button
          onClick={() => setCollapsed(true)}
          style={{ width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: 'none', cursor: 'pointer', borderRadius: 4 }}
        >
          <ChevronLeft size={16} color={textMuted} />
        </button>
      </div>

      <nav style={{ flex: 1, padding: 8, overflowY: 'auto' }}>
        {navItems.map((item) => {
          const showSection = item.section && item.section !== lastSection;
          if (item.section) lastSection = item.section;
          const active = isActive(item.href);
          const Icon = item.icon;

          return (
            <div key={item.href}>
              {showSection && (
                <p style={{ color: textMuted, fontSize: 11, fontWeight: 600, padding: '16px 12px 8px', textTransform: 'capitalize', letterSpacing: '0.02em' }}>
                  {item.section}
                </p>
              )}
              <Link
                href={item.href}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px',
                  borderRadius: 6, fontSize: 14, fontWeight: 600, textDecoration: 'none',
                  color: active ? textPrimary : textSecondary,
                  background: active ? `${accentColor}1a` : 'transparent',
                  marginBottom: 2,
                }}
              >
                <Icon size={18} color={active ? accentColor : textMuted} />
                {item.name}
              </Link>
            </div>
          );
        })}

        <div style={{ marginTop: 8 }}>
          <p style={{ color: textMuted, fontSize: 11, fontWeight: 600, padding: '16px 12px 8px', letterSpacing: '0.02em' }}>External</p>
          <a
            href="https://docs.xandeum.com"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px',
              borderRadius: 6, fontSize: 14, fontWeight: 600, textDecoration: 'none',
              color: textSecondary, marginBottom: 2,
            }}
          >
            <FileText size={18} color={textMuted} />
            <span style={{ flex: 1 }}>Official Docs</span>
            <ExternalLink size={12} color={textMuted} />
          </a>
        </div>
      </nav>

      <div style={{ padding: 12, borderTop: `1px solid ${border}` }}>
        <div style={{ marginBottom: 12 }}>
          <WalletButton />
        </div>

        <Link
          href="/dashboard/settings"
          style={{
            display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px',
            borderRadius: 6, fontSize: 13, fontWeight: 600, textDecoration: 'none',
            color: textSecondary, background: 'transparent', marginBottom: 12,
          }}
        >
          <Settings size={18} color={textMuted} />
          Settings
        </Link>

        <div style={{ padding: 12, borderRadius: 8, background: bgElevated, border: `1px solid ${borderHover}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 8px rgba(34, 197, 94, 0.5)' }} />
            <span style={{ color: textPrimary, fontSize: 13, fontWeight: 600 }}>Network Online</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Zap size={12} color={accentColor} />
            <span style={{ color: textSecondary, fontSize: 11 }}>232 active nodes</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
