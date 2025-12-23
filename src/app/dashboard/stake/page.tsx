'use client';

import { useState, useEffect, useCallback } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import {
  Percent,
  DollarSign,
  Lock,
  ExternalLink,
  Coins,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Loader2,
  Users,
  ArrowDownUp,
  Wallet,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';
import { XANDSOL_MINT, XANDSOL_STAKE_POOL } from '@/config/solana';
import { depositSol, withdrawSol, getXandsolBalance, getSolBalance } from '@/lib/stake-pool';
import { usePreferences } from '@/contexts/preferences-context';

interface StakePoolData {
  stakePool: {
    address: string;
    poolMint: string;
  };
  stats: {
    xandsolSupply: number;
    xandsolSupplyFormatted: string;
    tvlSol: number;
    tvlSolFormatted: string;
    tvlUsd: number | null;
    tvlUsdFormatted: string | null;
    apy: number;
    apyFormatted: string;
  };
  prices: {
    sol: number | null;
    solFormatted: string | null;
    solPriceChange24h?: number | null;
    xandsol: number | null;
    xandsolFormatted: string | null;
    xandsolPriceChange24h?: number | null;
    exchangeRate: number | null;
    exchangeRateFormatted: string | null;
  };
}

type TabType = 'stake' | 'unstake';
type TxStatus = 'idle' | 'pending' | 'success' | 'error';

export default function StakePage() {
  const { publicKey, connected, signTransaction } = useWallet();
  const { connection } = useConnection();
  const { setVisible } = useWalletModal();
  const { preferences, resolvedTheme } = usePreferences();
  const refreshInterval = preferences.autoRefreshInterval;

  const bgBase = resolvedTheme === 'light' ? '#f5f5f5' : '#121212';
  const bgRaised = resolvedTheme === 'light' ? '#ffffff' : '#1a1a1a';
  const bgElevated = resolvedTheme === 'light' ? '#f0f0f0' : '#252525';
  const textPrimary = resolvedTheme === 'light' ? '#1a1a1a' : '#ffffff';
  const textSecondary = resolvedTheme === 'light' ? '#666666' : '#888888';
  const textMuted = resolvedTheme === 'light' ? '#999999' : '#666666';
  const border = resolvedTheme === 'light' ? '#e0e0e0' : '#2a2a2a';
  const borderHover = resolvedTheme === 'light' ? '#d0d0d0' : '#333333';
  const accentColor = preferences.xandeumTheme ? '#14b8a6' : '#f59e0b';

  const [activeTab, setActiveTab] = useState<TabType>('stake');
  const [stakeAmount, setStakeAmount] = useState('');
  const [unstakeAmount, setUnstakeAmount] = useState('');
  const [countdown, setCountdown] = useState(refreshInterval);
  const [poolData, setPoolData] = useState<StakePoolData | null>(null);
  const [loading, setLoading] = useState(true);

  const [solBalance, setSolBalance] = useState<number>(0);
  const [xandsolBalance, setXandsolBalance] = useState<number>(0);
  const [balanceLoading, setBalanceLoading] = useState(false);

  const [txStatus, setTxStatus] = useState<TxStatus>('idle');
  const [txMessage, setTxMessage] = useState('');
  const [txSignature, setTxSignature] = useState('');

  const fetchPoolData = async () => {
    try {
      const res = await fetch('/api/stake-pool');
      const data = await res.json();
      setPoolData(data);
    } catch (err) {
      console.error('Failed to fetch stake pool data:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchBalances = useCallback(async () => {
    if (!publicKey || !connection) return;
    setBalanceLoading(true);
    try {
      const [sol, xandsol] = await Promise.all([
        getSolBalance(connection, publicKey),
        getXandsolBalance(connection, publicKey),
      ]);
      setSolBalance(sol);
      setXandsolBalance(xandsol);
    } catch (err) {
      console.error('Failed to fetch balances:', err);
    } finally {
      setBalanceLoading(false);
    }
  }, [publicKey, connection]);

  useEffect(() => {
    fetchPoolData();
    const interval = setInterval(fetchPoolData, refreshInterval * 1000);
    return () => clearInterval(interval);
  }, [refreshInterval]);

  useEffect(() => {
    if (connected && publicKey) {
      fetchBalances();
    }
  }, [connected, publicKey, fetchBalances]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          fetchPoolData();
          if (connected) fetchBalances();
          return refreshInterval;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [connected, fetchBalances, refreshInterval]);

  const handleStake = async () => {
    if (!publicKey || !signTransaction || !stakeAmount) return;

    const amount = parseFloat(stakeAmount);
    if (isNaN(amount) || amount <= 0 || amount > solBalance) {
      setTxStatus('error');
      setTxMessage('Invalid amount');
      return;
    }

    setTxStatus('pending');
    setTxMessage('Staking SOL...');

    const result = await depositSol(connection, publicKey, amount, signTransaction);

    if (result.success) {
      setTxStatus('success');
      setTxMessage('Successfully staked SOL!');
      setTxSignature(result.signature || '');
      setStakeAmount('');
      fetchBalances();
    } else {
      setTxStatus('error');
      setTxMessage(result.error || 'Transaction failed');
    }

    setTimeout(() => setTxStatus('idle'), 5000);
  };

  const handleUnstake = async () => {
    if (!publicKey || !signTransaction || !unstakeAmount) return;

    const amount = parseFloat(unstakeAmount);
    if (isNaN(amount) || amount <= 0 || amount > xandsolBalance) {
      setTxStatus('error');
      setTxMessage('Invalid amount');
      return;
    }

    setTxStatus('pending');
    setTxMessage('Unstaking xandSOL...');

    const result = await withdrawSol(connection, publicKey, amount, signTransaction);

    if (result.success) {
      setTxStatus('success');
      setTxMessage('Successfully unstaked!');
      setTxSignature(result.signature || '');
      setUnstakeAmount('');
      fetchBalances();
    } else {
      setTxStatus('error');
      setTxMessage(result.error || 'Transaction failed');
    }

    setTimeout(() => setTxStatus('idle'), 5000);
  };

  const formatChange = (change: number | null | undefined) => {
    if (change === null || change === undefined) return null;
    const sign = change >= 0 ? '+' : '';
    return `${sign}${change.toFixed(2)}%`;
  };

  const xandsolChange = poolData?.prices?.xandsolPriceChange24h;
  const solChange = poolData?.prices?.solPriceChange24h;

  const stats = [
    {
      label: 'Staking APY',
      value: poolData?.stats?.apyFormatted || '16%',
      change: null,
      changePositive: false,
      color: '#22c55e',
      icon: Percent
    },
    {
      label: 'xandSOL Price',
      value: poolData?.prices?.xandsolFormatted || '–',
      change: formatChange(xandsolChange),
      changePositive: xandsolChange !== null && xandsolChange !== undefined && xandsolChange >= 0,
      color: '#f59e0b',
      icon: DollarSign
    },
    {
      label: 'SOL Price',
      value: poolData?.prices?.solFormatted || '–',
      change: formatChange(solChange),
      changePositive: solChange !== null && solChange !== undefined && solChange >= 0,
      color: '#3b82f6',
      icon: DollarSign
    },
    {
      label: 'Total Value Locked',
      value: poolData?.stats?.tvlUsdFormatted || poolData?.stats?.tvlSolFormatted || '–',
      change: null,
      changePositive: false,
      color: '#8b5cf6',
      icon: Lock
    },
  ];

  const exchangeRate = poolData?.prices?.exchangeRate || 1.09;
  const xandsolPerSol = (1 / exchangeRate).toFixed(4);

  return (
    <div style={{ minHeight: '100vh', background: bgBase }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 24px', borderBottom: `1px solid ${border}`, background: bgRaised }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Coins size={18} color={accentColor} />
          <span style={{ color: textPrimary, fontSize: 15, fontWeight: 600 }}>Stake SOL</span>
          <span style={{ padding: '2px 8px', borderRadius: 4, background: 'rgba(34, 197, 94, 0.1)', color: '#22c55e', fontSize: 11, fontWeight: 600 }}>
            {poolData?.stats?.apyFormatted || '16%'} APY
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ color: textMuted, fontSize: 11 }}>Refresh in {countdown}s</span>
          <button
            onClick={() => { fetchPoolData(); if (connected) fetchBalances(); setCountdown(30); }}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', background: bgElevated, border: `1px solid ${borderHover}`, borderRadius: 6, cursor: 'pointer', color: textSecondary, fontSize: 12 }}
          >
            <RefreshCw size={12} />
            Refresh
          </button>
        </div>
      </div>

      <div style={{ padding: 24 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} style={{ padding: '20px 16px', borderRadius: 8, background: bgRaised, border: `1px solid ${border}` }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <span style={{ color: textSecondary, fontSize: 12, fontWeight: 600 }}>{stat.label}</span>
                  <div style={{ width: 32, height: 32, borderRadius: 6, background: `${stat.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon size={16} color={stat.color} />
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
                  <span style={{ fontSize: 36, fontWeight: 800, color: textPrimary, lineHeight: 1 }}>
                    {loading ? <Loader2 size={24} className="animate-spin" color={textMuted} /> : stat.value}
                  </span>
                  {stat.change && !loading && (
                    <span style={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: stat.changePositive ? '#22c55e' : '#ef4444',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 3
                    }}>
                      {stat.changePositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                      {stat.change}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
          <div style={{ padding: 24, borderRadius: 8, background: bgRaised, border: `1px solid ${border}` }}>
            <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
              <button
                onClick={() => setActiveTab('stake')}
                style={{
                  flex: 1,
                  padding: '12px 0',
                  borderRadius: 8,
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: 'pointer',
                  background: activeTab === 'stake' ? accentColor : bgElevated,
                  color: activeTab === 'stake' ? '#000' : textSecondary,
                  border: activeTab === 'stake' ? 'none' : `1px solid ${borderHover}`,
                }}
              >
                Stake SOL
              </button>
              <button
                onClick={() => setActiveTab('unstake')}
                style={{
                  flex: 1,
                  padding: '12px 0',
                  borderRadius: 8,
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: 'pointer',
                  background: activeTab === 'unstake' ? accentColor : bgElevated,
                  color: activeTab === 'unstake' ? '#000' : textSecondary,
                  border: activeTab === 'unstake' ? 'none' : `1px solid ${borderHover}`,
                }}
              >
                Unstake
              </button>
            </div>

            {!connected ? (
              <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                <div style={{ width: 64, height: 64, borderRadius: 16, background: `${accentColor}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                  <Wallet size={28} color={accentColor} />
                </div>
                <h3 style={{ color: textPrimary, fontSize: 18, fontWeight: 600, marginBottom: 8 }}>Connect Your Wallet</h3>
                <p style={{ color: textSecondary, fontSize: 13, marginBottom: 24 }}>Connect your wallet to stake SOL and earn rewards</p>
                <button
                  onClick={() => setVisible(true)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '14px 28px',
                    borderRadius: 8,
                    background: accentColor,
                    border: 'none',
                    color: '#000',
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  <Wallet size={16} />
                  Connect Wallet
                </button>
              </div>
            ) : (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24 }}>
                  <div style={{ padding: 16, borderRadius: 8, background: bgElevated }}>
                    <div style={{ color: textSecondary, fontSize: 11, marginBottom: 6 }}>Your SOL Balance</div>
                    <div style={{ color: textPrimary, fontSize: 20, fontWeight: 800, fontFamily: 'monospace' }}>
                      {balanceLoading ? '...' : solBalance.toFixed(4)}
                    </div>
                  </div>
                  <div style={{ padding: 16, borderRadius: 8, background: bgElevated }}>
                    <div style={{ color: textSecondary, fontSize: 11, marginBottom: 6 }}>Your xandSOL Balance</div>
                    <div style={{ color: accentColor, fontSize: 20, fontWeight: 800, fontFamily: 'monospace' }}>
                      {balanceLoading ? '...' : xandsolBalance.toFixed(4)}
                    </div>
                  </div>
                </div>

                {activeTab === 'stake' ? (
                  <>
                    <div style={{ marginBottom: 20 }}>
                      <label style={{ display: 'block', color: textSecondary, fontSize: 12, marginBottom: 8 }}>Amount to Stake</label>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <div style={{ flex: 1, position: 'relative' }}>
                          <input
                            type="number"
                            value={stakeAmount}
                            onChange={(e) => setStakeAmount(e.target.value)}
                            placeholder="0.0"
                            style={{
                              width: '100%',
                              height: 48,
                              padding: '0 80px 0 16px',
                              borderRadius: 8,
                              background: bgElevated,
                              border: `1px solid ${borderHover}`,
                              color: textPrimary,
                              fontSize: 16,
                              fontFamily: 'monospace',
                              outline: 'none',
                            }}
                          />
                          <button
                            onClick={() => setStakeAmount(Math.max(0, solBalance - 0.01).toFixed(4))}
                            style={{
                              position: 'absolute',
                              right: 8,
                              top: '50%',
                              transform: 'translateY(-50%)',
                              padding: '4px 8px',
                              borderRadius: 4,
                              background: `${accentColor}33`,
                              border: 'none',
                              color: accentColor,
                              fontSize: 11,
                              fontWeight: 600,
                              cursor: 'pointer',
                            }}
                          >
                            MAX
                          </button>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 16px', borderRadius: 8, background: bgElevated, border: `1px solid ${borderHover}` }}>
                          <img src="/sol-logo.png" alt="SOL" width={20} height={20} style={{ borderRadius: '50%' }} />
                          <span style={{ color: textPrimary, fontSize: 13 }}>SOL</span>
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
                      <ArrowDownUp size={20} color={textMuted} />
                    </div>

                    <div style={{ marginBottom: 24 }}>
                      <label style={{ display: 'block', color: textSecondary, fontSize: 12, marginBottom: 8 }}>You Will Receive</label>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <div style={{ flex: 1, height: 48, padding: '0 16px', borderRadius: 8, background: bgElevated, border: `1px solid ${borderHover}`, display: 'flex', alignItems: 'center' }}>
                          <span style={{ color: textPrimary, fontSize: 16, fontFamily: 'monospace' }}>
                            {stakeAmount ? (parseFloat(stakeAmount) / exchangeRate).toFixed(4) : '0.0'}
                          </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 16px', borderRadius: 8, background: bgElevated, border: `1px solid ${borderHover}` }}>
                          <img src="/xandeum-logo.png" alt="xandSOL" width={20} height={20} style={{ borderRadius: '50%' }} />
                          <span style={{ color: textPrimary, fontSize: 13 }}>xandSOL</span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={handleStake}
                      disabled={txStatus === 'pending' || !stakeAmount || parseFloat(stakeAmount) <= 0}
                      style={{
                        width: '100%',
                        padding: '16px 0',
                        borderRadius: 8,
                        background: txStatus === 'pending' ? borderHover : accentColor,
                        border: 'none',
                        color: txStatus === 'pending' ? textSecondary : '#000',
                        fontSize: 15,
                        fontWeight: 600,
                        cursor: txStatus === 'pending' ? 'wait' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 8,
                      }}
                    >
                      {txStatus === 'pending' ? (
                        <>
                          <Loader2 size={18} className="animate-spin" />
                          Staking...
                        </>
                      ) : (
                        'Stake SOL'
                      )}
                    </button>
                  </>
                ) : (
                  <>
                    <div style={{ marginBottom: 20 }}>
                      <label style={{ display: 'block', color: textSecondary, fontSize: 12, marginBottom: 8 }}>Amount to Unstake</label>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <div style={{ flex: 1, position: 'relative' }}>
                          <input
                            type="number"
                            value={unstakeAmount}
                            onChange={(e) => setUnstakeAmount(e.target.value)}
                            placeholder="0.0"
                            style={{
                              width: '100%',
                              height: 48,
                              padding: '0 80px 0 16px',
                              borderRadius: 8,
                              background: bgElevated,
                              border: `1px solid ${borderHover}`,
                              color: textPrimary,
                              fontSize: 16,
                              fontFamily: 'monospace',
                              outline: 'none',
                            }}
                          />
                          <button
                            onClick={() => setUnstakeAmount(xandsolBalance.toFixed(4))}
                            style={{
                              position: 'absolute',
                              right: 8,
                              top: '50%',
                              transform: 'translateY(-50%)',
                              padding: '4px 8px',
                              borderRadius: 4,
                              background: `${accentColor}33`,
                              border: 'none',
                              color: accentColor,
                              fontSize: 11,
                              fontWeight: 600,
                              cursor: 'pointer',
                            }}
                          >
                            MAX
                          </button>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 16px', borderRadius: 8, background: bgElevated, border: `1px solid ${borderHover}` }}>
                          <img src="/xandeum-logo.png" alt="xandSOL" width={20} height={20} style={{ borderRadius: '50%' }} />
                          <span style={{ color: textPrimary, fontSize: 13 }}>xandSOL</span>
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
                      <ArrowDownUp size={20} color={textMuted} />
                    </div>

                    <div style={{ marginBottom: 24 }}>
                      <label style={{ display: 'block', color: textSecondary, fontSize: 12, marginBottom: 8 }}>You Will Receive</label>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <div style={{ flex: 1, height: 48, padding: '0 16px', borderRadius: 8, background: bgElevated, border: `1px solid ${borderHover}`, display: 'flex', alignItems: 'center' }}>
                          <span style={{ color: textPrimary, fontSize: 16, fontFamily: 'monospace' }}>
                            {unstakeAmount ? (parseFloat(unstakeAmount) * exchangeRate).toFixed(4) : '0.0'}
                          </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 16px', borderRadius: 8, background: bgElevated, border: `1px solid ${borderHover}` }}>
                          <img src="/sol-logo.png" alt="SOL" width={20} height={20} style={{ borderRadius: '50%' }} />
                          <span style={{ color: textPrimary, fontSize: 13 }}>SOL</span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={handleUnstake}
                      disabled={txStatus === 'pending' || !unstakeAmount || parseFloat(unstakeAmount) <= 0}
                      style={{
                        width: '100%',
                        padding: '16px 0',
                        borderRadius: 8,
                        background: txStatus === 'pending' ? borderHover : accentColor,
                        border: 'none',
                        color: txStatus === 'pending' ? textSecondary : '#000',
                        fontSize: 15,
                        fontWeight: 600,
                        cursor: txStatus === 'pending' ? 'wait' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 8,
                      }}
                    >
                      {txStatus === 'pending' ? (
                        <>
                          <Loader2 size={18} className="animate-spin" />
                          Unstaking...
                        </>
                      ) : (
                        'Unstake xandSOL'
                      )}
                    </button>
                  </>
                )}

                {txStatus !== 'idle' && (
                  <div style={{
                    marginTop: 16,
                    padding: 12,
                    borderRadius: 8,
                    background: txStatus === 'success' ? 'rgba(34, 197, 94, 0.1)' : txStatus === 'error' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                    border: `1px solid ${txStatus === 'success' ? 'rgba(34, 197, 94, 0.3)' : txStatus === 'error' ? 'rgba(239, 68, 68, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                  }}>
                    {txStatus === 'pending' && <Loader2 size={16} className="animate-spin" color="#f59e0b" />}
                    {txStatus === 'success' && <CheckCircle size={16} color="#22c55e" />}
                    {txStatus === 'error' && <AlertCircle size={16} color="#ef4444" />}
                    <span style={{ color: txStatus === 'success' ? '#22c55e' : txStatus === 'error' ? '#ef4444' : '#f59e0b', fontSize: 13 }}>
                      {txMessage}
                    </span>
                    {txSignature && (
                      <a
                        href={`https://solscan.io/tx/${txSignature}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ marginLeft: 'auto', color: '#888', fontSize: 11 }}
                      >
                        <ExternalLink size={12} />
                      </a>
                    )}
                  </div>
                )}
              </>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ padding: 20, borderRadius: 8, background: bgRaised, border: `1px solid ${border}` }}>
              <span style={{ color: textMuted, fontSize: 10, fontWeight: 600, letterSpacing: '0.5px' }}>EXCHANGE RATE</span>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 8 }}>
                <span style={{ fontSize: 28, fontWeight: 800, color: textPrimary, fontFamily: 'monospace' }}>1 SOL</span>
                <span style={{ color: textMuted, fontSize: 14 }}>=</span>
                <span style={{ fontSize: 28, fontWeight: 800, color: accentColor, fontFamily: 'monospace' }}>
                  {loading ? '–' : xandsolPerSol} xandSOL
                </span>
              </div>
              <p style={{ color: textMuted, fontSize: 11, marginTop: 8 }}>
                xandSOL accrues value over time as staking rewards compound
              </p>
            </div>

            <div style={{ padding: 20, borderRadius: 8, background: bgRaised, border: `1px solid ${border}`, flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <img src="/xandeum-logo.png" alt="xandSOL" width={48} height={48} style={{ borderRadius: 12 }} />
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ color: textPrimary, fontSize: 15, fontWeight: 600 }}>xandSOL</span>
                    <span style={{ padding: '2px 8px', borderRadius: 4, background: bgElevated, color: textMuted, fontSize: 11 }}>LST</span>
                  </div>
                  <code style={{ color: textMuted, fontSize: 11, fontFamily: 'monospace' }}>XAnDeUmM...XKn2reFN</code>
                </div>
              </div>

              <div style={{ marginBottom: 16 }}>
                <h4 style={{ color: textPrimary, fontSize: 12, fontWeight: 600, marginBottom: 10 }}>Benefits</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {[
                    'Multi-validator: Stake spread across top validators',
                    'Quadruple rewards: Block + Stake + MEV + XAND',
                    'No lock-up period - instant unstaking',
                    'Auto-compounding rewards',
                  ].map((benefit, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, color: textSecondary, fontSize: 11 }}>
                      <span style={{ width: 4, height: 4, borderRadius: '50%', background: '#22c55e', flexShrink: 0 }} />
                      {benefit}
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {[
                  { label: 'Solscan', href: `https://solscan.io/token/${XANDSOL_MINT}` },
                  { label: 'Docs', href: 'https://docs.xandeum.com' },
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

            <div style={{ padding: 20, borderRadius: 8, background: bgRaised, border: `1px solid ${border}` }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Users size={16} color="#3b82f6" />
                  <span style={{ color: textPrimary, fontSize: 14, fontWeight: 600 }}>Stake Pool</span>
                </div>
                <span style={{ padding: '2px 8px', borderRadius: 4, background: 'rgba(34, 197, 94, 0.1)', color: '#22c55e', fontSize: 11, fontWeight: 600 }}>
                  Active
                </span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <div style={{ color: textMuted, fontSize: 10, marginBottom: 4 }}>Pool Address</div>
                  <code style={{ color: textSecondary, fontSize: 10, fontFamily: 'monospace' }}>
                    {XANDSOL_STAKE_POOL.address.slice(0, 8)}...{XANDSOL_STAKE_POOL.address.slice(-4)}
                  </code>
                </div>
                <div>
                  <div style={{ color: textMuted, fontSize: 10, marginBottom: 4 }}>xandSOL Supply</div>
                  <span style={{ color: textPrimary, fontSize: 13, fontWeight: 600 }}>
                    {loading ? '–' : poolData?.stats?.xandsolSupplyFormatted || '–'}
                  </span>
                </div>
              </div>
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
