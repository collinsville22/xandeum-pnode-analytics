'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { VersionedTransaction } from '@solana/web3.js';
import {
  ArrowDownUp,
  Loader2,
  Wallet,
  AlertCircle,
  CheckCircle,
  ExternalLink,
  RefreshCw,
  ChevronDown,
} from 'lucide-react';
import { XAND_MINT, SOL_MINT } from '@/config/solana';
import { usePreferences } from '@/contexts/preferences-context';

const TOKENS = {
  SOL: {
    symbol: 'SOL',
    name: 'Solana',
    mint: SOL_MINT,
    decimals: 9,
    logo: '/sol-logo.png',
  },
  USDC: {
    symbol: 'USDC',
    name: 'USD Coin',
    mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
    decimals: 6,
    logo: '/usdc-logo.png',
  },
  USDT: {
    symbol: 'USDT',
    name: 'Tether USD',
    mint: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
    decimals: 6,
    logo: '/usdt-logo.png',
  },
  XAND: {
    symbol: 'XAND',
    name: 'Xandeum',
    mint: XAND_MINT,
    decimals: 9,
    logo: '/xandeum-logo.png',
  },
};

type TokenKey = keyof typeof TOKENS;
type SwapMode = 'buy' | 'sell';

interface TokenSelectorProps {
  selectedToken: TokenKey;
  availableTokens: TokenKey[];
  onSelect: (token: TokenKey) => void;
  bgElevated: string;
  bgHover: string;
  textPrimary: string;
  textMuted: string;
  border: string;
}

