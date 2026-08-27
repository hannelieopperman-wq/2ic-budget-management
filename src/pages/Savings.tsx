import { useMemo, useState } from 'react';
import { PiggyBank, Plus, TrendingUp, Sparkles } from 'lucide-react';
import { AppShell } from '../components/layout/AppShell';
import { Button, Card, Modal, Input, Select, EmptyState } from '../components/ui';
import { TrendLineCard } from '../components/reports/TrendLineCard';
import { useApp } from '../store/AppStore';
import { formatCurrency } from '../utils/currency';
import { savingsHistory, summarizeSavings, projectSavings, savingsAccounts } from '../utils/savings';
import type { SavingsEntry } from '../types/budget';

const PROJECTION_MONTHS_OPTIONS = [
  { label: '1 year', months: 12 },
  { label: '5 years', months: 60 },
  { label: '10 years', months: 120 },
];

export function Savings() {
  const { accounts, cycles, activeCycle, savingsEntries, addSavingsEntry, updateSavingsEntry, updateAccount } = useApp();
  const accountsList = useMemo(() => savingsAccounts(accounts), [accounts]);
  const [selectedId, setSelectedId] = useState(accountsList[0]?.id ?? '');
  const selected = accountsList.find((a) => a.id === selectedId) ?? accountsList[0];

  const [logOpen, setLogOpen] = useState(false);
  const [contribution, setContribution] = useState(0);
  const [closingBalance, setClosingBalance] = useState(0);

  const [monthlyContribution, setMonthlyContribution] = useState(1000);
  const [growthRate, setGrowthRate] = useState(8);
  const [projectionMonths, setProjectionMonths] = useState(60);

  const history = useMemo(
    () => (selected ? savingsHistory(selected.id, savingsEntries, cycles) : []),
    [selected, savingsEntries, cycles],
  );
  const summary = useMemo(
    () => (selected ? summarizeSavings(history, selected.current_balance) : null),
    [history, selected],
  );

  const existingEntryThisCycle = selected
    ? savingsEntries.find((e) => e.account_id === selected.id && e.cycle_id === activeCycle.id)
    : undefined;

  const openLog = () => {
    if (!selected) return;
    if (existingEntryThisCycle) {
      setContribution(existingEntryThisCycle.contribution);
      setClosingBalance(existingEntryThisCycle.closing_balance);
    } else {
      setContribution(Math.round(summary?.avgMonthlyContribution ?? 0));
      setClosingBalance(selected.current_balance);
    }
    setLogOpen(true);
  };

  const saveLog = () => {
    if (!selected) return;
    if (existingEntryThisCycle) {
      updateSavingsEntry({ ...existingEntryThisCycle, contribution, closing_balance: closingBalance });
    } else {
      const entry: SavingsEntry = {
        id: crypto.randomUUID(),
        account_id: selected.id,
        cycle_id: activeCycle.id,
        contribution,
        closing_balance: closingBalance,
      };
      addSavingsEntry(entry);
    }
    updateAccount({ ...selected, current_balance: closingBalance, as_of_date: new Date().toISOString().slice(0, 10) });
    setLogOpen(false);
  };

  const trendData = history.map((p) => ({
    cycleLabel: p.cycleLabel,
    Balance: p.closing,
    Contributed: history.slice(0, history.indexOf(p) + 1).reduce((s, x) => s + x.contribution, 0),
  }));

  const projection = selected
    ? projectSavings(selected.current_balance, monthlyContribution, growthRate, projectionMonths)
    : [];
  const projectionChartData = projection
    .filter((_, i) => i % Math.max(1, Math.round(projectionMonths / 12)) === 0 || i === projection.length - 1)
    .map((p) => ({ cycleLabel: `M${p.month}`, Projected: p.balance }));
  const projectedFinal = projection[projection.length - 1]?.balance ?? 0;

  return (
    <AppShell title="Savings" subtitle="Growth tracking & projections">
      {accountsList.length === 0 ? (
        <EmptyState
          title="No savings accounts yet"
          message='Add one in Settings → Accounts with type "Savings" — e.g. Allan Gray, a unit trust, or an emergency fund.'
          icon={<PiggyBank size={26} />}
        />
      ) : (
        <div className="space-y-5">
          {accountsList.length > 1 && (
            <Select label="Account" value={selectedId} onChange={(e) => setSelectedId(e.target.value)}>
              {accountsList.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.label}
                </option>
              ))}
            </Select>
          )}

          {selected && summary && (
            <>
              <Card className="p-6 animate-slide-up">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="grid h-10 w-10 place-items-center rounded-2xl bg-sage/20 text-sage-deep">
                      <PiggyBank size={19} />
                    </div>
                    <div>
                      <p className="font-serif text-lg text-plum-ink">{selected.label}</p>
                      <p className="text-xs text-plum-soft">as of {selected.as_of_date}</p>
                    </div>
                  </div>
                  <Button variant="secondary" onClick={openLog}>
                    <Plus size={15} /> Log {activeCycle.label}
                  </Button>
                </div>

                <div className="mt-5 grid grid-cols-3 gap-3">
                  <div className="rounded-2xl bg-blush-soft/60 px-3 py-3">
                    <p className="text-[11px] font-medium uppercase tracking-wide text-plum-soft">Balance</p>
                    <p className="tnum text-lg font-semibold text-plum-ink">{formatCurrency(summary.currentBalance)}</p>
                  </div>
                  <div className="rounded-2xl bg-blush-soft/60 px-3 py-3">
                    <p className="text-[11px] font-medium uppercase tracking-wide text-plum-soft">Contributed</p>
                    <p className="tnum text-lg font-semibold text-plum-ink">{formatCurrency(summary.totalContributed)}</p>
                  </div>
                  <div className="rounded-2xl bg-sage/15 px-3 py-3">
                    <p className="text-[11px] font-medium uppercase tracking-wide text-plum-soft">Growth</p>
                    <p className={`tnum text-lg font-semibold ${summary.totalGrowth >= 0 ? 'text-sage-deep' : 'text-coral-deep'}`}>
                      {formatCurrency(summary.totalGrowth)}
                    </p>
                  </div>
                </div>
              </Card>

              <TrendLineCard title="Balance over time" data={trendData} seriesKeys={['Balance', 'Contributed']} yFormat="currency" />

              <Card className="p-6 animate-slide-up">
                <div className="mb-4 flex items-center gap-2.5">
                  <div className="grid h-9 w-9 place-items-center rounded-2xl bg-champagne/20 text-champagne-deep">
                    <Sparkles size={17} />
                  </div>
                  <h3 className="font-serif text-lg text-plum-ink">What if you saved more?</h3>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  <Input
                    label="Monthly contribution (R)"
                    type="number"
                    value={monthlyContribution}
                    onChange={(e) => setMonthlyContribution(Number(e.target.value))}
                  />
                  <Input
                    label="Assumed annual growth (%)"
                    type="number"
                    value={growthRate}
                    onChange={(e) => setGrowthRate(Number(e.target.value))}
                  />
                  <Select
                    label="Time horizon"
                    value={String(projectionMonths)}
                    onChange={(e) => setProjectionMonths(Number(e.target.value))}
                  >
                    {PROJECTION_MONTHS_OPTIONS.map((o) => (
                      <option key={o.months} value={o.months}>
                        {o.label}
                      </option>
                    ))}
                  </Select>
                </div>

                <div className="mt-4 flex items-center gap-2.5 rounded-2xl bg-sage/15 px-4 py-3">
                  <TrendingUp size={18} className="shrink-0 text-sage-deep" />
                  <p className="text-sm text-plum">
                    At {formatCurrency(monthlyContribution)}/month and {growthRate}% growth, projected to reach{' '}
                    <strong className="text-sage-deep">{formatCurrency(projectedFinal)}</strong> in{' '}
                    {PROJECTION_MONTHS_OPTIONS.find((o) => o.months === projectionMonths)?.label}.
                  </p>
                </div>

                <div className="mt-4">
                  <TrendLineCard
                    title="Projected growth"
                    data={projectionChartData}
                    seriesKeys={['Projected']}
                    yFormat="currency"
                  />
                </div>
              </Card>
            </>
          )}
        </div>
      )}

      <Modal
        open={logOpen}
        onClose={() => setLogOpen(false)}
        title={`Log ${activeCycle.label}`}
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setLogOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={saveLog}>
              Save
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <Input
            label="Contribution this cycle (R)"
            type="number"
            value={contribution}
            onChange={(e) => setContribution(Number(e.target.value))}
          />
          <Input
            label="Closing balance (R) — from your statement"
            type="number"
            value={closingBalance}
            onChange={(e) => setClosingBalance(Number(e.target.value))}
          />
          <p className="rounded-2xl bg-blush-soft/60 px-4 py-3 text-xs text-plum-soft">
            Growth (investment return) is calculated automatically as closing balance minus opening balance minus
            your contribution.
          </p>
        </div>
      </Modal>
    </AppShell>
  );
}
