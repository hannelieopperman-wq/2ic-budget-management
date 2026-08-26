import { Link } from 'react-router-dom';
import { ArrowRight, CalendarClock } from 'lucide-react';
import { Card, EmptyState } from '../ui';
import { formatCurrency } from '../../utils/currency';
import { formatDayMonth } from '../../utils/cycle';
import { commitmentDateISO } from '../../utils/calculations';
import type { Commitment, Cycle } from '../../types/budget';

export function UpcomingCommitments({
  commitments,
  cycle,
  total,
}: {
  commitments: Commitment[];
  cycle: Cycle;
  total: number;
}) {
  const next = commitments.slice(0, 3);
  return (
    <Card className="p-6 animate-slide-up" style={{ animationDelay: '160ms' }}>
      <div className="mb-4 flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-plum-soft">Still to go off this cycle</p>
          <p className="tnum mt-0.5 font-serif text-2xl text-plum-ink">{formatCurrency(total)}</p>
        </div>
        <div className="grid h-10 w-10 place-items-center rounded-2xl bg-blush text-rose-deep">
          <CalendarClock size={18} />
        </div>
      </div>

      {next.length === 0 ? (
        <EmptyState title="Nothing scheduled" message="Nothing left to go off for this cycle." icon={<CalendarClock size={26} />} />
      ) : (
        <ul className="divide-y divide-blush/50">
          {next.map((c) => {
            const iso = commitmentDateISO(c, cycle);
            return (
              <li key={c.id} className="flex items-center justify-between gap-3 py-3">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="tnum w-14 shrink-0 rounded-xl bg-blush-soft px-2 py-1 text-center text-xs font-semibold text-plum">
                    {iso ? formatDayMonth(iso) : '—'}
                  </span>
                  <span className="truncate text-sm font-medium text-plum-ink">{c.item}</span>
                </div>
                <span className="tnum shrink-0 text-sm font-semibold text-plum-ink">{formatCurrency(c.amount)}</span>
              </li>
            );
          })}
        </ul>
      )}

      <Link
        to="/commitments"
        className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-rose-deep transition hover:gap-2.5"
      >
        View all commitments <ArrowRight size={15} />
      </Link>
    </Card>
  );
}
