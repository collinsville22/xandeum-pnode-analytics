'use client';

import { useState, useEffect } from 'react';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Droplets,
  Coins,
  CircleDot,
  ExternalLink,
  RefreshCw,
  ArrowLeftRight,
  Loader2,
} from 'lucide-react';
import { SwapWidget } from '@/components/swap/swap-widget';
import { XAND_MINT } from '@/config/solana';
import { usePreferences } from '@/contexts/preferences-context';

interface PriceData {
  xand: {
    price: number | null;
    priceFormatted: string | null;
    marketCap: number | null;
    marketCapFormatted: string | null;
    fdv: number | null;
    fdvFormatted: string | null;
    circulatingSupply: number;
    circulatingSupplyFormatted: string | null;
    maxSupply: number;
    maxSupplyFormatted: string | null;
    priceChange24h: number | null;
  };
  sol: {
    price: number | null;
    priceFormatted: string | null;
    priceChange24h: number | null;
  };
  timestamp: number;
}

export default function TradePage() {
  const { preferences, resolvedTheme } = usePreferences();
  const refreshInterval = preferences.autoRefreshInterval;
  const [priceData, setPriceData] = useState<PriceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [countdown, setCountdown] = useState(refreshInterval);

  const bgBase = resolvedTheme === 'light' ? '#f5f5f5' : '#121212';
  const bgRaised = resolvedTheme === 'light' ? '#ffffff' : '#1a1a1a';
  const bgElevated = resolvedTheme === 'light' ? '#f0f0f0' : '#252525';
  const textPrimary = resolvedTheme === 'light' ? '#1a1a1a' : '#ffffff';
  const textSecondary = resolvedTheme === 'light' ? '#666666' : '#888888';
  const textMuted = resolvedTheme === 'light' ? '#999999' : '#666666';
  const border = resolvedTheme === 'light' ? '#e0e0e0' : '#2a2a2a';
  const borderHover = resolvedTheme === 'light' ? '#d0d0d0' : '#333333';
  const accentColor = preferences.xandeumTheme ? '#14b8a6' : '#f59e0b';

  const fetchPrices = async () => {
    try {
      const res = await fetch('/api/prices');
      const data = await res.json();
      setPriceData(data);
    } catch (err) {
      console.error('Failed to fetch prices:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrices();
    const interval = setInterval(fetchPrices, refreshInterval * 1000);
    return () => clearInterval(interval);
  }, [refreshInterval]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          fetchPrices();
          return refreshInterval;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [refreshInterval]);

  const formatChange = (change: number | null | undefined) => {
    if (change === null || change === undefined) return null;
    const sign = change >= 0 ? '+' : '';
    return `${sign}${change.toFixed(2)}%`;
  };

  const xandChange = priceData?.xand?.priceChange24h;
  const solChange = priceData?.sol?.priceChange24h;

  const stats = [
    {
      label: 'XAND Price',
      value: priceData?.xand?.priceFormatted || '–',
      change: formatChange(xandChange),
      changePositive: xandChange !== null && xandChange !== undefined && xandChange >= 0,
      color: '#22c55e',
      icon: DollarSign
    },
    {
      label: 'Market Cap',
      value: priceData?.xand?.marketCapFormatted || '–',
      change: null,
      changePositive: false,
      color: '#3b82f6',
      icon: TrendingUp
    },
    {
      label: 'FDV',
      value: priceData?.xand?.fdvFormatted || '–',
      change: null,
      changePositive: false,
      color: '#8b5cf6',
      icon: BarChart3
    },
    {
      label: 'SOL Price',
      value: priceData?.sol?.priceFormatted || '–',
      change: formatChange(solChange),
      changePositive: solChange !== null && solChange !== undefined && solChange >= 0,
      color: '#f59e0b',
      icon: Droplets
    },
    {
      label: 'Max Supply',
      value: priceData?.xand?.maxSupplyFormatted || '–',
      change: null,
      changePositive: false,
      color: '#06b6d4',
      icon: Coins
    },
    {
      label: 'Circulating',
      value: priceData?.xand?.circulatingSupplyFormatted || '–',
      change: null,
      changePositive: false,
      color: '#ec4899',
      icon: CircleDot
    },
  ];

  const xandSolRate = priceData?.xand?.price && priceData?.sol?.price
    ? (priceData.xand.price / priceData.sol.price).toFixed(8)
    : null;

  return (
    <div style={{ minHeight: '100vh', background: bgBase }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 24px', borderBottom: `1px solid ${border}`, background: bgRaised }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <ArrowLeftRight size={18} color={accentColor} />
          <span style={{ color: textPrimary, fontSize: 15, fontWeight: 600 }}>Trade XAND</span>
          <span style={{ padding: '2px 8px', borderRadius: 4, background: 'rgba(34, 197, 94, 0.1)', color: '#22c55e', fontSize: 11, fontWeight: 600 }}>
            Live
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ color: textMuted, fontSize: 11 }}>Refresh in {countdown}s</span>
          <button
            onClick={() => { fetchPrices(); setCountdown(30); }}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', background: bgElevated, border: `1px solid ${borderHover}`, borderRadius: 6, cursor: 'pointer', color: textSecondary, fontSize: 12 }}
          >
            <RefreshCw size={12} />
            Refresh
          </button>
        </div>
      </div>

      <div style={{ padding: 24 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 12, marginBottom: 24 }}>
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} style={{ padding: '16px 14px', borderRadius: 8, background: bgRaised, border: `1px solid ${border}` }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <span style={{ color: textSecondary, fontSize: 11, fontWeight: 600 }}>{stat.label}</span>
                  <div style={{ width: 28, height: 28, borderRadius: 6, background: `${stat.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon size={14} color={stat.color} />
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                  <span style={{ fontSize: 22, fontWeight: 800, color: textPrimary, lineHeight: 1 }}>
                    {loading ? <Loader2 size={20} className="animate-spin" color={textMuted} /> : stat.value}
                  </span>
                  {stat.change && !loading && (
                    <span style={{
                      fontSize: 11,
                      fontWeight: 600,
                      color: stat.changePositive ? '#22c55e' : '#ef4444',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 2
                    }}>
                      {stat.changePositive ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                      {stat.change}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
          <div>
            <SwapWidget />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ padding: 20, borderRadius: 8, background: bgRaised, border: `1px solid ${border}` }}>
              <span style={{ color: textMuted, fontSize: 10, fontWeight: 600, letterSpacing: '0.5px' }}>XAND/SOL RATE</span>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 8 }}>
                <span style={{ fontSize: 28, fontWeight: 800, color: textPrimary, fontFamily: 'monospace' }}>
                  {loading ? '–' : xandSolRate || '–'}
                </span>
              </div>
              <div style={{ display: 'flex', gap: 16, marginTop: 16 }}>
                <div>
                  <div style={{ color: textMuted, fontSize: 10 }}>XAND Price (USD)</div>
                  <div style={{ color: '#22c55e', fontSize: 18, fontFamily: 'monospace', fontWeight: 800 }}>
                    {priceData?.xand?.priceFormatted || '–'}
                  </div>
                </div>
                <div>
                  <div style={{ color: textMuted, fontSize: 10 }}>SOL Price (USD)</div>
                  <div style={{ color: accentColor, fontSize: 18, fontFamily: 'monospace', fontWeight: 800 }}>
                    {priceData?.sol?.priceFormatted || '–'}
                  </div>
                </div>
              </div>
            </div>

            <div style={{ padding: 20, borderRadius: 8, background: bgRaised, border: `1px solid ${border}`, flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <img src="/xandeum-logo.png" alt="XAND" width={44} height={44} style={{ borderRadius: 12 }} />
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ color: textPrimary, fontSize: 15, fontWeight: 600 }}>Xandeum</span>
                    <span style={{ padding: '2px 8px', borderRadius: 4, background: bgElevated, color: textMuted, fontSize: 11 }}>XAND</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 2 }}>
                    <code style={{ color: textMuted, fontSize: 11, fontFamily: 'monospace' }}>XANDuUoV...21Gaj3Hx</code>
                    <a href={`https://solscan.io/token/${XAND_MINT}`} target="_blank" rel="noopener noreferrer">
                      <ExternalLink size={10} color={textMuted} style={{ cursor: 'pointer' }} />
                    </a>
                  </div>
                </div>
              </div>

              <p style={{ color: textSecondary, fontSize: 13, marginBottom: 16, lineHeight: 1.6 }}>
                Xandeum is building a scalable, decentralized storage layer for the Solana blockchain.
                It aims to solve the &apos;blockchain storage trilemma&apos; by providing a solution that is
                scalable, smart contract native, and supports random access.
              </p>

              <div style={{ marginBottom: 16 }}>
                <h4 style={{ color: textPrimary, fontSize: 12, fontWeight: 600, marginBottom: 10 }}>Key Features</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {[
                    'Scalable storage (exabytes+) for data-intensive dApps',
                    'Smart contract native integration with Solana',
                    'Random access for quick data retrieval',
                    'First multi-validator liquid staking pool',
                  ].map((feature, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, color: textSecondary, fontSize: 11 }}>
                      <span style={{ width: 4, height: 4, borderRadius: '50%', background: '#22c55e', flexShrink: 0 }} />
                      {feature}
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {[
                  { label: 'Website', href: 'https://xandeum.network' },
                  { label: 'Solscan', href: `https://solscan.io/token/${XAND_MINT}` },
                  { label: 'Birdeye', href: `https://birdeye.so/token/${XAND_MINT}?chain=solana` },
                  { label: 'Twitter', href: 'https://twitter.com/XandeumNetwork' },
                ].map((link) => (
                  <a
                    key={link.label}
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 12px', borderRadius: 6, background: bgElevated, border: `1px solid ${borderHover}`, color: textSecondary, fontSize: 11, textDecoration: 'none' }}
                  >
                    <ExternalLink size={10} />
                    {link.label}
                  </a>
                ))}
              </div>
            </div>

            <div style={{ padding: 12, borderRadius: 8, background: bgRaised, border: `1px solid ${border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <span style={{ color: textMuted, fontSize: 11 }}>Powered by</span>
              <a href="https://jup.ag" target="_blank" rel="noopener noreferrer" style={{ color: '#22c55e', fontSize: 11, fontWeight: 600, textDecoration: 'none' }}>
                Jupiter V6 API
              </a>
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .animate-spin {
          animation: spin 1s linear infinite;
        }
      `}</style>
    </div>
  );
}
