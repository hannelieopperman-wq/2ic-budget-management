import { useState } from 'react';
import { Pencil, Plus, Trash2, Wallet, CreditCard, PiggyBank, Landmark, AlertTriangle } from 'lucide-react';
import { Card, Modal, Input, Select, Button, EmptyState } from '../ui';
import { useApp } from '../../store/AppStore';
import { formatCurrency } from '../../utils/currency';
import { formatDate } from '../../utils/cycle';
import type { Account, AccountKind } from '../../types/budget';

const kindIcon: Record<AccountKind, typeof Wallet> = {
  cheque: Wallet,
  credit: CreditCard,
  savings: PiggyBank,
  other: Landmark,
};

const kindLabel: Record<AccountKind, string> = {
  cheque: 'Cheque / Current',
  credit: 'Credit Card',
  savings: 'Savings',
  other: 'Other',
};

const emptyAccount = (memberId: string | null): Account => ({
  id: crypto.randomUUID(),
  label: '',
  kind: 'savings',
  current_balance: 0,
  as_of_date: new Date().toISOString().slice(0, 10),
  member_id: memberId,
});

export function AccountSettings() {
  const { accounts, members, commitments, transactions, incomeSources, updateAccount, addAccount, removeAccount } =
    useApp();
  const [editing, setEditing] = useState<Account | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [pendingRemove, setPendingRemove] = useState<Account | null>(null);

  const memberName = (id: string | null) => (id ? members.find((m) => m.id === id)?.name : null);

  const openNew = () => {
    setEditing(emptyAccount(members[0]?.id ?? null));
    setIsNew(true);
  };
  const openEdit = (a: Account) => {
    setEditing({ ...a });
    setIsNew(false);
  };
  const save = () => {
    if (!editing || !editing.label.trim()) return;
    if (isNew) addAccount(editing);
    else updateAccount(editing);
    setEditing(null);
  };

  const askRemove = (a: Account) => setPendingRemove(a);
  const confirmRemove = () => {
    if (!pendingRemove) return;
    removeAccount(pendingRemove.id);
    setPendingRemove(null);
    setEditing(null);
  };
  const pendingCounts = pendingRemove
    ? {
        commitments: commitments.filter((c) => c.account_id === pendingRemove.id).length,
        transactions: transactions.filter((t) => t.account_id === pendingRemove.id).length,
        income: incomeSources.filter((s) => s.account_id === pendingRemove.id).length,
      }
    : null;

  return (
    <Card className="p-6 animate-slide-up">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-serif text-lg text-plum-ink">Accounts</h2>
        <Button variant="primary" onClick={openNew}>
          <Plus size={16} /> Add account
        </Button>
      </div>

      {accounts.length === 0 ? (
        <EmptyState title="No accounts yet" message="Add a cheque, credit card or savings account to get started." icon={<Wallet size={26} />} />
      ) : (
        <ul className="divide-y divide-blush/40">
          {accounts.map((a) => {
            const Icon = kindIcon[a.kind];
            const owner = memberName(a.member_id);
            return (
              <li key={a.id} className="flex items-center justify-between gap-3 py-3">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="grid h-9 w-9 shrink-0 place-items-center rounded-2xl bg-blush-soft text-rose-deep">
                    <Icon size={16} />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-medium text-plum-ink">{a.label}</p>
                    <p className="text-xs text-plum-soft">
                      {kindLabel[a.kind]} · {owner ?? 'Shared / joint'} · as of {formatDate(a.as_of_date)}
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <span className={`tnum font-semibold ${a.current_balance < 0 ? 'text-coral-deep' : 'text-plum-ink'}`}>
                    {formatCurrency(a.current_balance)}
                  </span>
                  <button
                    onClick={() => openEdit(a)}
                    aria-label={`Edit ${a.label}`}
                    className="rounded-full p-1.5 text-plum-soft hover:bg-blush hover:text-plum"
                  >
                    <Pencil size={15} />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <Modal
        open={editing !== null}
        onClose={() => setEditing(null)}
        title={isNew ? 'Add account' : 'Edit account'}
        footer={
          editing && (
            <div className="flex items-center justify-between gap-3">
              {!isNew ? (
                <Button variant="ghost" onClick={() => askRemove(editing)} className="text-coral-deep">
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
                  Save account
                </Button>
              </div>
            </div>
          )
        }
      >
        {editing && (
          <div className="space-y-4">
            <Input
              label="Account name"
              value={editing.label}
              onChange={(e) => setEditing({ ...editing, label: e.target.value })}
              placeholder="e.g. Capitec Savings"
            />
            <Select
              label="Account type"
              value={editing.kind}
              onChange={(e) => setEditing({ ...editing, kind: e.target.value as AccountKind })}
            >
              <option value="cheque">Cheque / Current</option>
              <option value="credit">Credit Card</option>
              <option value="savings">Savings</option>
              <option value="other">Other</option>
            </Select>
            <Select
              label="Belongs to"
              value={editing.member_id ?? ''}
              onChange={(e) => setEditing({ ...editing, member_id: e.target.value || null })}
            >
              <option value="">Shared / joint</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </Select>
            <Input
              label="Current balance (R)"
              type="number"
              value={editing.current_balance}
              onChange={(e) => setEditing({ ...editing, current_balance: Number(e.target.value) })}
            />
            <Input
              label="As of date"
              type="date"
              value={editing.as_of_date}
              onChange={(e) => setEditing({ ...editing, as_of_date: e.target.value })}
            />
            {editing.kind === 'savings' && (
              <p className="rounded-2xl bg-blush-soft/60 px-4 py-3 text-xs text-plum-soft">
                Savings balances are shown on the dashboard but aren't counted in Safe to Spend, which is
                based on cheque/current account cash.
              </p>
            )}
          </div>
        )}
      </Modal>

      <Modal
        open={pendingRemove !== null}
        onClose={() => setPendingRemove(null)}
        title="Remove account?"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setPendingRemove(null)}>
              Cancel
            </Button>
            <Button variant="warning" onClick={confirmRemove}>
              <Trash2 size={16} /> Remove permanently
            </Button>
          </div>
        }
      >
        {pendingRemove && pendingCounts && (
          <div className="flex items-start gap-3">
            <div className="rounded-full bg-coral/15 p-2 text-coral-deep">
              <AlertTriangle size={18} />
            </div>
            <p className="text-sm text-plum">
              This will permanently delete <strong className="text-plum-ink">{pendingRemove.label}</strong>
              {pendingCounts.commitments + pendingCounts.transactions + pendingCounts.income > 0 ? (
                <>
                  {' '}
                  and everything linked to it:{' '}
                  {[
                    pendingCounts.transactions > 0 && `${pendingCounts.transactions} transaction${pendingCounts.transactions === 1 ? '' : 's'}`,
                    pendingCounts.commitments > 0 && `${pendingCounts.commitments} commitment${pendingCounts.commitments === 1 ? '' : 's'}`,
                    pendingCounts.income > 0 && `${pendingCounts.income} income source${pendingCounts.income === 1 ? '' : 's'}`,
                  ]
                    .filter(Boolean)
                    .join(', ')}
                  . This can't be undone.
                </>
              ) : (
                ". It isn't linked to any transactions, commitments or income sources yet, so nothing else will be affected."
              )}
            </p>
          </div>
        )}
      </Modal>
    </Card>
  );
}
