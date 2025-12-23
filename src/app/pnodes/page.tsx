import { Header } from '@/components/layout/header';
import { PNodeTable } from '@/components/dashboard/pnode-table';

export default function PNodesPage() {
  return (
    <div style={{ background: 'var(--bg-base)', minHeight: '100vh' }}>
      <Header />

      <main className="mx-auto max-w-[1400px] px-6 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
            pNode Explorer
          </h1>
          <p className="mt-2 text-[14px]" style={{ color: 'var(--text-secondary)' }}>
            Browse and search all registered pNodes on the Xandeum network
          </p>
        </div>

        <PNodeTable />
      </main>
    </div>
  );
}
