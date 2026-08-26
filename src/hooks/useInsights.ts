import { useMemo } from 'react';
import { useApp } from '../store/AppStore';
import { useCycleData } from './useCycleData';
import { useReportsData } from './useReportsData';
import {
  cashflowRunwayInsight,
  pacingInsights,
  trendInsights,
  streakInsights,
  incomeTimingInsight,
  sortInsights,
  type Insight,
} from '../utils/insights';
import type { Cycle } from '../types/budget';

/**
 * All rule-based insights for the given cycle range, honouring the active
 * household-member view the same way the rest of the app does. Pass a
 * single-cycle range (e.g. [activeCycle]) for a lightweight "just today"
 * check (used on the Dashboard); pass the full Reports range for trend and
 * streak insights too.
 */
export function useInsights(cycleRange: Cycle[]): Insight[] {
  const { pools, activeCycle } = useApp();
  const { visiblePools, visibleTransactions, visibleCommitments, chequeBalance } = useCycleData();
  const { topPools, poolTrend } = useReportsData(cycleRange);

  const poolLabel = (id: string | null) => pools.find((p) => p.id === id)?.name ?? 'Unmapped';

  return useMemo(() => {
    const insights: Insight[] = [];

    const cashflow = cashflowRunwayInsight(chequeBalance, visibleCommitments, activeCycle, poolLabel);
    if (cashflow) insights.push(cashflow);

    insights.push(...pacingInsights(visiblePools, visibleTransactions, activeCycle));
    insights.push(...trendInsights(topPools, poolTrend));
    insights.push(...streakInsights(visiblePools, visibleTransactions, cycleRange));

    const income = incomeTimingInsight(activeCycle);
    if (income) insights.push(income);

    return sortInsights(insights);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chequeBalance, visibleCommitments, activeCycle, visiblePools, visibleTransactions, topPools, poolTrend, cycleRange, pools]);
}
