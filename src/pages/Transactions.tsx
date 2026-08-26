import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, SlidersHorizontal, Plus } from 'lucide-react';
import { AppShell } from '../components/layout/AppShell';
import { Card, Select, EmptyState, Badge, Button } from '../components/ui';
import { TransactionEditor } from '../components/transactions/TransactionEditor';
import { AddTransactionModal } from '../components/transactions/AddTransactionModal';
import { useApp } from '../store/AppStore';
import { useCycleData } from '../hooks/useCycleData';
import { isInCycle, formatDate } from '../utils/cycle';
import { formatCurrency } from '../utils/currency';
import type { Transaction, MappedBy } from '../types/budget';

const mappedByLabel: Record<Exclude<MappedBy, null>, string> = {
  commitment: 'Commitment',
  rule: 'Rule',
  manual: 'Manual',
};

export function Transactions() {
  const { pools, accounts, activeCycle } = useApp();
  const { visibleTransactions } = useCycleData();
  const [params] = useSearchParams();
  const [q, setQ] = useState('');
  const [poolFilter, setPoolFilter] = useState('all');
  const [accountFilter, setAccountFilter] = useState('all');
  const [mapFilter, setMapFilter] = useState(params.get('filter') === 'unmapped' ? 'unmapped' : 'all');
  const [dirFilter, setDirFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [addOpen, setAddOpen] = useState(false);

  const poolName = (id: string | null) => pools.find((p) => p.id === id)?.name ?? null;
  const accountName = (id: string) => accounts.find((a) => a.id === id)?.label ?? 'Unknown account';

  const filtered = useMemo(() => {
    return visibleTransactions
      .filter((t) => isInCycle(t.date, activeCycle))
      .filter((t) => (poolFilter === 'all' ? true : poolFilter === 'none' ? t.pool_id === null : t.pool_id === poolFilter))
      .filter((t) => accountFilter === 'all' || t.account_id === accountFilter)
      .filter((t) => (mapFilter === 'all' ? true : mapFilter === 'unmapped' ? t.pool_id === null : t.pool_id !== null))
      .filter((t) => dirFilter === 'all' || t.direction === dirFilter)
      .filter((t) =>
        q.trim() === ''
          ? true
          : (t.merchant + ' ' + t.description).toLowerCase().includes(q.toLowerCase()),
      )
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [visibleTransactions, activeCycle, poolFilter, accountFilter, mapFilter, dirFilter, q]);

  return (
    <AppShell title="Transactions" subtitle={activeCycle.label}>
      {/* Search + filter toggle + add */}
      <div className="mb-4 flex gap-2 animate-slide-up">
        <div className="relative flex-1">
          <Search size={17} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-plum-soft" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search merchant or description"
            className="w-full rounded-2xl border border-blush bg-white/70 py-3 pl-11 pr-4 text-plum-ink placeholder:text-plum-soft/50 focus:border-rose focus:outline-none focus:ring-2 focus:ring-rose/30"
          />
        </div>
        <button
          onClick={() => setShowFilters((s) => !s)}
          className={`grid h-[52px] w-[52px] shrink-0 place-items-center rounded-2xl border transition ${showFilters ? 'border-plum bg-plum text-cream' : 'border-blush bg-white/70 text-plum'}`}
          aria-label="Toggle filters"
        >
          <SlidersHorizontal size={18} />
        </button>
        <Button variant="primary" onClick={() => setAddOpen(true)} className="!h-[52px] shrink-0">
          <Plus size={18} />
          <span className="hidden sm:inline">Add</span>
        </Button>
      </div>

      {showFilters && (
        <Card className="mb-4 grid grid-cols-2 gap-3 p-4 animate-slide-up sm:grid-cols-4">
          <Select label="Pool" value={poolFilter} onChange={(e) => setPoolFilter(e.target.value)}>
            <option value="all">All pools</option>
            <option value="none">Unmapped</option>
            {pools.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </Select>
          <Select label="Account" value={accountFilter} onChange={(e) => setAccountFilter(e.target.value)}>
            <option value="all">All accounts</option>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.label}
              </option>
            ))}
          </Select>
          <Select label="Mapping" value={mapFilter} onChange={(e) => setMapFilter(e.target.value)}>
            <option value="all">All</option>
            <option value="mapped">Mapped</option>
            <option value="unmapped">Unmapped</option>
          </Select>
          <Select label="Direction" value={dirFilter} onChange={(e) => setDirFilter(e.target.value)}>
            <option value="all">All</option>
            <option value="out">Money out</option>
            <option value="in">Money in</option>
          </Select>
        </Card>
      )}

      {filtered.length === 0 ? (
        <EmptyState
          title="No transactions yet"
          message="No transactions have been imported for this cycle."
          showMascot
        />
      ) : (
        <div className="space-y-2.5">
          {filtered.map((t, i) => {
            const name = poolName(t.pool_id);
            const isIncome = t.direction === 'in';
            return (
              <Card
                key={t.id}
                as="button"
                onClick={() => setEditing(t)}
                className="flex w-full items-center gap-3 p-4 text-left transition hover:shadow-lift animate-slide-up"
                style={{ animationDelay: `${Math.min(i, 12) * 25}ms` }}
              >
                <span className="tnum hidden w-16 shrink-0 text-center text-xs font-medium text-plum-soft sm:block">
                  {formatDate(t.date)}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate font-medium text-plum-ink">{t.merchant}</p>
                    <span className="shrink-0 rounded-full bg-blush-soft px-2 py-0.5 text-[10px] font-semibold text-plum-soft">
                      {accountName(t.account_id)}
                    </span>
                  </div>
                  <p className="truncate text-xs text-plum-soft sm:hidden">{formatDate(t.date)}</p>
                  <p className="mt-0.5 hidden truncate text-xs text-plum-soft sm:block">{t.description}</p>
                  <div className="mt-1.5 flex items-center gap-2">
                    {name ? (
                      <Badge tone="blush">{name}</Badge>
                    ) : (
                      <Badge tone="coral">! Unmapped</Badge>
                    )}
                    {t.mapped_by && (
                      <span className="text-[11px] text-plum-soft/80">via {mappedByLabel[t.mapped_by]}</span>
                    )}
                  </div>
                </div>
                <span className={`tnum shrink-0 text-sm font-semibold ${isIncome ? 'text-sage-deep' : 'text-plum-ink'}`}>
                  {formatCurrency(t.amount)}
                </span>
              </Card>
            );
          })}
        </div>
      )}

      <TransactionEditor tx={editing} onClose={() => setEditing(null)} />
      <AddTransactionModal open={addOpen} onClose={() => setAddOpen(false)} />
    </AppShell>
  );
}