function TokenSelector({ selectedToken, availableTokens, onSelect, bgElevated, bgHover, textPrimary, textMuted, border }: TokenSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const token = TOKENS[selectedToken];

  return (
    <div ref={dropdownRef} style={{ position: 'relative' }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          background: bgElevated,
          border: 'none',
          borderRadius: 20,
          padding: '8px 12px 8px 8px',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          cursor: 'pointer',
        }}
      >
        <img
          src={token.logo}
          alt={token.symbol}
          width={24}
          height={24}
          style={{ borderRadius: '50%' }}
        />
        <span style={{ color: textPrimary, fontSize: 14, fontWeight: 600 }}>{token.symbol}</span>
        <ChevronDown size={14} color={textMuted} style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
      </button>

      {isOpen && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 4px)',
          right: 0,
          background: bgElevated,
          border: `1px solid ${border}`,
          borderRadius: 12,
          padding: 4,
          zIndex: 100,
          minWidth: 140,
          boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
        }}>
          {availableTokens.map((tokenKey) => {
            const t = TOKENS[tokenKey];
            return (
              <button
                key={tokenKey}
                onClick={() => {
                  onSelect(tokenKey);
                  setIsOpen(false);
                }}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  background: selectedToken === tokenKey ? bgHover : 'transparent',
                  border: 'none',
                  borderRadius: 8,
                  cursor: 'pointer',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = bgHover}
                onMouseLeave={(e) => e.currentTarget.style.background = selectedToken === tokenKey ? bgHover : 'transparent'}
              >
                <img
                  src={t.logo}
                  alt={t.symbol}
                  width={28}
                  height={28}
                  style={{ borderRadius: '50%' }}
                />
                <div style={{ textAlign: 'left' }}>
                  <div style={{ color: textPrimary, fontSize: 14, fontWeight: 600 }}>{t.symbol}</div>
                  <div style={{ color: textMuted, fontSize: 11 }}>{t.name}</div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

interface QuoteResponse {
  inputMint: string;
  outputMint: string;
  inAmount: string;
  outAmount: string;
  priceImpactPct: string;
  routePlan: Array<{
    swapInfo: {
      label: string;
    };
  }>;
  otherAmountThreshold: string;
}

export function SwapWidget() {
  const { publicKey, signTransaction, connected } = useWallet();
  const { connection } = useConnection();
  const { setVisible: setWalletModalVisible } = useWalletModal();
  const { preferences, resolvedTheme } = usePreferences();

  const [mode, setMode] = useState<SwapMode>('buy');
  const [selectedToken, setSelectedToken] = useState<TokenKey>('SOL');
  const [inputAmount, setInputAmount] = useState('');
  const [quote, setQuote] = useState<QuoteResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [txStatus, setTxStatus] = useState<'idle' | 'signing' | 'confirming' | 'success' | 'error'>('idle');
  const [txSignature, setTxSignature] = useState<string | null>(null);
  const [slippage, setSlippage] = useState('0.5');

  const bgRaised = resolvedTheme === 'light' ? '#ffffff' : '#1a1a1a';
  const bgElevated = resolvedTheme === 'light' ? '#f0f0f0' : '#252525';
  const bgHover = resolvedTheme === 'light' ? '#e5e5e5' : '#333333';
  const textPrimary = resolvedTheme === 'light' ? '#1a1a1a' : '#ffffff';
  const textSecondary = resolvedTheme === 'light' ? '#666666' : '#888888';
  const textMuted = resolvedTheme === 'light' ? '#999999' : '#666666';
  const border = resolvedTheme === 'light' ? '#e0e0e0' : '#2a2a2a';
  const borderHover = resolvedTheme === 'light' ? '#d0d0d0' : '#333333';
  const accentColor = preferences.xandeumTheme ? '#14b8a6' : '#f59e0b';

  const inputToken = mode === 'buy' ? TOKENS[selectedToken] : TOKENS.XAND;
  const outputToken = mode === 'buy' ? TOKENS.XAND : TOKENS[selectedToken];

  const fetchQuote = useCallback(async () => {
    if (!inputAmount || parseFloat(inputAmount) <= 0) {
      setQuote(null);
      return;
    }

    setQuoteLoading(true);
    setError(null);

    try {
      const amountInSmallestUnit = Math.floor(
        parseFloat(inputAmount) * Math.pow(10, inputToken.decimals)
      );

      const response = await fetch(
        `/api/swap?inputMint=${inputToken.mint}&outputMint=${outputToken.mint}&amount=${amountInSmallestUnit}&slippageBps=${Math.floor(parseFloat(slippage) * 100)}`
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get quote');
      }

      const quoteData = await response.json();
      setQuote(quoteData);
    } catch (err) {
      console.error('Quote error:', err);
      setError(err instanceof Error ? err.message : 'Failed to get quote');
      setQuote(null);
    } finally {
      setQuoteLoading(false);
    }
  }, [inputAmount, inputToken, outputToken, slippage]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (inputAmount && parseFloat(inputAmount) > 0) {
        fetchQuote();
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [inputAmount, mode, selectedToken, fetchQuote]);

  const executeSwap = async () => {
    if (!publicKey || !signTransaction || !quote) return;

    setLoading(true);
    setError(null);
    setTxStatus('signing');

    try {
      const swapResponse = await fetch('/api/swap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quoteResponse: quote,
          userPublicKey: publicKey.toBase58(),
        }),
      });

      if (!swapResponse.ok) {
        const errorData = await swapResponse.json();
        throw new Error(errorData.error || 'Failed to build swap transaction');
      }

      const { swapTransaction } = await swapResponse.json();

      const swapTransactionBuf = Buffer.from(swapTransaction, 'base64');
      const transaction = VersionedTransaction.deserialize(swapTransactionBuf);

      setTxStatus('signing');
      const signedTransaction = await signTransaction(transaction);

      setTxStatus('confirming');
      const rawTransaction = signedTransaction.serialize();
      const signature = await connection.sendRawTransaction(rawTransaction, {
        skipPreflight: true,
        maxRetries: 2,
      });

      setTxSignature(signature);

      const confirmation = await connection.confirmTransaction(signature, 'confirmed');

      if (confirmation.value.err) {
        throw new Error('Transaction failed');
      }

      setTxStatus('success');
      setInputAmount('');
      setQuote(null);
    } catch (err) {
      console.error('Swap error:', err);
      setError(err instanceof Error ? err.message : 'Swap failed');
      setTxStatus('error');
    } finally {
      setLoading(false);
    }
  };

  const formatOutputAmount = () => {
    if (!quote) return '0';
    const amount = parseInt(quote.outAmount) / Math.pow(10, outputToken.decimals);
    return amount.toLocaleString(undefined, { maximumFractionDigits: 6 });
  };

  const formatPriceImpact = () => {
    if (!quote) return '0%';
    const impact = parseFloat(quote.priceImpactPct);
    return `${impact.toFixed(2)}%`;
  };

  const getRouteInfo = () => {
    if (!quote || !quote.routePlan) return '';
    return quote.routePlan.map(r => r.swapInfo.label).join(' → ');
  };

  const availableTokens: TokenKey[] = ['SOL', 'USDC', 'USDT'];

  return (
    <div style={{ background: bgRaised, borderRadius: 12, border: `1px solid ${border}`, overflow: 'hidden' }}>
      <div style={{ padding: '16px 20px', borderBottom: `1px solid ${border}` }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h3 style={{ color: textPrimary, fontSize: 16, fontWeight: 600, margin: 0 }}>Swap XAND</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ color: textMuted, fontSize: 11 }}>Slippage:</span>
            <select
              value={slippage}
              onChange={(e) => setSlippage(e.target.value)}
              style={{
                background: bgElevated,
                border: `1px solid ${borderHover}`,
                borderRadius: 6,
                padding: '4px 8px',
                color: textPrimary,
                fontSize: 12,
                cursor: 'pointer',
              }}
            >
              <option value="0.1">0.1%</option>
              <option value="0.5">0.5%</option>
              <option value="1">1%</option>
              <option value="2">2%</option>
            </select>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', padding: '12px 20px', gap: 8 }}>
        <button
          onClick={() => { setMode('buy'); setQuote(null); setError(null); }}
          style={{
            flex: 1,
            padding: '12px 0',
            borderRadius: 8,
            fontSize: 14,
            fontWeight: 600,
            cursor: 'pointer',
            background: mode === 'buy' ? '#22c55e' : bgElevated,
            color: mode === 'buy' ? '#000' : textSecondary,
            border: mode === 'buy' ? 'none' : `1px solid ${borderHover}`,
            transition: 'all 0.2s',
          }}
        >
          Buy XAND
        </button>
        <button
          onClick={() => { setMode('sell'); setQuote(null); setError(null); }}
          style={{
            flex: 1,
            padding: '12px 0',
            borderRadius: 8,
            fontSize: 14,
            fontWeight: 600,
            cursor: 'pointer',
            background: mode === 'sell' ? '#ef4444' : bgElevated,
            color: mode === 'sell' ? '#fff' : textSecondary,
            border: mode === 'sell' ? 'none' : `1px solid ${borderHover}`,
            transition: 'all 0.2s',
          }}
        >
          Sell XAND
        </button>
      </div>

      <div style={{ padding: '0 20px 20px' }}>
        <div style={{ background: bgElevated, borderRadius: 12, padding: 16, marginBottom: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ color: textSecondary, fontSize: 12 }}>You {mode === 'buy' ? 'pay' : 'sell'}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <input
              type="number"
              value={inputAmount}
              onChange={(e) => setInputAmount(e.target.value)}
              placeholder="0.00"
              style={{
                flex: 1,
                background: 'transparent',
                border: 'none',
                outline: 'none',
                fontSize: 28,
                fontWeight: 600,
                color: textPrimary,
                width: '100%',
              }}
            />
            {mode === 'buy' ? (
              <TokenSelector
                selectedToken={selectedToken}
                availableTokens={availableTokens}
                onSelect={(token) => { setSelectedToken(token); setQuote(null); }}
                bgElevated={bgHover}
                bgHover={resolvedTheme === 'light' ? '#d5d5d5' : '#3a3a3a'}
                textPrimary={textPrimary}
                textMuted={textMuted}
                border={borderHover}
              />
            ) : (
              <div style={{
                background: bgHover,
                borderRadius: 20,
                padding: '8px 12px',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}>
                <img src={TOKENS.XAND.logo} alt="XAND" width={24} height={24} style={{ borderRadius: '50%' }} />
                <span style={{ color: textPrimary, fontSize: 14, fontWeight: 600 }}>XAND</span>
              </div>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', margin: '-4px 0' }}>
          <div style={{
            width: 36,
            height: 36,
            borderRadius: '50%',
            background: bgRaised,
            border: `4px solid ${bgElevated}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <ArrowDownUp size={16} color={textSecondary} />
          </div>
        </div>

        <div style={{ background: bgElevated, borderRadius: 12, padding: 16, marginTop: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ color: textSecondary, fontSize: 12 }}>You receive</span>
            {quoteLoading && <Loader2 size={14} className="animate-spin" color={textSecondary} />}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ flex: 1, fontSize: 28, fontWeight: 600, color: quote ? textPrimary : textMuted }}>
              {quoteLoading ? '...' : formatOutputAmount()}
            </div>
            {mode === 'sell' ? (
              <TokenSelector
                selectedToken={selectedToken}
                availableTokens={availableTokens}
                onSelect={(token) => { setSelectedToken(token); setQuote(null); }}
                bgElevated={bgHover}
                bgHover={resolvedTheme === 'light' ? '#d5d5d5' : '#3a3a3a'}
                textPrimary={textPrimary}
                textMuted={textMuted}
                border={borderHover}
              />
            ) : (
              <div style={{
                background: bgHover,
                borderRadius: 20,
                padding: '8px 12px',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}>
                <img src={TOKENS.XAND.logo} alt="XAND" width={24} height={24} style={{ borderRadius: '50%' }} />
                <span style={{ color: textPrimary, fontSize: 14, fontWeight: 600 }}>XAND</span>
              </div>
            )}
          </div>
        </div>

        {quote && (
          <div style={{ marginTop: 16, padding: 12, background: bgElevated, borderRadius: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ color: textSecondary, fontSize: 12 }}>Price Impact</span>
              <span style={{
                color: parseFloat(quote.priceImpactPct) > 1 ? '#ef4444' : '#22c55e',
                fontSize: 12,
                fontWeight: 600
              }}>
                {formatPriceImpact()}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: textSecondary, fontSize: 12 }}>Route</span>
              <span style={{ color: accentColor, fontSize: 12 }}>{getRouteInfo()}</span>
            </div>
          </div>
        )}

        {error && (
          <div style={{
            marginTop: 16,
            padding: 12,
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            borderRadius: 8,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}>
            <AlertCircle size={16} color="#ef4444" />
            <span style={{ color: '#ef4444', fontSize: 12 }}>{error}</span>
          </div>
        )}

        {txStatus === 'success' && txSignature && (
          <div style={{
            marginTop: 16,
            padding: 12,
            background: 'rgba(34, 197, 94, 0.1)',
            border: '1px solid rgba(34, 197, 94, 0.2)',
            borderRadius: 8,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <CheckCircle size={16} color="#22c55e" />
              <span style={{ color: '#22c55e', fontSize: 13, fontWeight: 600 }}>Swap Successful!</span>
            </div>
            <a
              href={`https://solscan.io/tx/${txSignature}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#888', fontSize: 12 }}
            >
              View on Solscan <ExternalLink size={12} />
            </a>
          </div>
        )}

        <button
          onClick={connected ? executeSwap : () => setWalletModalVisible(true)}
          disabled={connected && (loading || !quote || !inputAmount)}
          style={{
            width: '100%',
            padding: '16px',
            marginTop: 16,
            borderRadius: 12,
            border: 'none',
            background: !connected
              ? accentColor
              : loading
                ? bgHover
                : mode === 'buy'
                  ? '#22c55e'
                  : '#ef4444',
            color: !connected ? '#000' : mode === 'buy' ? '#000' : '#fff',
            fontSize: 16,
            fontWeight: 600,
            cursor: connected && (loading || !quote || !inputAmount) ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            opacity: connected && (loading || !quote || !inputAmount) ? 0.5 : 1,
          }}
        >
          {!connected ? (
            <>
              <Wallet size={18} />
              Connect Wallet
            </>
          ) : loading ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              {txStatus === 'signing' ? 'Signing...' : 'Confirming...'}
            </>
          ) : !inputAmount ? (
            'Enter Amount'
          ) : !quote ? (
            'Getting Quote...'
          ) : (
            `${mode === 'buy' ? 'Buy' : 'Sell'} XAND`
          )}
        </button>

        {quote && (
          <button
            onClick={fetchQuote}
            disabled={quoteLoading}
            style={{
              width: '100%',
              padding: '10px',
              marginTop: 8,
              borderRadius: 8,
              border: `1px solid ${borderHover}`,
              background: 'transparent',
              color: textSecondary,
              fontSize: 12,
              cursor: quoteLoading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
            }}
          >
            <RefreshCw size={12} className={quoteLoading ? 'animate-spin' : ''} />
            Refresh Quote
          </button>
        )}
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
