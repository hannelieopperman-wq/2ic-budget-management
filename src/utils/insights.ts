import type { Pool, Commitment, Cycle, Transaction } from '../types/budget';
import { spentThisCycle, pctUsed, upcomingCommitments, commitmentDateISO } from './calculations';
import { cycleLengthDays, daysSinceCycleStart, formatDayMonth } from './cycle';
import { formatCurrency } from './currency';

// ---------------------------------------------------------------------------
// Rule-based financial insights — no AI, no backend, computed entirely from
// data already in the app. Every insight pairs an icon-appropriate tone with
// plain text (never colour alone), matching the app's accessibility rules.
// ---------------------------------------------------------------------------

export type InsightTone = 'warning' | 'positive' | 'neutral';

export interface Insight {
  id: string;
  tone: InsightTone;
  title: string;
  message: string;
}

const PACE_BUFFER = 0.15; // 15 percentage points of slack before flagging pace risk
const TREND_THRESHOLD = 0.15; // 15% change vs previous cycle before it's worth mentioning
const STREAK_MIN = 3; // minimum cycles to call something a "streak"

/**
 * Cashflow runway — walks through every still-unpaid commitment in date
 * order, subtracting from the current balance, and flags the point (if any)
 * where the running balance would go negative. This is the "will I make it"
 * check.
 */
export function cashflowRunwayInsight(
  chequeBalance: number,
  commitments: Commitment[],
  cycle: Cycle,
  poolName: (id: string | null) => string,
): Insight | null {
  const upcoming = upcomingCommitments(commitments, cycle);
  if (upcoming.length === 0) return null;

  let running = chequeBalance;
  for (const c of upcoming) {
    running -= c.amount;
    if (running < 0) {
      const iso = commitmentDateISO(c, cycle);
      const dateText = iso ? formatDayMonth(iso) : 'soon';
      return {
        id: 'cashflow-shortfall',
        tone: 'warning',
        title: 'Cashflow warning',
        message: `Based on what's still due, you may come up about ${formatCurrency(Math.abs(running))} short by the time ${c.item} (${poolName(c.pool_id)}) is due on ${dateText}.`,
      };
    }
  }
  return {
    id: 'cashflow-ok',
    tone: 'positive',
    title: 'Cashflow looks steady',
    message: `You're on track to cover all ${upcoming.length} upcoming commitment${upcoming.length === 1 ? '' : 's'} this cycle.`,
  };
}

/** Is a pool spending faster (or slower) than the cycle is progressing? */
export function pacingInsights(pools: Pool[], transactions: Transaction[], cycle: Cycle): Insight[] {
  const totalDays = cycleLengthDays(cycle);
  const elapsed = Math.min(Math.max(daysSinceCycleStart(cycle), 0), totalDays);
  const pctElapsed = totalDays > 0 ? elapsed / totalDays : 0;
  if (pctElapsed < 0.1) return []; // too early in the cycle to say anything useful

  const out: Insight[] = [];
  for (const pool of pools) {
    if (pool.monthly_budget <= 0) continue;
    const pct = pctUsed(pool, transactions, cycle);
    if (pct >= 1) continue; // already covered by the over/reached-budget status elsewhere

    if (pct - pctElapsed > PACE_BUFFER) {
      const projected = pctElapsed > 0 ? (pct / pctElapsed) * pool.monthly_budget : pool.monthly_budget;
      const over = projected - pool.monthly_budget;
      if (over > 50) {
        out.push({
          id: `pace-over-${pool.id}`,
          tone: 'warning',
          title: `${pool.name} is pacing ahead`,
          message: `At the current rate, ${pool.name} could finish around ${formatCurrency(over)} over budget by the end of the cycle.`,
        });
      }
    } else if (pctElapsed - pct > PACE_BUFFER && pct > 0.05) {
      out.push({
        id: `pace-under-${pool.id}`,
        tone: 'positive',
        title: `${pool.name} is comfortably under pace`,
        message: `You're well ahead on ${pool.name} — plenty of room left for the rest of the cycle.`,
      });
    }
  }
  return out;
}

