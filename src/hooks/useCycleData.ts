import { useMemo } from 'react';
import { useApp } from '../store/AppStore';
import { isInCycle } from '../utils/cycle';
import { isVisible, memberIdForAccount } from '../utils/members';
import {
  spentThisCycle,
  remaining,
  pctUsed,
  safeToSpend,
  stillToGoOff,
  unmappedTotal,
  unmappedCount,
  unbudgeted,
  upcomingCommitments,
  computeIncomeExpected,
  computeIncomeReceived,
} from '../utils/calculations';
import type { PoolView } from '../components/dashboard/PoolCard';

/**
 * All cycle-scoped, member-filtered derived values used across the app.
 * Filtering by household member happens once here — every page that needs
 * "what's visible in this view" reads from this hook rather than re-deriving
 * visibility itself.
 */
export function useCycleData() {
  const { pools, commitments, transactions, accounts, incomeSources, activeCycle, activeMemberId } = useApp();

  return useMemo(() => {
    // Accounts visible in this view (shared accounts always included).
    const visibleAccounts = accounts.filter((a) => isVisible(a.member_id, activeMemberId));
    const cheque = visibleAccounts.find((a) => a.kind === 'cheque');
    const credit = visibleAccounts.find((a) => a.kind === 'credit');

    // Cheque and credit lead (they drive safe-to-spend and are the primary
    // accounts); any additional accounts (savings, other) follow in the
    // order they were added.
    const kindPriority: Record<string, number> = { cheque: 0, credit: 1 };
    const orderedAccounts = [...visibleAccounts].sort(
      (a, b) => (kindPriority[a.kind] ?? 2) - (kindPriority[b.kind] ?? 2),
    );

    // Pools visible in this view (shared/joint pools always included).
    const visiblePools = pools.filter((p) => isVisible(p.member_id, activeMemberId));
    const budgetedPools = visiblePools.filter((p) => p.type !== 'excluded');

    // Transactions/commitments/income are owned via their account, not directly.
    const visibleTransactions = transactions.filter((t) =>
      isVisible(memberIdForAccount(t.account_id, accounts), activeMemberId),
    );
    const visibleCommitments = commitments.filter((c) =>
      isVisible(memberIdForAccount(c.account_id, accounts), activeMemberId),
    );

    const cycleTx = visibleTransactions.filter((t) => isInCycle(t.date, activeCycle));

    const poolViews: PoolView[] = budgetedPools
      .slice()
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((pool) => ({
        pool,
        spent: spentThisCycle(pool, visibleTransactions, activeCycle),
        remaining: remaining(pool, visibleTransactions, activeCycle),
        pct: pctUsed(pool, visibleTransactions, activeCycle),
      }));

    const upcoming = upcomingCommitments(visibleCommitments, activeCycle);
    const stillToGo = stillToGoOff(visibleCommitments, activeCycle);

    // Sum every visible cheque-kind account's balance — one account for a
    // single-member view, potentially several for the combined household view.
    const chequeBalance = visibleAccounts
      .filter((a) => a.kind === 'cheque')
      .reduce((sum, a) => sum + a.current_balance, 0);
    const safe = safeToSpend(chequeBalance, visiblePools, visibleTransactions, visibleCommitments, activeCycle);

    const unmapped$ = unmappedTotal(visibleTransactions, activeCycle);
    const unmappedN = unmappedCount(visibleTransactions, activeCycle);
    const unbudgeted$ = unbudgeted(visiblePools, visibleTransactions, activeCycle);

    // Computed live from Income Sources + actual transactions — not a static
    // demo field — so entering real income actually drives the app's
    // behaviour (warnings, insights), even though the figures stay masked
    // wherever they're displayed.
    const incomeExpected = computeIncomeExpected(incomeSources, accounts, activeMemberId);
    const incomeReceived = computeIncomeReceived(transactions, pools, accounts, activeCycle, activeMemberId);
    const variance = incomeReceived - incomeExpected;

    const overBudgetPools = poolViews.filter((v) => v.pct >= 1);

    return {
      cheque,
      credit,
      orderedAccounts,
      chequeBalance,
      visiblePools,
      visibleTransactions,
      visibleCommitments,
      cycleTx,
      poolViews,
      upcoming,
      stillToGo,
      safe,
      unmappedTotal: unmapped$,
      unmappedCount: unmappedN,
      unbudgeted: unbudgeted$,
      incomeExpected,
      incomeReceived,
      variance,
      overBudgetPools,
    };
  }, [pools, commitments, transactions, accounts, incomeSources, activeCycle, activeMemberId]);
}
