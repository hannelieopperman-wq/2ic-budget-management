import { Link } from 'react-router-dom';
import { ArrowRight, CalendarClock } from 'lucide-react';
import { AppShell } from '../components/layout/AppShell';
import { SafeToSpendCard } from '../components/dashboard/SafeToSpendCard';
import { IncomeCard } from '../components/dashboard/IncomeCard';
import { AccountCard } from '../components/dashboard/AccountCard';
import { UpcomingCommitments } from '../components/dashboard/UpcomingCommitments';
import { PoolCard } from '../components/dashboard/PoolCard';
import { AlertStrip, type AlertItem } from '../components/alerts/AlertStrip';
import { useApp } from '../store/AppStore';
import { useCycleData } from '../hooks/useCycleData';
import { useInsights } from '../hooks/useInsights';
import { daysSinceCycleStart, formatFriendlyDate, cycleCountdownMessage } from '../utils/cycle';
import { formatCurrency } from '../utils/currency';
import { ALL_MEMBERS } from '../utils/members';

function greetingWord(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

export function Dashboard() {
  const { activeCycle, activeMemberId, members, householdName } = useApp();
  const data = useCycleData();
  const insights = useInsights([activeCycle]);
  const cashflowWarning = insights.find((i) => i.id === 'cashflow-shortfall');

  const viewLabel =
    activeMemberId === ALL_MEMBERS
      ? householdName
      : (members.find((m) => m.id === activeMemberId)?.name ?? householdName);

  // Income warning: received < expected AND >= 3 days into cycle.
  const daysIn = daysSinceCycleStart(activeCycle);
  const belowExpected = data.incomeReceived < data.incomeExpected;
  const showIncomeWarning = belowExpected && daysIn >= 3;

  const alerts: AlertItem[] = [];
  if (cashflowWarning)
    alerts.push({ id: 'cashflow', text: cashflowWarning.message, to: '/reports', tone: 'coral' });
  if (data.unmappedCount > 0)
    alerts.push({ id: 'unmapped', text: `${data.unmappedCount} transactions need your attention`, to: '/transactions?filter=unmapped', tone: 'coral' });
  if (data.overBudgetPools.length > 0)
    alerts.push({ id: 'over', text: `${data.overBudgetPools[0].pool.name} ${data.overBudgetPools[0].pct >= 1.0001 ? 'is over' : 'has reached its'} budget`, to: '/pools', tone: 'coral' });
  if (data.unbudgeted > 0)
    alerts.push({ id: 'unbudgeted', text: `${formatCurrency(data.unbudgeted)} of spending is currently unbudgeted`, to: '/pools', tone: 'champagne' });
  if (showIncomeWarning)
    alerts.push({ id: 'income', text: 'Income is still below expected this cycle', to: '/settings', tone: 'champagne' });

  return (
    <AppShell title={`${greetingWord()}, ${viewLabel}`} subtitle={formatFriendlyDate()}>
      <div className="space-y-5">
        <div className="animate-fade-in inline-flex items-center gap-2 rounded-full bg-blush-soft px-3.5 py-1.5 text-xs font-semibold text-rose-deep">
          <CalendarClock size={13} />
          {cycleCountdownMessage(activeCycle)}
        </div>

        <SafeToSpendCard amount={data.safe} cycleLabel={activeCycle.label} />

        {alerts.length > 0 && <AlertStrip alerts={alerts} />}

        <IncomeCard
          expected={data.incomeExpected}
          received={data.incomeReceived}
          variance={data.variance}
          belowExpected={belowExpected}
          showWarning={showIncomeWarning}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          {data.orderedAccounts.map((account, i) => (
            <AccountCard key={account.id} account={account} index={i} />
          ))}
        </div>

        <UpcomingCommitments commitments={data.upcoming} cycle={activeCycle} total={data.stillToGo} />

        <section className="animate-slide-up" style={{ animationDelay: '200ms' }}>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-serif text-xl text-plum-ink">Pool health</h2>
            <Link to="/pools" className="inline-flex items-center gap-1.5 text-sm font-semibold text-rose-deep transition hover:gap-2.5">
              All pools <ArrowRight size={15} />
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {data.poolViews.slice(0, 6).map((view, i) => (
              <PoolCard key={view.pool.id} view={view} index={i} />
            ))}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
