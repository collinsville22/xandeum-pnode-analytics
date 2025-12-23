import type { Metadata } from 'next';
import './globals.css';
import { Providers } from '@/components/providers';

export const metadata: Metadata = {
  title: 'XANDEUM // pNode Analytics',
  description: 'Real-time analytics dashboard for Xandeum pNode network',
  keywords: ['Xandeum', 'pNode', 'Solana', 'Storage', 'Analytics', 'Dashboard'],
  authors: [{ name: 'Xandeum Labs' }],
  openGraph: {
    title: 'XANDEUM // pNode Analytics',
    description: 'Real-time analytics dashboard for Xandeum pNode network',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased" style={{ background: 'var(--bg-base)' }}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
