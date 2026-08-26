import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Wallet, CreditCard, PiggyBank, Landmark, PartyPopper, ArrowLeft } from 'lucide-react';
import { AppShell } from '../components/layout/AppShell';
import { CsvDropzone } from '../components/import/CsvDropzone';
import { ImportStepper } from '../components/import/ImportStepper';
import { Button, Card, Badge } from '../components/ui';
import { useApp } from '../store/AppStore';
import { readGrid, extractRows, prepareImport, type PreparedTransaction } from '../utils/csv';
import { formatCurrency } from '../utils/currency';
import { formatDate } from '../utils/cycle';
import type { AccountKind } from '../types/budget';

const mappingBadge = (p: PreparedTransaction) => {
  if (p.isDuplicate) return <Badge tone="neutral">Duplicate</Badge>;
  if (p.mapped_by === 'commitment') return <Badge tone="sage">✓ Commitment</Badge>;
  if (p.mapped_by === 'rule') return <Badge tone="sage">✓ Rule</Badge>;
  if (p.mapped_by === 'manual') return <Badge tone="sage">✓ Manual</Badge>;
  return <Badge tone="coral">! Unmapped</Badge>;
};

const kindIcon: Record<AccountKind, typeof Wallet> = {
  cheque: Wallet,
  credit: CreditCard,
  savings: PiggyBank,
  other: Landmark,
};

