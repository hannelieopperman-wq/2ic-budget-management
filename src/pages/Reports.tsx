import { useMemo, useState } from 'react';
import { FileDown, FileSpreadsheet, TrendingUp } from 'lucide-react';
import { AppShell } from '../components/layout/AppShell';
import { Button, Card, Select } from '../components/ui';
import { BarBreakdownCard } from '../components/reports/BarBreakdownCard';
import { TrendLineCard } from '../components/reports/TrendLineCard';
import { InsightsPanel } from '../components/reports/InsightsPanel';
import { useApp } from '../store/AppStore';
import { useReportsData } from '../hooks/useReportsData';
import { useInsights } from '../hooks/useInsights';
import { exportReportToPDF, exportReportToExcel } from '../utils/export';
import { formatCurrency } from '../utils/currency';
import { ALL_MEMBERS } from '../utils/members';

export function Reports() {
  const { cycles, pools, commitments, accounts, members, activeMemberId, activeCycleId, householdName } = useApp();
  const sortedCycles = useMemo(() => [...cycles].sort((a, b) => a.start_date.localeCompare(b.start_date)), [cycles]);

  const [fromId, setFromId] = useState(sortedCycles[0]?.id ?? '');
  const [toId, setToId] = useState(activeCycleId || sortedCycles[sortedCycles.length - 1]?.id || '');
  const [exporting, setExporting] = useState<'pdf' | 'xlsx' | null>(null);

  const cycleRange = useMemo(() => {
    const fromIdx = sortedCycles.findIndex((c) => c.id === fromId);
    const toIdx = sortedCycles.findIndex((c) => c.id === toId);
    if (fromIdx === -1 || toIdx === -1 || fromIdx > toIdx) return sortedCycles;
    return sortedCycles.slice(fromIdx, toIdx + 1);
  }, [sortedCycles, fromId, toId]);

  const { poolTrend, topPools, poolBreakdown, memberBreakdown, incomeTrend, totalSpentInRange, visiblePools, visibleTransactions } =
    useReportsData(cycleRange);
  const insights = useInsights(cycleRange);

  const accountLabel = (id: string) => accounts.find((a) => a.id === id)?.label ?? 'Unknown account';
  const poolLabel = (id: string | null) => pools.find((p) => p.id === id)?.name ?? 'Unmapped';
  const viewLabel = activeMemberId === ALL_MEMBERS ? householdName : members.find((m) => m.id === activeMemberId)?.name ?? householdName;

  const buildExportInput = () => ({
    viewLabel,
    cycleRange,
    pools: visiblePools,
    transactions: visibleTransactions,
    commitments,
    accounts,
    accountLabel,
    poolLabel,
  });

  return (
    <AppShell title="Reports" subtitle={`${viewLabel} · ${cycleRange.length} cycle${cycleRange.length === 1 ? '' : 's'}`}>
      <div className="space-y-5">
        {/* Range + export controls */}
        <Card className="p-5 animate-slide-up">
          <div className="grid gap-3 sm:grid-cols-2">
            <Select label="From" value={fromId} onChange={(e) => setFromId(e.target.value)}>
              {sortedCycles.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </Select>
            <Select label="To" value={toId} onChange={(e) => setToId(e.target.value)}>
              {sortedCycles.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </Select>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button
              variant="secondary"
              disabled={exporting !== null}
              onClick={async () => {
                setExporting('pdf');
                try {
                  await exportReportToPDF(buildExportInput());
                } finally {
                  setExporting(null);
                }
              }}
            >
              <FileDown size={16} /> {exporting === 'pdf' ? 'Preparing…' : 'Export PDF'}
            </Button>
            <Button
              variant="secondary"
              disabled={exporting !== null}
              onClick={async () => {
                setExporting('xlsx');
                try {
                  await exportReportToExcel(buildExportInput());
                } finally {
                  setExporting(null);
                }
              }}
            >
              <FileSpreadsheet size={16} /> {exporting === 'xlsx' ? 'Preparing…' : 'Export Excel'}
            </Button>
          </div>
          <p className="mt-3 text-xs text-plum-soft">
            Exports run entirely on your device — nothing is uploaded.
          </p>
        </Card>

        {/* Summary */}
        <Card className="p-6 animate-slide-up">
          <div className="flex items-center gap-2.5">
            <div className="grid h-9 w-9 place-items-center rounded-2xl bg-blush text-rose-deep">
              <TrendingUp size={17} />
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-plum-soft">Total spent in range</p>
              <p className="tnum font-serif text-2xl text-plum-ink">{formatCurrency(totalSpentInRange)}</p>
            </div>
          </div>
        </Card>

        <InsightsPanel insights={insights} />

        <BarBreakdownCard title="Spending by pool (latest cycle)" data={poolBreakdown} />

        <TrendLineCard
          title="Spending trend by pool"
          data={poolTrend}
          seriesKeys={topPools.map((p) => p.name)}
          yFormat="currency"
        />

        {memberBreakdown.length > 0 && (
          <BarBreakdownCard title="Spending by member (latest cycle)" data={memberBreakdown} />
        )}

        <TrendLineCard
          title="Income received vs expected"
          data={incomeTrend}
          seriesKeys={['Expected', 'Received']}
          yFormat="currency"
        />
      </div>
    </AppShell>
  );
}