/** Compare the latest cycle's spend against the one before it, per pool. */
export function trendInsights(topPools: Pool[], poolTrend: Record<string, string | number>[]): Insight[] {
  if (poolTrend.length < 2) return [];
  const latest = poolTrend[poolTrend.length - 1];
  const previous = poolTrend[poolTrend.length - 2];
  const out: Insight[] = [];

  for (const pool of topPools) {
    const latestVal = Number(latest[pool.name] ?? 0);
    const prevVal = Number(previous[pool.name] ?? 0);
    if (prevVal <= 0) continue;
    const change = (latestVal - prevVal) / prevVal;
    if (change >= TREND_THRESHOLD) {
      out.push({
        id: `trend-up-${pool.id}`,
        tone: 'warning',
        title: `${pool.name} trending up`,
        message: `${pool.name} spending is up ${Math.round(change * 100)}% versus last cycle.`,
      });
    } else if (change <= -TREND_THRESHOLD) {
      out.push({
        id: `trend-down-${pool.id}`,
        tone: 'positive',
        title: `${pool.name} trending down`,
        message: `Nice — ${pool.name} spending dropped ${Math.round(Math.abs(change) * 100)}% versus last cycle.`,
      });
    }
  }
  return out;
}

/** Has a pool been consistently under (or over) budget across the whole range? */
export function streakInsights(pools: Pool[], transactions: Transaction[], cycleRange: Cycle[]): Insight[] {
  if (cycleRange.length < STREAK_MIN) return [];
  const out: Insight[] = [];

  for (const pool of pools) {
    if (pool.monthly_budget <= 0) continue;
    const results = cycleRange.map((cycle) => pctUsed(pool, transactions, cycle));
    const allUnder = results.every((p) => p < 0.95);
    const allOver = results.every((p) => p >= 1);
    if (allUnder) {
      out.push({
        id: `streak-under-${pool.id}`,
        tone: 'positive',
        title: `${pool.name} streak`,
        message: `${pool.name} has stayed under budget for ${cycleRange.length} cycles running — nice consistency.`,
      });
    } else if (allOver) {
      out.push({
        id: `streak-over-${pool.id}`,
        tone: 'neutral',
        title: `${pool.name} keeps going over`,
        message: `${pool.name} has gone over budget in all ${cycleRange.length} of the last cycles — might be worth reviewing the budget amount.`,
      });
    }
  }
  return out;
}

/** A richer, trend-aware version of the dashboard's simple income warning. */
export function incomeTimingInsight(cycle: Cycle, incomeExpected: number, incomeReceived: number): Insight | null {
  const totalDays = cycleLengthDays(cycle);
  const elapsed = Math.min(Math.max(daysSinceCycleStart(cycle), 0), totalDays);
  const pctElapsed = totalDays > 0 ? elapsed / totalDays : 0;
  const pctReceived = incomeExpected > 0 ? incomeReceived / incomeExpected : 1;

  if (pctReceived >= 1) return null; // fully received, nothing to flag
  if (pctElapsed > 0.5 && pctReceived < 0.9) {
    return {
      id: 'income-timing',
      tone: 'warning',
      title: 'Income still catching up',
      message: `You're over halfway through the cycle with some income still outstanding — worth checking if a payment is delayed.`,
    };
  }
  return null;
}

/** Rank warnings first, then things worth keeping an eye on, then wins. */
export function sortInsights(insights: Insight[]): Insight[] {
  const order: Record<InsightTone, number> = { warning: 0, neutral: 1, positive: 2 };
  return [...insights].sort((a, b) => order[a.tone] - order[b.tone]);
}

// Re-exported so a single pool can be checked outside a cycle loop if needed.
export { spentThisCycle };
