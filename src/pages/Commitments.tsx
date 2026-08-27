import { useState } from 'react';
import { Check, Clock, Plus, Pencil, Trash2 } from 'lucide-react';
import { AppShell } from '../components/layout/AppShell';
import { Button, Card, Modal, Input, Select, EmptyState } from '../components/ui';
import { useApp } from '../store/AppStore';
import { useCycleData } from '../hooks/useCycleData';
import { formatCurrency } from '../utils/currency';
import { formatDate, formatDayMonth } from '../utils/cycle';
import { commitmentDateISO } from '../utils/calculations';
import type { Commitment } from '../types/budget';

const emptyCommitment = (poolId: string, accountId: string): Commitment => ({
  id: crypto.randomUUID(),
  item: '',
  pool_id: poolId,
  account_id: accountId,
  search_term: '',
  amount: 0,
  day_of_month: 1,
  paid: false,
});

export function Commitments() {
  const { pools, accounts, activeCycle, addCommitment, updateCommitment, removeCommitment } = useApp();
  const { visibleCommitments } = useCycleData();
  const poolName = (id: string | null) => pools.find((p) => p.id === id)?.name ?? '—';
  const accountName = (id: string) => accounts.find((a) => a.id === id)?.label ?? '—';

  const [editing, setEditing] = useState<Commitment | null>(null);
  const [isNew, setIsNew] = useState(false);

  const dated = visibleCommitments
    .map((c) => ({ c, iso: commitmentDateISO(c, activeCycle) }))
    .filter((x) => x.iso)
    .sort((a, b) => new Date(a.iso!).getTime() - new Date(b.iso!).getTime());

  const openNew = () => {
    setEditing(emptyCommitment(pools[0]?.id ?? '', accounts[0]?.id ?? ''));
    setIsNew(true);
  };
  const openEdit = (c: Commitment) => {
    setEditing({ ...c });
    setIsNew(false);
  };
  const save = () => {
    if (!editing || !editing.item.trim() || !editing.search_term.trim()) return;
    if (isNew) addCommitment(editing);
    else updateCommitment(editing);
    setEditing(null);
  };

  return (
    <AppShell title="Commitments" subtitle={activeCycle.label}>
      <div className="mb-4 flex items-center justify-between animate-slide-up">
        <p className="text-sm text-plum-soft">Recurring payments that come off your accounts each cycle.</p>
        <Button variant="primary" onClick={openNew}>
          <Plus size={16} /> Add commitment
        </Button>
      </div>

      {dated.length === 0 ? (
        <EmptyState title="Nothing scheduled" message="Nothing scheduled to go off." icon={<Clock size={26} />} />
      ) : (
        <>
          {/* Desktop table */}
          <Card className="hidden overflow-hidden p-0 sm:block animate-slide-up">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-blush/60 text-left text-xs uppercase tracking-wide text-plum-soft">
                  <th className="px-5 py-3 font-semibold">Date</th>
                  <th className="px-5 py-3 font-semibold">Item</th>
                  <th className="px-5 py-3 font-semibold">Pool</th>
                  <th className="px-5 py-3 font-semibold">Account</th>
                  <th className="px-5 py-3 text-right font-semibold">Amount</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                  <th className="px-5 py-3 font-semibold sr-only">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-blush/40">
                {dated.map(({ c, iso }) => (
                  <tr key={c.id} className="group transition hover:bg-blush-soft/40">
                    <td className="tnum px-5 py-3.5 text-plum-soft">{formatDate(iso!)}</td>
                    <td className="px-5 py-3.5 font-medium text-plum-ink">{c.item}</td>
                    <td className="px-5 py-3.5 text-plum-soft">{poolName(c.pool_id)}</td>
                    <td className="px-5 py-3.5 text-plum-soft">{accountName(c.account_id)}</td>
                    <td className="tnum px-5 py-3.5 text-right font-semibold text-plum-ink">{formatCurrency(c.amount)}</td>
                    <td className="px-5 py-3.5">
                      <StatusChip commitment={c} />
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex justify-end gap-1 opacity-0 transition group-hover:opacity-100">
                        <button
                          onClick={() => openEdit(c)}
                          aria-label={`Edit ${c.item}`}
                          className="rounded-full p-1.5 text-plum-soft hover:bg-blush hover:text-plum"
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          onClick={() => removeCommitment(c.id)}
                          aria-label={`Remove ${c.item}`}
                          className="rounded-full p-1.5 text-plum-soft hover:bg-coral/15 hover:text-coral-deep"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>

          {/* Mobile stacked cards */}
          <div className="space-y-3 sm:hidden">
            {dated.map(({ c, iso }, i) => (
              <Card key={c.id} className="p-4 animate-slide-up" style={{ animationDelay: `${i * 40}ms` }}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="tnum w-14 shrink-0 rounded-xl bg-blush-soft px-2 py-1 text-center text-xs font-semibold text-plum">
                      {formatDayMonth(iso!)}
                    </span>
                    <div>
                      <p className="font-medium text-plum-ink">{c.item}</p>
                      <p className="text-xs text-plum-soft">
                        {poolName(c.pool_id)} · {accountName(c.account_id)}
                      </p>
                    </div>
                  </div>
                  <span className="tnum font-semibold text-plum-ink">{formatCurrency(c.amount)}</span>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <StatusChip commitment={c} />
                  <div className="flex gap-1">
                    <button
                      onClick={() => openEdit(c)}
                      aria-label={`Edit ${c.item}`}
                      className="rounded-full p-1.5 text-plum-soft hover:bg-blush hover:text-plum"
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      onClick={() => removeCommitment(c.id)}
                      aria-label={`Remove ${c.item}`}
                      className="rounded-full p-1.5 text-plum-soft hover:bg-coral/15 hover:text-coral-deep"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </>
      )}

      <Modal
        open={editing !== null}
        onClose={() => setEditing(null)}
        title={isNew ? 'Add commitment' : 'Edit commitment'}
        footer={
          editing && (
            <div className="flex items-center justify-between gap-3">
              {!isNew ? (
                <Button
                  variant="ghost"
                  onClick={() => {
                    removeCommitment(editing.id);
                    setEditing(null);
                  }}
                  className="text-coral-deep"
                >
                  <Trash2 size={16} /> Remove
                </Button>
              ) : (
                <span />
              )}
              <div className="flex gap-2">
                <Button variant="secondary" onClick={() => setEditing(null)}>
                  Cancel
                </Button>
                <Button variant="primary" onClick={save}>
                  Save commitment
                </Button>
              </div>
            </div>
          )
        }
      >
        {editing && (
          <div className="space-y-4">
            <Input
              label="Item name"
              value={editing.item}
              onChange={(e) => setEditing({ ...editing, item: e.target.value })}
              placeholder="e.g. Capitec Loan"
            />
            <Input
              label="Search term (matches bank description)"
              value={editing.search_term}
              onChange={(e) => setEditing({ ...editing, search_term: e.target.value })}
              placeholder="e.g. CAPITEC"
              className="font-mono"
            />
            <Input
              label="Amount (R)"
              type="number"
              value={editing.amount}
              onChange={(e) => setEditing({ ...editing, amount: Number(e.target.value) })}
            />
            <Input
              label="Day of month"
              type="number"
              min={1}
              max={31}
              value={editing.day_of_month}
              onChange={(e) => setEditing({ ...editing, day_of_month: Number(e.target.value) })}
            />
            <Select
              label="Pool"
              value={editing.pool_id ?? ''}
              onChange={(e) => setEditing({ ...editing, pool_id: e.target.value })}
            >
              {pools.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </Select>
            <Select
              label="Account"
              value={editing.account_id}
              onChange={(e) => setEditing({ ...editing, account_id: e.target.value })}
            >
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.label}
                </option>
              ))}
            </Select>
            <label className="flex items-center gap-3 rounded-2xl bg-blush-soft/60 px-4 py-3">
              <input
                type="checkbox"
                checked={!!editing.paid}
                onChange={(e) => setEditing({ ...editing, paid: e.target.checked })}
                className="h-4 w-4 accent-plum"
              />
              <span className="text-sm text-plum">Already paid this cycle</span>
            </label>
          </div>
        )}
      </Modal>
    </AppShell>
  );
}

function StatusChip({ commitment }: { commitment: Commitment }) {
  if (commitment.paid) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-sage/25 px-2.5 py-1 text-xs font-semibold text-sage-deep">
        <Check size={13} strokeWidth={3} className="animate-check-draw" style={{ strokeDasharray: 24 }} />
        Paid
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-blush px-2.5 py-1 text-xs font-semibold text-rose-deep">
      <Clock size={13} />
      Still to go off
    </span>
  );
}
