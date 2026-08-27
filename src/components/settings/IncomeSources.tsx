import { useState } from 'react';
import { Plus, Pencil, Trash2, Wallet } from 'lucide-react';
import { Button, Card, Modal, Input, Select, EmptyState } from '../ui';
import { useApp } from '../../store/AppStore';
import type { IncomeSource } from '../../types/budget';

const emptySource = (accountId: string): IncomeSource => ({
  id: crypto.randomUUID(),
  label: '',
  amount_expected: 0,
  day_of_month: 25,
  recurring: true,
  account_id: accountId,
});

export function IncomeSources() {
  const { incomeSources, accounts, addIncomeSource, updateIncomeSource, removeIncomeSource } = useApp();
  const [editing, setEditing] = useState<IncomeSource | null>(null);
  const [isNew, setIsNew] = useState(false);

  const accountName = (id: string) => accounts.find((a) => a.id === id)?.label ?? 'Unknown account';

  const openNew = () => {
    setEditing(emptySource(accounts[0]?.id ?? ''));
    setIsNew(true);
  };
  const openEdit = (s: IncomeSource) => {
    setEditing({ ...s });
    setIsNew(false);
  };
  const save = () => {
    if (!editing || !editing.label.trim()) return;
    if (isNew) addIncomeSource(editing);
    else updateIncomeSource(editing);
    setEditing(null);
  };

  return (
    <Card className="p-6 animate-slide-up">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-serif text-lg text-plum-ink">Income sources</h2>
        <Button variant="primary" onClick={openNew}>
          <Plus size={16} /> Add source
        </Button>
      </div>

      {incomeSources.length === 0 ? (
        <EmptyState title="No income sources" message="Add your salary or other income to get started." icon={<Wallet size={26} />} />
      ) : (
        <ul className="divide-y divide-blush/40">
          {incomeSources.map((s) => (
            <li key={s.id} className="flex items-center justify-between gap-3 py-3">
              <div className="min-w-0">
                <p className="font-medium text-plum-ink">{s.label}</p>
                <p className="text-xs text-plum-soft">
                  Day {s.day_of_month} · {accountName(s.account_id)} · {s.recurring ? 'Recurring' : 'Once-off'}
                </p>
              </div>
              <div className="flex shrink-0 gap-1">
                <button
                  onClick={() => openEdit(s)}
                  aria-label={`Edit ${s.label}`}
                  className="rounded-full p-1.5 text-plum-soft hover:bg-blush hover:text-plum"
                >
                  <Pencil size={15} />
                </button>
                <button
                  onClick={() => removeIncomeSource(s.id)}
                  aria-label={`Remove ${s.label}`}
                  className="rounded-full p-1.5 text-plum-soft hover:bg-coral/15 hover:text-coral-deep"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Modal
        open={editing !== null}
        onClose={() => setEditing(null)}
        title={isNew ? 'Add income source' : 'Edit income source'}
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setEditing(null)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={save}>
              Save
            </Button>
          </div>
        }
      >
        {editing && (
          <div className="space-y-4">
            <Input
              label="Label"
              value={editing.label}
              onChange={(e) => setEditing({ ...editing, label: e.target.value })}
              placeholder="e.g. Salary"
            />
            <Input
              label="Expected amount (R)"
              type="number"
              value={editing.amount_expected}
              onChange={(e) => setEditing({ ...editing, amount_expected: Number(e.target.value) })}
            />
            <Input
              label="Expected day of month"
              type="number"
              min={1}
              max={31}
              value={editing.day_of_month}
              onChange={(e) => setEditing({ ...editing, day_of_month: Number(e.target.value) })}
            />
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
                checked={editing.recurring}
                onChange={(e) => setEditing({ ...editing, recurring: e.target.checked })}
                className="h-4 w-4 accent-plum"
              />
              <span className="text-sm text-plum">Recurring each cycle</span>
            </label>
          </div>
        )}
      </Modal>
    </Card>
  );
}
