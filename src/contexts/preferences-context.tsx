'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface WatchedNode {
  ip: string;
  name?: string;
  addedAt: number;
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  xandeumTheme: boolean;
  customRpcEndpoint: string;
  autoRefreshInterval: number;
  watchlist: WatchedNode[];
}

interface PreferencesContextType {
  preferences: UserPreferences;
  updatePreference: <K extends keyof UserPreferences>(key: K, value: UserPreferences[K]) => void;
  savePreferences: () => void;
  addToWatchlist: (ip: string, name?: string) => void;
  removeFromWatchlist: (ip: string) => void;
  isInWatchlist: (ip: string) => boolean;
  resolvedTheme: 'light' | 'dark';
}

const DEFAULT_PREFERENCES: UserPreferences = {
  theme: 'dark',
  xandeumTheme: false,
  customRpcEndpoint: '',
  autoRefreshInterval: 30,
  watchlist: [],
};

const PreferencesContext = createContext<PreferencesContextType | undefined>(undefined);

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [preferences, setPreferences] = useState<UserPreferences>(DEFAULT_PREFERENCES);
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('dark');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem('xandeum-preferences');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setPreferences({ ...DEFAULT_PREFERENCES, ...parsed });
      } catch (e) {
        console.error('Failed to parse preferences:', e);
      }
    }
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const updateTheme = () => {
      let theme: 'light' | 'dark' = 'dark';

      if (preferences.theme === 'system') {
        const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        theme = systemDark ? 'dark' : 'light';
      } else {
        theme = preferences.theme;
      }

      setResolvedTheme(theme);

      const root = document.documentElement;

      if (theme === 'light') {
        root.style.setProperty('--bg-base', '#f5f5f5');
        root.style.setProperty('--bg-raised', '#ffffff');
        root.style.setProperty('--bg-surface', '#fafafa');
        root.style.setProperty('--bg-elevated', '#ffffff');
        root.style.setProperty('--bg-hover', '#f0f0f0');
        root.style.setProperty('--text-primary', '#1a1a1a');
        root.style.setProperty('--text-secondary', '#666666');
        root.style.setProperty('--text-muted', '#999999');
        root.style.setProperty('--border', '#e0e0e0');
        root.style.setProperty('--border-hover', '#d0d0d0');
      } else {
        root.style.setProperty('--bg-base', '#121212');
        root.style.setProperty('--bg-raised', '#1a1a1a');
        root.style.setProperty('--bg-surface', '#1f1f1f');
        root.style.setProperty('--bg-elevated', '#252525');
        root.style.setProperty('--bg-hover', '#333333');
        root.style.setProperty('--text-primary', '#ffffff');
        root.style.setProperty('--text-secondary', '#a1a1a1');
        root.style.setProperty('--text-muted', '#666666');
        root.style.setProperty('--border', '#2a2a2a');
        root.style.setProperty('--border-hover', '#3a3a3a');
      }

      if (preferences.xandeumTheme) {
        root.style.setProperty('--accent', '#14b8a6');
        root.style.setProperty('--accent-hover', '#0d9488');
        root.style.setProperty('--accent-secondary', '#1e3a5f');
      } else {
        root.style.setProperty('--accent', '#f59e0b');
        root.style.setProperty('--accent-hover', '#fbbf24');
        root.style.setProperty('--accent-secondary', '#d97706');
      }
    };

    updateTheme();

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', updateTheme);

    return () => mediaQuery.removeEventListener('change', updateTheme);
  }, [preferences.theme, preferences.xandeumTheme, mounted]);

  const updatePreference = <K extends keyof UserPreferences>(
    key: K,
    value: UserPreferences[K]
  ) => {
    setPreferences(prev => {
      const updated = { ...prev, [key]: value };
      localStorage.setItem('xandeum-preferences', JSON.stringify(updated));
      return updated;
    });
  };

  const savePreferences = () => {
    localStorage.setItem('xandeum-preferences', JSON.stringify(preferences));
  };

  const addToWatchlist = (ip: string, name?: string) => {
    setPreferences(prev => {
      if (prev.watchlist.some(node => node.ip === ip)) return prev;
      const updated = {
        ...prev,
        watchlist: [...prev.watchlist, { ip, name, addedAt: Date.now() }],
      };
      localStorage.setItem('xandeum-preferences', JSON.stringify(updated));
      return updated;
    });
  };

  const removeFromWatchlist = (ip: string) => {
    setPreferences(prev => {
      const updated = {
        ...prev,
        watchlist: prev.watchlist.filter(node => node.ip !== ip),
      };
      localStorage.setItem('xandeum-preferences', JSON.stringify(updated));
      return updated;
    });
  };

  const isInWatchlist = (ip: string) => {
    return preferences.watchlist.some(node => node.ip === ip);
  };

  return (
    <PreferencesContext.Provider
      value={{
        preferences,
        updatePreference,
        savePreferences,
        addToWatchlist,
        removeFromWatchlist,
        isInWatchlist,
        resolvedTheme,
      }}
    >
      {children}
    </PreferencesContext.Provider>
  );
}

export function usePreferences() {
  const context = useContext(PreferencesContext);
  if (context === undefined) {
    throw new Error('usePreferences must be used within a PreferencesProvider');
  }
  return context;
}
