import { useMemo } from 'react';
import { useApp } from '../store/AppStore';
import { isInCycle } from '../utils/cycle';
import { isVisible, memberIdForAccount } from '../utils/members';
import { spentThisCycle, computeIncomeExpected, computeIncomeReceived } from '../utils/calculations';
import type { Cycle } from '../types/budget';

export interface PoolCyclePoint {
  cycleLabel: string;
  cycleId: string;
  [poolName: string]: string | number; // dynamic pool series keys
}

export interface MemberSpendPoint {
  name: string;
  value: number;
  color: string;
}

export interface IncomeTrendPoint {
  cycleLabel: string;
  Expected: number;
  Received: number;
  [key: string]: string | number;
}

/**
 * Cross-cycle report data, honouring the active member view (Combined or a
 * specific profile) the same way the dashboard does.
 */
export function useReportsData(cycleRange: Cycle[]) {
  const { pools, transactions, accounts, members, incomeSources, activeMemberId } = useApp();

  return useMemo(() => {
    const visiblePools = pools.filter((p) => isVisible(p.member_id, activeMemberId) && p.type !== 'excluded');
    const visibleTransactions = transactions.filter((t) =>
      isVisible(memberIdForAccount(t.account_id, accounts), activeMemberId),
    );

    // Top pools by total spend across the range, so the trend chart doesn't
    // get cluttered with a dozen thin lines.
    const totalsByPool = new Map<string, number>();
    for (const pool of visiblePools) {
      const total = cycleRange.reduce((sum, cycle) => sum + spentThisCycle(pool, visibleTransactions, cycle), 0);
      totalsByPool.set(pool.id, total);
    }
    const topPools = [...visiblePools]
      .sort((a, b) => (totalsByPool.get(b.id) ?? 0) - (totalsByPool.get(a.id) ?? 0))
      .slice(0, 6);

    const poolTrend: PoolCyclePoint[] = cycleRange.map((cycle) => {
      const point: PoolCyclePoint = { cycleLabel: cycle.label, cycleId: cycle.id };
      for (const pool of topPools) {
        point[pool.name] = Math.round(spentThisCycle(pool, visibleTransactions, cycle) * 100) / 100;
      }
      return point;
    });

    // Current (latest) cycle in the range for the pool-breakdown snapshot.
    const latestCycle = cycleRange[cycleRange.length - 1];
    const poolBreakdown = latestCycle
      ? visiblePools
          .map((pool) => ({
            name: pool.name,
            value: Math.round(spentThisCycle(pool, visibleTransactions, latestCycle) * 100) / 100,
          }))
          .filter((p) => p.value > 0)
          .sort((a, b) => b.value - a.value)
      : [];

    // Spending by member — whose account the money actually left, for the
    // latest cycle in range. Shared/joint accounts roll up as "Shared".
    const memberColorMap: Record<string, string> = { rose: '#FF6F61', sage: '#178F80', champagne: '#D99A2E', coral: '#C13327', plum: '#22314F' };
    const memberBreakdown: MemberSpendPoint[] = [];
    if (latestCycle) {
      const totals = new Map<string, number>();
      for (const t of visibleTransactions) {
        if (t.direction !== 'out' || !isInCycle(t.date, latestCycle)) continue;
        const pool = pools.find((p) => p.id === t.pool_id);
        if (pool?.type === 'excluded') continue;
        const owner = memberIdForAccount(t.account_id, accounts);
        const key = owner ?? 'shared';
        totals.set(key, (totals.get(key) ?? 0) + Math.abs(t.amount));
      }
      for (const m of members) {
        const v = totals.get(m.id) ?? 0;
        if (v > 0) memberBreakdown.push({ name: m.name, value: Math.round(v * 100) / 100, color: memberColorMap[m.color] ?? '#22314F' });
      }
      const shared = totals.get('shared') ?? 0;
      if (shared > 0) memberBreakdown.push({ name: 'Shared', value: Math.round(shared * 100) / 100, color: '#F6B84E' });
    }

    // Expected comes from Income Sources (same for every cycle unless sources
    // change); received is computed per cycle from actual incoming transactions.
    const expectedForRange = computeIncomeExpected(incomeSources, accounts, activeMemberId);
    const incomeTrend: IncomeTrendPoint[] = cycleRange.map((cycle) => ({
      cycleLabel: cycle.label,
      Expected: Math.round(expectedForRange * 100) / 100,
      Received: Math.round(computeIncomeReceived(transactions, pools, accounts, cycle, activeMemberId) * 100) / 100,
    }));

    const totalSpentInRange = cycleRange.reduce(
      (sum, cycle) => sum + visiblePools.reduce((s, pool) => s + spentThisCycle(pool, visibleTransactions, cycle), 0),
      0,
    );

    return {
      topPools,
      poolTrend,
      poolBreakdown,
      memberBreakdown,
      incomeTrend,
      totalSpentInRange,
      visiblePools,
      visibleTransactions,
      latestCycle,
    };
  }, [pools, transactions, accounts, members, incomeSources, activeMemberId, cycleRange]);
}
