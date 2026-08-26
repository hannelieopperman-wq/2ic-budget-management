import { Card } from '../ui';
import { ProgressRing, StatusPill } from '../ui/ProgressRing';
import { formatCurrency } from '../../utils/currency';
import { poolHealth } from '../../utils/calculations';
import type { Pool } from '../../types/budget';

export interface PoolView {
  pool: Pool;
  spent: number;
  remaining: number;
  pct: number;
}

export function PoolCard({ view, index = 0 }: { view: PoolView; index?: number }) {
  const { pool, spent, remaining, pct } = view;
  const health = poolHealth(pct);
  return (
    <Card className="p-5 animate-slide-up" style={{ animationDelay: `${index * 50}ms` }}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate font-serif text-lg text-plum-ink">{pool.name}</h3>
          <p className="mt-0.5 text-xs text-plum-soft">Budget {formatCurrency(pool.monthly_budget)}</p>
        </div>
        <ProgressRing pct={pct} health={health} size={72} stroke={8} />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-blush-soft/60 px-3 py-2.5">
          <p className="text-[11px] font-medium uppercase tracking-wide text-plum-soft">Spent</p>
          <p className="tnum text-sm font-semibold text-plum-ink">{formatCurrency(spent)}</p>
        </div>
        <div className="rounded-2xl bg-blush-soft/60 px-3 py-2.5">
          <p className="text-[11px] font-medium uppercase tracking-wide text-plum-soft">Remaining</p>
          <p className={`tnum text-sm font-semibold ${remaining < 0 ? 'text-coral-deep' : 'text-plum-ink'}`}>
            {formatCurrency(remaining)}
          </p>
        </div>
      </div>

      <div className="mt-3">
        <StatusPill health={health} />
      </div>
    </Card>
  );
}
