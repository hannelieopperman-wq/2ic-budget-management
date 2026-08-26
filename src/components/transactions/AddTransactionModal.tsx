import { useEffect, useMemo, useState } from 'react';
import { Info, Link2 } from 'lucide-react';
import { Modal, Button, Select, Input } from '../ui';
import { useApp } from '../../store/AppStore';
import { matchRule } from '../../utils/mapping';
import { cleanMerchant } from '../../utils/merchant';
import { cycleBoundsFor } from '../../utils/cycle';
import { formatCurrency } from '../../utils/currency';
import type { Transaction, Direction } from '../../types/budget';

export function AddTransactionModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { accounts, pools, rules, commitments, cycles, activeCycleId, addTransaction } = useApp();

  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [accountId, setAccountId] = useState(accounts[0]?.id ?? '');
  const [description, setDescription] = useState('');
  const [direction, setDirection] = useState<Direction>('out');
  const [amount, setAmount] = useState(0);
  const [poolId, setPoolId] = useState('');
  const [commitmentId, setCommitmentId] = useState('');
  const [adjustBalance, setAdjustBalance] = useState(true);

  // Reset the form fresh each time it's opened.
  useEffect(() => {
    if (!open) return;
    setDate(new Date().toISOString().slice(0, 10));
    setAccountId(accounts[0]?.id ?? '');
    setDescription('');
    setDirection('out');
    setAmount(0);
    setPoolId('');
    setCommitmentId('');
    setAdjustBalance(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const candidateCommitments = useMemo(
    () => commitments.filter((c) => c.account_id === accountId && !c.paid),
    [commitments, accountId],
  );

  // Suggest a pool from existing rules as the description is typed, the same
  // way import mapping would — the user can always override it.
  useEffect(() => {
    if (!description.trim() || poolId || commitmentId) return;
    const rule = matchRule({ description }, rules);
    if (rule) setPoolId(rule.pool_id);
  }, [description, rules, poolId, commitmentId]);

  const selectedCommitment = commitments.find((c) => c.id === commitmentId);
  const selectedAccount = accounts.find((a) => a.id === accountId);

  const canSave = accountId && description.trim() && amount > 0;

  const save = () => {
    if (!canSave || !selectedAccount) return;
    const signedAmount = direction === 'out' ? -Math.abs(amount) : Math.abs(amount);
    const bounds = cycleBoundsFor(date);
    const cycle =
      cycles.find((c) => c.start_date === bounds.start) ?? cycles.find((c) => c.id === activeCycleId);

    const tx: Transaction = {
      id: `manual_${Date.now()}`,
      date,
      account_id: accountId,
      description: description.trim(),
      merchant: cleanMerchant(description.trim()) || description.trim(),
      amount: signedAmount,
      pool_id: selectedCommitment ? selectedCommitment.pool_id : poolId || null,
      cycle: cycle?.id ?? bounds.start,
      direction,
      mapped_by: selectedCommitment ? 'commitment' : poolId ? 'manual' : null,
      commitment_id: selectedCommitment?.id,
    };

    addTransaction(tx, adjustBalance);
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add transaction"
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={save} disabled={!canSave}>
            Save
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <p className="flex items-start gap-2 rounded-2xl bg-blush-soft/60 px-4 py-3 text-xs text-plum-soft">
          <Info size={14} className="mt-0.5 shrink-0" />
          For anything you can't get from a bank CSV — cash, informal transfers, anything off-statement.
        </p>

        <Input label="Date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />

        <Select label="Account" value={accountId} onChange={(e) => setAccountId(e.target.value)}>
          {accounts.map((a) => (
            <option key={a.id} value={a.id}>
              {a.label}
            </option>
          ))}
        </Select>

        <Input
          label="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="e.g. Cash payment to plumber"
        />

        <div className="grid grid-cols-2 gap-3">
          <Select label="Direction" value={direction} onChange={(e) => setDirection(e.target.value as Direction)}>
            <option value="out">Money out</option>
            <option value="in">Money in</option>
          </Select>
          <Input
            label="Amount (R)"
            type="number"
            min={0}
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
          />
        </div>

        {candidateCommitments.length > 0 && (
          <Select label="Is this paying a commitment?" value={commitmentId} onChange={(e) => setCommitmentId(e.target.value)}>
            <option value="">No — just assign to a pool</option>
            {candidateCommitments.map((c) => (
              <option key={c.id} value={c.id}>
                {c.item} ({formatCurrency(c.amount)})
              </option>
            ))}
          </Select>
        )}

        {selectedCommitment ? (
          <p className="flex items-start gap-2 rounded-2xl bg-sage/15 px-4 py-3 text-xs text-sage-deep">
            <Link2 size={14} className="mt-0.5 shrink-0" />
            This will mark "{selectedCommitment.item}" as paid.
          </p>
        ) : (
          <Select label="Pool" value={poolId} onChange={(e) => setPoolId(e.target.value)}>
            <option value="">Unmapped</option>
            {pools
              .slice()
              .sort((a, b) => a.sort_order - b.sort_order)
              .map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
          </Select>
        )}

        <label className="flex items-start gap-3 rounded-2xl bg-blush-soft/60 px-4 py-3">
          <input
            type="checkbox"
            checked={adjustBalance}
            onChange={(e) => setAdjustBalance(e.target.checked)}
            className="mt-0.5 h-4 w-4 accent-plum"
          />
          <span className="text-sm text-plum">
            Update {selectedAccount?.label ?? 'account'}'s balance
            <span className="mt-0.5 block text-xs text-plum-soft">
              Applies this amount straight to the account balance, since there's no bank statement to read it from.
            </span>
          </span>
        </label>
      </div>
    </Modal>
  );
}
