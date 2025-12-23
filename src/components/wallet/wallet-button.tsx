'use client';

import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { Wallet, LogOut, Copy, Check } from 'lucide-react';
import { useState, useCallback } from 'react';
import { usePreferences } from '@/contexts/preferences-context';

export function WalletButton() {
  const { publicKey, disconnect, connected, connecting } = useWallet();
  const { setVisible } = useWalletModal();
  const { resolvedTheme } = usePreferences();
  const [copied, setCopied] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const bgRaised = resolvedTheme === 'light' ? '#ffffff' : '#1a1a1a';
  const bgElevated = resolvedTheme === 'light' ? '#f0f0f0' : '#252525';
  const bgHover = resolvedTheme === 'light' ? '#e8e8e8' : '#252525';
  const textSecondary = resolvedTheme === 'light' ? '#666666' : '#888888';
  const border = resolvedTheme === 'light' ? '#e0e0e0' : '#2a2a2a';
  const borderHover = resolvedTheme === 'light' ? '#d0d0d0' : '#333333';

  const handleConnect = useCallback(() => {
    setVisible(true);
  }, [setVisible]);

  const handleCopy = useCallback(() => {
    if (publicKey) {
      navigator.clipboard.writeText(publicKey.toBase58());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [publicKey]);

  const handleDisconnect = useCallback(() => {
    disconnect();
    setShowMenu(false);
  }, [disconnect]);

  const truncateAddress = (address: string) => {
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  if (connecting) {
    return (
      <button
        disabled
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '8px 16px',
          borderRadius: 8,
          background: bgElevated,
          border: `1px solid ${border}`,
          color: textSecondary,
          fontSize: 13,
          fontWeight: 500,
          cursor: 'wait',
        }}
      >
        <div style={{
          width: 14,
          height: 14,
          border: `2px solid ${border}`,
          borderTopColor: '#f59e0b',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
        }} />
        Connecting...
      </button>
    );
  }

  if (connected && publicKey) {
    return (
      <div style={{ position: 'relative' }}>
        <button
          onClick={() => setShowMenu(!showMenu)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '8px 16px',
            borderRadius: 8,
            background: 'rgba(245, 158, 11, 0.1)',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            color: '#f59e0b',
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
            fontFamily: 'monospace',
          }}
        >
          <div style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: '#22c55e',
          }} />
          {truncateAddress(publicKey.toBase58())}
        </button>

        {showMenu && (
          <div
            style={{
              position: 'absolute',
              top: '100%',
              right: 0,
              marginTop: 8,
              padding: 8,
              borderRadius: 8,
              background: bgRaised,
              border: `1px solid ${border}`,
              minWidth: 180,
              zIndex: 100,
              boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
            }}
          >
            <button
              onClick={handleCopy}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                width: '100%',
                padding: '10px 12px',
                borderRadius: 6,
                background: 'transparent',
                border: 'none',
                color: textSecondary,
                fontSize: 13,
                cursor: 'pointer',
                textAlign: 'left',
              }}
              onMouseOver={(e) => (e.currentTarget.style.background = bgHover)}
              onMouseOut={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              {copied ? <Check size={14} color="#22c55e" /> : <Copy size={14} />}
              {copied ? 'Copied!' : 'Copy Address'}
            </button>
            <button
              onClick={handleDisconnect}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                width: '100%',
                padding: '10px 12px',
                borderRadius: 6,
                background: 'transparent',
                border: 'none',
                color: '#ef4444',
                fontSize: 13,
                cursor: 'pointer',
                textAlign: 'left',
              }}
              onMouseOver={(e) => (e.currentTarget.style.background = bgHover)}
              onMouseOut={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              <LogOut size={14} />
              Disconnect
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <button
      onClick={handleConnect}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '8px 16px',
        borderRadius: 8,
        background: '#f59e0b',
        border: 'none',
        color: '#000',
        fontSize: 13,
        fontWeight: 600,
        cursor: 'pointer',
      }}
    >
      <Wallet size={14} />
      Connect Wallet
    </button>
  );
}
