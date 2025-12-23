'use client';

import { Sidebar } from '@/components/layout/sidebar';
import { Xandbot } from '@/components/ai/xandbot';
import { AIProvider, useAI } from '@/context/ai-context';
import { WalletContextProvider } from '@/context/wallet-context';
import { PreferencesProvider, usePreferences } from '@/contexts/preferences-context';
import { Bot } from 'lucide-react';

function DashboardContent({ children }: { children: React.ReactNode }) {
  const { isAiOpen, toggleAi, closeAi } = useAI();
  const { resolvedTheme, preferences } = usePreferences();

  const accentColor = preferences.xandeumTheme ? '#14b8a6' : '#f59e0b';
  const bgBase = resolvedTheme === 'light' ? '#f5f5f5' : '#121212';

  return (
    <div style={{ minHeight: '100vh', background: bgBase }}>
      <Sidebar />
      <main style={{
        marginLeft: 220,
        marginRight: isAiOpen ? 380 : 0,
        minHeight: '100vh',
        transition: 'margin 0.2s ease',
      }}>
        {children}
      </main>

      <button
        onClick={toggleAi}
        style={{
          position: 'fixed',
          right: isAiOpen ? 396 : 16,
          bottom: 20,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '12px 18px',
          borderRadius: 12,
          background: isAiOpen ? '#252525' : `linear-gradient(135deg, ${accentColor}, ${preferences.xandeumTheme ? '#0d9488' : '#d97706'})`,
          border: isAiOpen ? '1px solid #333' : 'none',
          cursor: 'pointer',
          boxShadow: isAiOpen ? 'none' : `0 4px 20px ${accentColor}4d`,
          transition: 'all 0.2s ease',
          zIndex: 45,
        }}
      >
        <Bot size={18} color={isAiOpen ? '#888' : '#000'} />
        <span style={{ color: isAiOpen ? '#888' : '#000', fontSize: 14, fontWeight: 600 }}>
          {isAiOpen ? 'Close AI' : 'Ask AI'}
        </span>
      </button>

      <Xandbot isOpen={isAiOpen} onClose={closeAi} />
    </div>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <WalletContextProvider>
      <PreferencesProvider>
        <AIProvider>
          <DashboardContent>{children}</DashboardContent>
        </AIProvider>
      </PreferencesProvider>
    </WalletContextProvider>
  );
}
