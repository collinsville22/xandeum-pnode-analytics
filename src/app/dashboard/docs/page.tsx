'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Globe,
  Server,
  BarChart3,
  TrendingUp,
  Coins,
  ArrowLeftRight,
  Database,
  Shield,
  Zap,
  ExternalLink,
  ChevronRight,
  BookOpen,
  HardDrive,
  Layers,
  Users,
  Award,
  ArrowRight,
  Play,
  Terminal,
} from 'lucide-react';
import { usePreferences } from '@/contexts/preferences-context';

export default function DocsPage() {
  const { preferences, resolvedTheme } = usePreferences();
  const [activeTab, setActiveTab] = useState<'overview' | 'architecture' | 'tokens'>('overview');

  const bgBase = resolvedTheme === 'light' ? '#f5f5f5' : '#121212';
  const bgRaised = resolvedTheme === 'light' ? '#ffffff' : '#1a1a1a';
  const bgElevated = resolvedTheme === 'light' ? '#f0f0f0' : '#252525';
  const textPrimary = resolvedTheme === 'light' ? '#1a1a1a' : '#ffffff';
  const textSecondary = resolvedTheme === 'light' ? '#666666' : '#888888';
  const textMuted = resolvedTheme === 'light' ? '#999999' : '#666666';
  const border = resolvedTheme === 'light' ? '#e0e0e0' : '#2a2a2a';
  const borderHover = resolvedTheme === 'light' ? '#d0d0d0' : '#333333';
  const accentColor = preferences.xandeumTheme ? '#14b8a6' : '#f59e0b';

  return (
    <div style={{ minHeight: '100vh', background: bgBase }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 24px', borderBottom: `1px solid ${border}`, background: bgRaised }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <BookOpen size={18} color={accentColor} />
          <span style={{ color: textPrimary, fontSize: 15, fontWeight: 600 }}>Learn</span>
        </div>
        <div style={{ display: 'inline-flex', background: bgElevated, borderRadius: 6, padding: 3 }}>
          {(['overview', 'architecture', 'tokens'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: '6px 16px', borderRadius: 4, fontSize: 12, fontWeight: 600,
                background: activeTab === tab ? accentColor : 'transparent',
                color: activeTab === tab ? '#000' : textSecondary,
                border: 'none', cursor: 'pointer', textTransform: 'capitalize',
              }}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding: 24 }}>
        {activeTab === 'overview' && (
          <>
            <div style={{
              padding: '48px 40px', marginBottom: 24, borderRadius: 12,
              background: resolvedTheme === 'light' ? `linear-gradient(135deg, #ffffff 0%, ${bgElevated} 100%)` : `linear-gradient(135deg, #1a1a1a 0%, #252525 100%)`,
              border: `1px solid ${border}`, position: 'relative', overflow: 'hidden',
            }}>
              <div style={{
                position: 'absolute', right: -50, top: -50, width: 200, height: 200,
                background: `radial-gradient(circle, ${accentColor}1a 0%, transparent 70%)`,
                borderRadius: '50%',
              }} />
              <div style={{ maxWidth: 600, position: 'relative', zIndex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                  <span style={{ padding: '4px 10px', borderRadius: 4, background: `${accentColor}26`, color: accentColor, fontSize: 11, fontWeight: 600 }}>
                    COMMUNITY PLATFORM
                  </span>
                </div>
                <h1 style={{ color: textPrimary, fontSize: 36, fontWeight: 800, marginBottom: 16, lineHeight: 1.2 }}>
                  Monitor the Xandeum<br />Storage Network
                </h1>
                <p style={{ color: textSecondary, fontSize: 15, lineHeight: 1.7, marginBottom: 24 }}>
                  Real-time analytics for pNode operators and network observers. Track performance, monitor distribution, and understand the decentralized storage layer powering Solana.
                </p>
                <div style={{ display: 'flex', gap: 12 }}>
                  <Link
                    href="/dashboard"
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 8,
                      padding: '12px 20px', borderRadius: 8, background: accentColor,
                      color: '#000', fontSize: 14, fontWeight: 600, textDecoration: 'none',
                    }}
                  >
                    <Play size={16} />
                    Open Dashboard
                  </Link>
                  <a
                    href="https://docs.xandeum.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 8,
                      padding: '12px 20px', borderRadius: 8, background: bgElevated,
                      border: `1px solid ${borderHover}`, color: textSecondary, fontSize: 14, fontWeight: 600, textDecoration: 'none',
                    }}
                  >
                    <Terminal size={16} />
                    Run a pNode
                  </a>
                </div>
              </div>
            </div>

            <div style={{ marginBottom: 24 }}>
              <h2 style={{ color: textPrimary, fontSize: 18, fontWeight: 700, marginBottom: 16 }}>What You Can Do Here</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                {[
                  { icon: Globe, title: 'Live Network Map', desc: 'See pNodes distributed across 30+ countries', href: '/dashboard' },
                  { icon: Server, title: 'Node Explorer', desc: 'Browse all nodes with detailed metrics', href: '/dashboard/nodes' },
                  { icon: BarChart3, title: 'Performance Stats', desc: 'CPU, RAM, storage, uptime tracking', href: '/dashboard/network' },
                  { icon: TrendingUp, title: 'Market Data', desc: 'XAND price, volume, liquidity', href: '/dashboard/trade' },
                  { icon: Coins, title: 'Staking Calculator', desc: 'Estimate XANDsol rewards at 16% APY', href: '/dashboard/stake' },
                  { icon: Database, title: 'Data Served Rankings', desc: 'Node performance leaderboards', href: '/dashboard/nodes' },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.title}
                      href={item.href}
                      style={{
                        padding: 20, borderRadius: 8, background: bgRaised, border: `1px solid ${border}`,
                        textDecoration: 'none', transition: 'border-color 0.15s',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.borderColor = borderHover)}
                      onMouseLeave={(e) => (e.currentTarget.style.borderColor = border)}
                    >
                      <Icon size={20} color={accentColor} style={{ marginBottom: 12 }} />
                      <div style={{ color: textPrimary, fontSize: 14, fontWeight: 600, marginBottom: 4 }}>{item.title}</div>
                      <div style={{ color: textMuted, fontSize: 12 }}>{item.desc}</div>
                    </Link>
                  );
                })}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
              <div style={{ padding: 24, borderRadius: 8, background: bgRaised, border: `1px solid ${border}` }}>
                <h3 style={{ color: textPrimary, fontSize: 16, fontWeight: 700, marginBottom: 16 }}>What is Xandeum?</h3>
                <p style={{ color: textSecondary, fontSize: 13, lineHeight: 1.7, marginBottom: 12 }}>
                  Xandeum adds a massive storage layer to Solana. Think of Solana as fast RAM—great for computation, but limited. Xandeum is the hard drive—affordable storage that smart contracts can read and write directly.
                </p>
                <p style={{ color: textSecondary, fontSize: 13, lineHeight: 1.7 }}>
                  This enables <span style={{ color: textPrimary }}>sedApps</span>: storage-enabled dApps like social platforms, AI tools, and knowledge bases that need Web2-scale data with Web3 trust.
                </p>
              </div>
              <div style={{ padding: 24, borderRadius: 8, background: bgRaised, border: `1px solid ${border}` }}>
                <h3 style={{ color: textPrimary, fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Who Runs This?</h3>
                <p style={{ color: textSecondary, fontSize: 13, lineHeight: 1.7, marginBottom: 12 }}>
                  This analytics platform is built by the community, for the community. It's not an official Xandeum product—just a tool to help operators and enthusiasts monitor the network.
                </p>
                <p style={{ color: textSecondary, fontSize: 13, lineHeight: 1.7 }}>
                  The storage network itself is decentralized: <span style={{ color: '#22c55e' }}>pNodes</span> run by individuals worldwide store data, earning rewards through the STOINC program.
                </p>
              </div>
            </div>
          </>
        )}

        {activeTab === 'architecture' && (
          <>
            <div style={{ marginBottom: 24, padding: 32, borderRadius: 12, background: bgRaised, border: `1px solid ${border}` }}>
              <h2 style={{ color: textPrimary, fontSize: 20, fontWeight: 700, marginBottom: 24, textAlign: 'center' }}>How It Works</h2>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 20 }}>
                <div style={{ textAlign: 'center', padding: 20 }}>
                  <div style={{ width: 80, height: 80, borderRadius: 16, background: bgElevated, margin: '0 auto 12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Layers size={36} color="#9945FF" />
                  </div>
                  <div style={{ color: textPrimary, fontSize: 14, fontWeight: 600 }}>Solana</div>
                  <div style={{ color: textMuted, fontSize: 11 }}>Smart Contracts</div>
                </div>
                <ArrowRight size={24} color={borderHover} />
                <div style={{ textAlign: 'center', padding: 20 }}>
                  <div style={{ width: 80, height: 80, borderRadius: 16, background: bgElevated, margin: '0 auto 12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <HardDrive size={36} color={accentColor} />
                  </div>
                  <div style={{ color: textPrimary, fontSize: 14, fontWeight: 600 }}>Xandeum</div>
                  <div style={{ color: textMuted, fontSize: 11 }}>Storage Layer</div>
                </div>
                <ArrowRight size={24} color={borderHover} />
                <div style={{ textAlign: 'center', padding: 20 }}>
                  <div style={{ width: 80, height: 80, borderRadius: 16, background: bgElevated, margin: '0 auto 12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Server size={36} color="#22c55e" />
                  </div>
                  <div style={{ color: textPrimary, fontSize: 14, fontWeight: 600 }}>pNodes</div>
                  <div style={{ color: textMuted, fontSize: 11 }}>200+ Worldwide</div>
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
              {[
                {
                  icon: Server, color: '#22c55e', title: 'pNodes (Provider Nodes)',
                  desc: 'Community-operated servers that store data shards. They use erasure coding for redundancy and gossip protocols for coordination. Operators earn STOINC rewards based on uptime.',
                  details: ['Erasure coding splits data into redundant shards', 'No single node holds complete files', 'Ports: 9001 (gossip), 5000 (Atlas), 6000 (pRPC)'],
                },
                {
                  icon: Shield, color: '#3b82f6', title: 'vNodes (Validator Nodes)',
                  desc: 'Supervisory nodes that verify pNode integrity through cryptographic challenges. They ensure data availability without burdening Solana validators.',
                  details: ['Periodic proof challenges', 'Slash misbehaving nodes', 'Anchor proofs on Solana'],
                },
                {
                  icon: Database, color: '#8b5cf6', title: 'Pods & Gossip Protocol',
                  desc: 'pNodes are organized into pods that communicate via gossip. This enables dynamic status updates, data availability checks, and efficient distribution.',
                  details: ['Heartbeats every 30 seconds', 'Automatic data reconstruction', 'Self-healing network'],
                },
                {
                  icon: Zap, color: '#f59e0b', title: 'Storage Trilemma Solved',
                  desc: 'Xandeum achieves what others couldn\'t: scalability (exabytes), smart contract integration (native Solana), and random access (read any byte).',
                  details: ['Not just file storage—file system storage', 'Direct smart contract access', 'Configurable redundancy levels'],
                },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.title} style={{ padding: 24, borderRadius: 8, background: bgRaised, border: `1px solid ${border}` }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                      <div style={{ width: 40, height: 40, borderRadius: 10, background: `${item.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Icon size={20} color={item.color} />
                      </div>
                      <div style={{ color: textPrimary, fontSize: 15, fontWeight: 600 }}>{item.title}</div>
                    </div>
                    <p style={{ color: textSecondary, fontSize: 13, lineHeight: 1.6, marginBottom: 16 }}>{item.desc}</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {item.details.map((detail, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ width: 4, height: 4, borderRadius: '50%', background: item.color }} />
                          <span style={{ color: textMuted, fontSize: 12 }}>{detail}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={{ padding: 20, borderRadius: 8, background: bgRaised, border: `1px solid ${border}` }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ color: textPrimary, fontSize: 15, fontWeight: 600, marginBottom: 4 }}>Want to go deeper?</div>
                  <div style={{ color: textMuted, fontSize: 13 }}>Read the Greenpaper for full technical details on the architecture.</div>
                </div>
                <a
                  href="https://docs.xandeum.com/xandeum-greenpaper"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '10px 16px', borderRadius: 6, background: bgElevated,
                    border: `1px solid ${borderHover}`, color: textSecondary, fontSize: 13, fontWeight: 600, textDecoration: 'none',
                  }}
                >
                  Read Greenpaper
                  <ExternalLink size={14} />
                </a>
              </div>
            </div>
          </>
        )}

        {activeTab === 'tokens' && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
              <div style={{ padding: 28, borderRadius: 12, background: bgRaised, border: `1px solid ${border}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                  <div style={{ width: 48, height: 48, borderRadius: 12, background: 'linear-gradient(135deg, #f59e0b, #d97706)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ color: '#000', fontSize: 18, fontWeight: 800 }}>X</span>
                  </div>
                  <div>
                    <div style={{ color: textPrimary, fontSize: 18, fontWeight: 700 }}>XAND Token</div>
                    <div style={{ color: textMuted, fontSize: 12 }}>Governance & Utility</div>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
                  <div>
                    <div style={{ color: textMuted, fontSize: 11, marginBottom: 4 }}>Total Supply</div>
                    <div style={{ color: textPrimary, fontSize: 16, fontWeight: 800 }}>4.015B</div>
                  </div>
                  <div>
                    <div style={{ color: textMuted, fontSize: 11, marginBottom: 4 }}>Market Cap</div>
                    <div style={{ color: textPrimary, fontSize: 16, fontWeight: 800 }}>~$3.37M</div>
                  </div>
                </div>
                <p style={{ color: textSecondary, fontSize: 13, lineHeight: 1.6, marginBottom: 20 }}>
                  Lock XAND in the DAO to vote on network upgrades, fee parameters, and treasury allocation. Governance happens on Realms.
                </p>
                <div style={{ display: 'flex', gap: 8 }}>
                  <Link
                    href="/dashboard/trade"
                    style={{
                      flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                      padding: '10px 0', borderRadius: 6, background: accentColor,
                      color: '#000', fontSize: 13, fontWeight: 600, textDecoration: 'none',
                    }}
                  >
                    <ArrowLeftRight size={14} />
                    Trade
                  </Link>
                  <a
                    href="https://realms.today/dao/XAND"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                      padding: '10px 0', borderRadius: 6, background: bgElevated,
                      border: `1px solid ${borderHover}`, color: textSecondary, fontSize: 13, fontWeight: 600, textDecoration: 'none',
                    }}
                  >
                    <Users size={14} />
                    DAO
                  </a>
                </div>
              </div>

              <div style={{ padding: 28, borderRadius: 12, background: bgRaised, border: `1px solid ${border}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                  <div style={{ width: 48, height: 48, borderRadius: 12, background: 'linear-gradient(135deg, #22c55e, #16a34a)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Coins size={22} color="#000" />
                  </div>
                  <div>
                    <div style={{ color: textPrimary, fontSize: 18, fontWeight: 700 }}>XANDsol</div>
                    <div style={{ color: textMuted, fontSize: 12 }}>Liquid Staking Token</div>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
                  <div>
                    <div style={{ color: textMuted, fontSize: 11, marginBottom: 4 }}>Current APY</div>
                    <div style={{ color: '#22c55e', fontSize: 16, fontWeight: 800 }}>~16%</div>
                  </div>
                  <div>
                    <div style={{ color: textMuted, fontSize: 11, marginBottom: 4 }}>Exchange Rate</div>
                    <div style={{ color: textPrimary, fontSize: 16, fontWeight: 800 }}>0.9175</div>
                  </div>
                </div>
                <p style={{ color: textSecondary, fontSize: 13, lineHeight: 1.6, marginBottom: 20 }}>
                  Stake SOL and receive XANDsol. It accrues value over time as rewards compound. Use it in DeFi while still earning—no lock-up required.
                </p>
                <div style={{ display: 'flex', gap: 8 }}>
                  <Link
                    href="/dashboard/stake"
                    style={{
                      flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                      padding: '10px 0', borderRadius: 6, background: '#22c55e',
                      color: '#000', fontSize: 13, fontWeight: 600, textDecoration: 'none',
                    }}
                  >
                    <Coins size={14} />
                    Stake Now
                  </Link>
                  <a
                    href="https://xandsol.xandeum.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                      padding: '10px 0', borderRadius: 6, background: bgElevated,
                      border: `1px solid ${borderHover}`, color: textSecondary, fontSize: 13, fontWeight: 600, textDecoration: 'none',
                    }}
                  >
                    XANDsol App
                    <ExternalLink size={12} />
                  </a>
                </div>
              </div>
            </div>

            <div style={{ padding: 28, borderRadius: 12, background: bgRaised, border: `1px solid ${border}`, marginBottom: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                <div style={{ width: 48, height: 48, borderRadius: 12, background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Award size={22} color="#fff" />
                </div>
                <div>
                  <div style={{ color: textPrimary, fontSize: 18, fontWeight: 700 }}>STOINC (Storage Income)</div>
                  <div style={{ color: textMuted, fontSize: 12 }}>pNode Operator Rewards</div>
                </div>
              </div>
              <p style={{ color: textSecondary, fontSize: 14, lineHeight: 1.7, marginBottom: 20 }}>
                pNode operators are ranked by total data served to the network. Heartbeats every 30 seconds confirm availability. The top performers receive monthly XAND allocations (10,000 tokens) through the Foundation Delegation Program. NFT multipliers can boost earnings.
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
                {[
                  { label: 'Heartbeat Interval', value: '30s' },
                  { label: 'Monthly Pool', value: '10,000 XAND' },
                  { label: 'NFT Boost', value: 'Up to 10x' },
                  { label: 'Requirements', value: '99%+ Uptime' },
                ].map((item) => (
                  <div key={item.label} style={{ padding: 16, borderRadius: 8, background: bgElevated }}>
                    <div style={{ color: textMuted, fontSize: 11, marginBottom: 6 }}>{item.label}</div>
                    <div style={{ color: textPrimary, fontSize: 16, fontWeight: 800 }}>{item.value}</div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ padding: 20, borderRadius: 8, background: bgRaised, border: `1px solid ${border}` }}>
              <div style={{ color: textSecondary, fontSize: 13, marginBottom: 12 }}>Official Resources</div>
              <div style={{ display: 'flex', gap: 12 }}>
                {[
                  { label: 'Docs', href: 'https://docs.xandeum.com' },
                  { label: 'Greenpaper', href: 'https://docs.xandeum.com/xandeum-greenpaper' },
                  { label: 'pNode Guide', href: 'https://docs.xandeum.com/operator-guides' },
                  { label: 'Discord', href: 'https://discord.gg/xandeum' },
                ].map((link) => (
                  <a
                    key={link.label}
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'flex', alignItems: 'center', gap: 6,
                      padding: '8px 14px', borderRadius: 6, background: bgElevated,
                      border: `1px solid ${borderHover}`, color: textSecondary, fontSize: 12, fontWeight: 600, textDecoration: 'none',
                    }}
                  >
                    {link.label}
                    <ExternalLink size={10} />
                  </a>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
