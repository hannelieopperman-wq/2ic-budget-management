import type { Pool, Transaction, Commitment, Cycle } from '../types/budget';
import { isInCycle, parseISO } from './cycle';

// ---------------------------------------------------------------------------
// Pure calculation helpers. The UI consumes clean numbers from here so that
// Phase 2 (Supabase) can swap the data source without touching components.
// Excluded pools NEVER count as spending. Guard against divide-by-zero.
// ---------------------------------------------------------------------------

const isExcluded = (pool: Pool | undefined): boolean => pool?.type === 'excluded';

/** Outgoing spend for a single pool within a cycle (excluded pools => 0). */
export function spentThisCycle(pool: Pool, transactions: Transaction[], cycle: Cycle): number {
  if (isExcluded(pool)) return 0;
  return transactions
    .filter((t) => t.pool_id === pool.id && t.direction === 'out' && isInCycle(t.date, cycle))
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);
}

export function remaining(pool: Pool, transactions: Transaction[], cycle: Cycle): number {
  return pool.monthly_budget - spentThisCycle(pool, transactions, cycle);
}

/** Fraction used (0..n). Returns 0 when budget is 0 to avoid divide-by-zero. */
export function pctUsed(pool: Pool, transactions: Transaction[], cycle: Cycle): number {
  if (pool.monthly_budget <= 0) return 0;
  return spentThisCycle(pool, transactions, cycle) / pool.monthly_budget;
}

/** Sum of unpaid commitments whose expected date is today or later. */
export function stillToGoOff(commitments: Commitment[], cycle: Cycle, today = new Date()): number {
  const now = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  return upcomingCommitments(commitments, cycle, today)
    .filter((c) => commitmentDateISO(c, cycle) && parseISO(commitmentDateISO(c, cycle)!).getTime() >= now)
    .reduce((sum, c) => sum + c.amount, 0);
}

/** Resolve a commitment's expected date within a cycle to an ISO string. */
export function commitmentDateISO(commitment: Commitment, cycle: Cycle): string | null {
  const start = parseISO(cycle.start_date);
  // Cycle spans two calendar months; pick whichever month makes day_of_month fall in-cycle.
  for (const monthOffset of [0, 1]) {
    const candidate = new Date(start.getFullYear(), start.getMonth() + monthOffset, commitment.day_of_month);
    const iso = `${candidate.getFullYear()}-${String(candidate.getMonth() + 1).padStart(2, '0')}-${String(
      candidate.getDate(),
    ).padStart(2, '0')}`;
    if (isInCycle(iso, cycle)) return iso;
  }
  return null;
}

/** Unpaid commitments in a cycle, sorted by their in-cycle date. */
export function upcomingCommitments(commitments: Commitment[], cycle: Cycle, _today = new Date()): Commitment[] {
  return commitments
    .filter((c) => !c.paid)
    .filter((c) => commitmentDateISO(c, cycle) !== null)
    .sort((a, b) => {
      const da = commitmentDateISO(a, cycle)!;
      const db = commitmentDateISO(b, cycle)!;
      return parseISO(da).getTime() - parseISO(db).getTime();
    });
}

/**
 * Safe to spend =
 *   cheque balance(s)
 *   - still to go off (upcoming unpaid commitments)
 *   - remaining budget of every essential-reserve pool
 *
 * chequeBalance is the sum of every *visible* cheque-kind account's balance —
 * for a single-member view that's normally one account; for the combined
 * household view it's the sum across every member's cheque account.
 */
export function safeToSpend(
  chequeBalance: number,
  pools: Pool[],
  transactions: Transaction[],
  commitments: Commitment[],
  cycle: Cycle,
  today = new Date(),
): number {
  const upcoming = stillToGoOff(commitments, cycle, today);
  const essentialReserve = pools
    .filter((p) => p.reserve_as_essential && p.type !== 'excluded')
    .reduce((sum, p) => sum + Math.max(remaining(p, transactions, cycle), 0), 0);
  return chequeBalance - upcoming - essentialReserve;
}

/** Spending mapped to a pool whose monthly_budget is 0 (excluded pools skipped). */
export function unbudgeted(pools: Pool[], transactions: Transaction[], cycle: Cycle): number {
  const zeroBudgetPoolIds = new Set(
    pools.filter((p) => p.monthly_budget === 0 && p.type !== 'excluded').map((p) => p.id),
  );
  return transactions
    .filter((t) => t.pool_id && zeroBudgetPoolIds.has(t.pool_id) && t.direction === 'out' && isInCycle(t.date, cycle))
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);
}

/** Sum of outgoing transactions with no pool (unmapped) in the cycle. */
export function unmappedTotal(transactions: Transaction[], cycle: Cycle): number {
  return transactions
    .filter((t) => t.pool_id === null && t.direction === 'out' && isInCycle(t.date, cycle))
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);
}

export function unmappedCount(transactions: Transaction[], cycle: Cycle): number {
  return transactions.filter((t) => t.pool_id === null && isInCycle(t.date, cycle)).length;
}

export function incomeVariance(cycle: Cycle): number {
  return cycle.income_received - cycle.income_expected;
}

/** Unallocated = expected income - sum of pool budgets (excluded pools skipped). */
export function unallocated(cycle: Cycle, pools: Pool[]): number {
  const allocated = pools
    .filter((p) => p.type !== 'excluded')
    .reduce((sum, p) => sum + p.monthly_budget, 0);
  return cycle.income_expected - allocated;
}

export function totalAllocated(pools: Pool[]): number {
  return pools.filter((p) => p.type !== 'excluded').reduce((sum, p) => sum + p.monthly_budget, 0);
}

export type PoolHealth = 'under' | 'approaching' | 'reached' | 'over';

export function poolHealth(pct: number): PoolHealth {
  if (pct > 1.0001) return 'over';
  if (pct >= 1) return 'reached';
  if (pct >= 0.85) return 'approaching';
  return 'under';
}
