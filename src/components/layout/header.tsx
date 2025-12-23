'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function Header() {
  const pathname = usePathname();
  const isHome = pathname === '/';
  const isExplorer = pathname === '/pnodes' || pathname.startsWith('/pnode/');

  return (
    <header
      className="sticky top-0 z-50"
      style={{
        background: 'var(--bg-raised)',
        borderBottom: '1px solid var(--border)',
      }}
    >
      <div className="mx-auto flex h-14 max-w-[1400px] items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm"
            style={{ background: 'var(--accent)', color: 'var(--bg-base)' }}
          >
            X
          </div>
          <div className="flex flex-col">
            <span
              className="text-[15px] font-semibold"
              style={{ color: 'var(--text-primary)' }}
            >
              Xandeum
            </span>
            <span
              className="text-[10px] font-mono uppercase tracking-wider"
              style={{ color: 'var(--text-muted)' }}
            >
              pNode Analytics
            </span>
          </div>
        </Link>

        <nav className="flex items-center gap-1">
          <Link
            href="/"
            className="px-4 py-2 rounded-lg text-[13px] font-medium transition-colors"
            style={{
              background: isHome ? 'var(--accent-muted)' : 'transparent',
              color: isHome ? 'var(--accent)' : 'var(--text-secondary)',
            }}
          >
            Home
          </Link>
          <Link
            href="/dashboard"
            className="px-4 py-2 rounded-lg text-[13px] font-medium transition-colors"
            style={{
              color: 'var(--text-secondary)',
            }}
          >
            Dashboard
          </Link>
          <Link
            href="/pnodes"
            className="px-4 py-2 rounded-lg text-[13px] font-medium transition-colors"
            style={{
              background: isExplorer ? 'var(--accent-muted)' : 'transparent',
              color: isExplorer ? 'var(--accent)' : 'var(--text-secondary)',
            }}
          >
            Explorer
          </Link>

          <div
            className="w-px h-5 mx-3"
            style={{ background: 'var(--border)' }}
          />

          <a
            href="https://github.com/Xandeum"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-[13px] transition-colors"
            style={{ color: 'var(--text-secondary)' }}
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
            </svg>
            GitHub
          </a>
        </nav>
      </div>
    </header>
  );
}
