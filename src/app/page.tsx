import Link from 'next/link';
import { Header } from '@/components/layout/header';
import { ArrowRight, Server, Globe, Activity, Zap } from 'lucide-react';

export default function Home() {
  return (
    <div style={{ background: 'var(--bg-base)', minHeight: '100vh' }}>
      <Header />

      <main className="mx-auto max-w-[1200px] px-6 py-16">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-6" style={{ background: 'var(--accent-muted)', border: '1px solid var(--accent)' }}>
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: 'var(--success)' }} />
            <span className="text-[12px] font-medium" style={{ color: 'var(--accent)' }}>Network Online</span>
          </div>

          <h1 className="text-4xl md:text-5xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
            pNode Analytics
          </h1>
          <p className="text-[17px] max-w-xl mx-auto mb-8" style={{ color: 'var(--text-secondary)' }}>
            Real-time monitoring and analytics for the Xandeum distributed storage network
          </p>

          <div className="flex items-center justify-center gap-4">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-[14px] font-medium transition-colors"
              style={{ background: 'var(--accent)', color: 'var(--bg-base)' }}
            >
              Open Dashboard
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/pnodes"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-[14px] font-medium transition-colors"
              style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}
            >
              Explore Nodes
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-16">
          {[
            { icon: Server, title: 'Node Monitoring', desc: 'Track all pNodes in real-time' },
            { icon: Globe, title: 'Global Distribution', desc: 'View geographic node spread' },
            { icon: Activity, title: 'Network Health', desc: 'Monitor network performance' },
            { icon: Zap, title: 'Live Updates', desc: '30-second auto refresh' },
          ].map((feature) => (
            <div
              key={feature.title}
              className="p-5 rounded-xl"
              style={{ background: 'var(--bg-raised)', border: '1px solid var(--border)' }}
            >
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center mb-3"
                style={{ background: 'var(--accent-muted)' }}
              >
                <feature.icon className="w-5 h-5" style={{ color: 'var(--accent)' }} />
              </div>
              <h3 className="text-[14px] font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
                {feature.title}
              </h3>
              <p className="text-[13px]" style={{ color: 'var(--text-muted)' }}>
                {feature.desc}
              </p>
            </div>
          ))}
        </div>

        <div
          className="p-6 rounded-xl mb-16"
          style={{ background: 'var(--bg-raised)', border: '1px solid var(--border)' }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[15px] font-semibold" style={{ color: 'var(--text-primary)' }}>
              Network Overview
            </h2>
            <Link
              href="/dashboard"
              className="text-[12px] font-medium transition-colors"
              style={{ color: 'var(--accent)' }}
            >
              View Details →
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Total Nodes', value: '232', color: 'var(--text-primary)' },
              { label: 'Online', value: '202', color: 'var(--success)' },
              { label: 'Public RPC', value: '55', color: 'var(--accent)' },
              { label: 'Countries', value: '15', color: 'var(--text-primary)' },
            ].map((stat) => (
              <div key={stat.label} className="text-center p-4 rounded-lg" style={{ background: 'var(--bg-surface)' }}>
                <p className="text-2xl font-bold font-mono mb-1" style={{ color: stat.color }}>
                  {stat.value}
                </p>
                <p className="text-[11px] uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </main>

      <footer style={{ borderTop: '1px solid var(--border)' }}>
        <div className="mx-auto max-w-[1200px] px-6 py-6 flex items-center justify-between">
          <span className="text-[12px] font-mono" style={{ color: 'var(--text-muted)' }}>
            Xandeum Network // v0.8
          </span>
          <span className="flex items-center gap-2 text-[12px] font-mono" style={{ color: 'var(--text-muted)' }}>
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--success)' }} />
            Devnet Connected
          </span>
        </div>
      </footer>
    </div>
  );
}
