import type { SavingsEntry, Cycle, Account } from '../types/budget';

// ---------------------------------------------------------------------------
// Savings/investment growth tracking. Contributions are entered manually per
// cycle (from a fund statement); growth (investment return) is derived, not
// entered — it's whatever's left after accounting for the opening balance
// and contribution.
// ---------------------------------------------------------------------------

export interface SavingsHistoryPoint {
  cycleId: string;
  cycleLabel: string;
  opening: number;
  contribution: number;
  closing: number;
  growth: number; // closing - opening - contribution
}

/**
 * Build a chronological history for one savings account across a set of
 * cycles. Cycles with no logged entry are skipped (nothing to show yet).
 */
export function savingsHistory(
  accountId: string,
  entries: SavingsEntry[],
  cycles: Cycle[],
  openingFallback: number,
): SavingsHistoryPoint[] {
  const sortedCycles = [...cycles].sort((a, b) => a.start_date.localeCompare(b.start_date));
  const byCycle = new Map(entries.filter((e) => e.account_id === accountId).map((e) => [e.cycle_id, e]));

  const points: SavingsHistoryPoint[] = [];
  let priorClosing = openingFallback;

  for (const cycle of sortedCycles) {
    const entry = byCycle.get(cycle.id);
    if (!entry) continue;
    const opening = priorClosing;
    const growth = entry.closing_balance - opening - entry.contribution;
    points.push({
      cycleId: cycle.id,
      cycleLabel: cycle.label,
      opening,
      contribution: entry.contribution,
      closing: entry.closing_balance,
      growth,
    });
    priorClosing = entry.closing_balance;
  }
  return points;
}

export interface SavingsSummary {
  totalContributed: number;
  totalGrowth: number;
  currentBalance: number;
  /** Average monthly contribution across logged cycles, for the projection default. */
  avgMonthlyContribution: number;
}

export function summarizeSavings(history: SavingsHistoryPoint[], currentBalance: number): SavingsSummary {
  const totalContributed = history.reduce((sum, p) => sum + p.contribution, 0);
  const totalGrowth = history.reduce((sum, p) => sum + p.growth, 0);
  const avgMonthlyContribution = history.length > 0 ? totalContributed / history.length : 0;
  return { totalContributed, totalGrowth, currentBalance, avgMonthlyContribution };
}

export interface ProjectionPoint {
  month: number;
  balance: number;
}

/**
 * Simple month-by-month compound projection — simulated in a loop rather
 * than a closed-form formula, so it's easy to verify and impossible to get
 * the annuity math subtly wrong.
 */
export function projectSavings(
  currentBalance: number,
  monthlyContribution: number,
  annualGrowthRatePct: number,
  months: number,
): ProjectionPoint[] {
  const monthlyRate = annualGrowthRatePct / 100 / 12;
  const points: ProjectionPoint[] = [{ month: 0, balance: currentBalance }];
  let balance = currentBalance;
  for (let m = 1; m <= months; m++) {
    balance = balance * (1 + monthlyRate) + monthlyContribution;
    points.push({ month: m, balance: Math.round(balance * 100) / 100 });
  }
  return points;
}

/** All savings-kind accounts, regardless of member view — savings are shown per-account, not filtered like spending. */
export function savingsAccounts(accounts: Account[]): Account[] {
  return accounts.filter((a) => a.kind === 'savings');
}