export function Import() {
  const { transactions, commitments, rules, cycles, pools, accounts, commitImport, updateAccount } = useApp();
  const navigate = useNavigate();

  const [step, setStep] = useState(0);
  const [file, setFile] = useState<File | null>(null);
  const [accountId, setAccountId] = useState<string | null>(null);
  const [prepared, setPrepared] = useState<PreparedTransaction[]>([]);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<{
    imported: number;
    duplicates: number;
    unmapped: number;
    latestBalance: { balance: number; date: string } | null;
  } | null>(null);

  const poolName = (id: string | null) => pools.find((p) => p.id === id)?.name ?? null;
  const selectedAccount = accounts.find((a) => a.id === accountId);

  const runPreview = async () => {
    if (!file || !accountId) return;
    setProcessing(true);
    try {
      const grid = await readGrid(file);
      const rows = extractRows(grid);
      const res = prepareImport(rows, accountId, transactions, commitments, rules, cycles);
      setPrepared(res.prepared);
      setResult({ imported: res.imported, duplicates: res.duplicates, unmapped: res.unmapped, latestBalance: res.latestBalance });
      setStep(2);
    } finally {
      setProcessing(false);
    }
  };

  const confirmImport = () => {
    const toCommit = prepared
      .filter((p) => !p.isDuplicate)
      .map(({ isDuplicate: _isDuplicate, balance: _balance, ...t }) => t);
    commitImport(toCommit);

    // Bank CSVs almost always include a running balance column — use the
    // most recent one to keep the account balance accurate automatically,
    // instead of asking for a manual re-type every time.
    if (result?.latestBalance && selectedAccount) {
      updateAccount({
        ...selectedAccount,
        current_balance: result.latestBalance.balance,
        as_of_date: result.latestBalance.date,
      });
    }
    setStep(4);
  };

  const reset = () => {
    setStep(0);
    setFile(null);
    setAccountId(null);
    setPrepared([]);
    setResult(null);
  };

  return (
    <AppShell title="Import" subtitle="Bring in a bank CSV">
      <ImportStepper current={step} />

      {step === 0 && (
        <div className="space-y-5 animate-slide-up">
          <CsvDropzone file={file} onFile={setFile} onClear={() => setFile(null)} />
          <div className="flex justify-end">
            <Button variant="primary" disabled={!file} onClick={() => setStep(1)}>
              Continue
            </Button>
          </div>
        </div>
      )}

      {step === 1 && (
        <div className="space-y-5 animate-slide-up">
          <p className="text-sm text-plum-soft">Which account is this file for?</p>
          <div className="grid gap-4 sm:grid-cols-2">
            {accounts.map((a) => {
              const Icon = kindIcon[a.kind];
              const selected = accountId === a.id;
              return (
                <button
                  key={a.id}
                  onClick={() => setAccountId(a.id)}
                  className={`flex flex-col items-center gap-3 rounded-3xl border-2 p-8 transition
                    ${selected ? 'border-plum bg-blush-soft/60 shadow-soft' : 'border-blush bg-cream hover:bg-blush-soft/30'}`}
                >
                  <Icon size={30} className="text-rose-deep" />
                  <span className="font-serif text-lg text-plum-ink">{a.label}</span>
                </button>
              );
            })}
          </div>
          <div className="flex justify-between">
            <Button variant="secondary" onClick={() => setStep(0)}>
              <ArrowLeft size={16} /> Back
            </Button>
            <Button variant="primary" disabled={!accountId || processing} onClick={runPreview}>
              {processing ? 'Processing…' : 'Preview import'}
            </Button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4 animate-slide-up">
          {result && (
            <div className="flex flex-wrap gap-3 text-sm">
              <Badge tone="sage">{result.imported} to import</Badge>
              <Badge tone="neutral">{result.duplicates} duplicates skipped</Badge>
              {result.unmapped > 0 && <Badge tone="coral">{result.unmapped} unmapped</Badge>}
            </div>
          )}
          <Card className="max-h-[50vh] divide-y divide-blush/40 overflow-y-auto p-0">
            {prepared.map((p) => (
              <div key={p.id} className={`flex items-center gap-3 px-4 py-3 ${p.isDuplicate ? 'opacity-50' : ''}`}>
                <span className="tnum hidden w-16 shrink-0 text-xs text-plum-soft sm:block">{formatDate(p.date)}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-plum-ink">{p.merchant}</p>
                  <p className="text-xs text-plum-soft">{poolName(p.pool_id) ?? 'No pool'}</p>
                </div>
                {mappingBadge(p)}
                <span className="tnum w-24 shrink-0 text-right text-sm font-semibold text-plum-ink">
                  {formatCurrency(p.amount)}
                </span>
              </div>
            ))}
          </Card>
          <div className="flex justify-between">
            <Button variant="secondary" onClick={() => setStep(1)}>
              <ArrowLeft size={16} /> Back
            </Button>
            <Button variant="primary" onClick={() => setStep(3)}>
              Continue
            </Button>
          </div>
        </div>
      )}

      {step === 3 && result && (
        <div className="space-y-5 animate-slide-up">
          <Card className="p-6 text-center">
            <p className="font-serif text-xl text-plum-ink">Confirm import</p>
            <p className="mt-2 text-sm text-plum-soft">
              {result.imported} transactions will be imported. {result.duplicates} duplicates will be skipped.
              {result.unmapped > 0 && ` ${result.unmapped} will need your attention.`}
            </p>
            {result.latestBalance && selectedAccount && (
              <p className="mt-3 rounded-2xl bg-sage/15 px-4 py-3 text-xs text-sage-deep">
                {selectedAccount.label}'s balance will also update to {formatCurrency(result.latestBalance.balance)}{' '}
                (as of {formatDate(result.latestBalance.date)}) — no manual entry needed.
              </p>
            )}
          </Card>
          <div className="flex justify-between">
            <Button variant="secondary" onClick={() => setStep(2)}>
              <ArrowLeft size={16} /> Back
            </Button>
            <Button variant="primary" onClick={confirmImport}>
              Confirm import
            </Button>
          </div>
        </div>
      )}

      {step === 4 && result && (
        <div className="flex flex-col items-center py-8 text-center animate-scale-in">
          <div className="mb-4 grid h-16 w-16 place-items-center rounded-full bg-sage/25 text-sage-deep">
            <PartyPopper size={30} />
          </div>
          <h2 className="font-serif text-2xl text-plum-ink">Import complete</h2>
          <div className="mt-4 flex flex-wrap justify-center gap-3 text-sm">
            <Badge tone="sage">{result.imported} imported</Badge>
            <Badge tone="neutral">{result.duplicates} duplicates skipped</Badge>
            {result.unmapped > 0 && <Badge tone="coral">{result.unmapped} need attention</Badge>}
          </div>
          {result.latestBalance ? (
            <p className="mt-3 max-w-xs text-xs text-plum-soft">
              {selectedAccount?.label} balance updated automatically — no need to check Settings.
            </p>
          ) : (
            <p className="mt-3 max-w-xs text-xs text-plum-soft">
              This file didn't include a balance column, so update the account balance manually in Settings
              when you get a chance.
            </p>
          )}
          <div className="mt-6 flex gap-3">
            {result.unmapped > 0 && (
              <Button variant="secondary" onClick={() => navigate('/transactions?filter=unmapped')}>
                Review unmapped
              </Button>
            )}
            <Button
              variant="primary"
              onClick={() => {
                reset();
                navigate('/');
              }}
            >
              Go to dashboard
            </Button>
          </div>
        </div>
      )}
    </AppShell>
  );
}
