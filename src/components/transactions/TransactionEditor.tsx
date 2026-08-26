import { useMemo, useState } from 'react';
import { Info, Link2 } from 'lucide-react';
import { Modal, Button, Select } from '../ui';
import { useApp } from '../../store/AppStore';
import { ruleFromReassignment } from '../../utils/mapping';
import { formatCurrency } from '../../utils/currency';
import { formatDate } from '../../utils/cycle';
import type { Transaction } from '../../types/budget';

export function TransactionEditor({ tx, onClose }: { tx: Transaction | null; onClose: () => void }) {
  const { pools, rules, accounts, commitments, reassignTransaction, addRule, updateCommitment } = useApp();
  const [poolId, setPoolId] = useState<string>('');
  const [saveAsRule, setSaveAsRule] = useState(false);
  const [term, setTerm] = useState('');
  const [commitmentId, setCommitmentId] = useState<string>('');

  const accountLabel = tx ? accounts.find((a) => a.id === tx.account_id)?.label ?? 'Unknown account' : '';

  const activePools = pools.slice().sort((a, b) => a.sort_order - b.sort_order);

  // Unpaid commitments on the same account — the realistic candidates for
  // "this transaction is actually paying that commitment".
  const candidateCommitments = useMemo(() => {
    if (!tx) return [];
    return commitments.filter((c) => c.account_id === tx.account_id && !c.paid);
  }, [tx, commitments]);

  const save = () => {
    if (!tx) return;

    if (commitmentId) {
      const commitment = commitments.find((c) => c.id === commitmentId);
      if (commitment) {
        // Remember this wording so future statements auto-match this commitment.
        const alreadyMatches = tx.description.toLowerCase().includes(commitment.search_term.toLowerCase());
        if (!alreadyMatches) {
          updateCommitment({ ...commitment, search_term: tx.merchant.toUpperCase(), paid: true });
        }
        reassignTransaction(tx.id, commitment.pool_id, commitment.id);
      }
      reset();
      return;
    }

    const chosen = poolId || tx.pool_id || null;
    reassignTransaction(tx.id, chosen);
    if (saveAsRule && chosen && term.trim()) {
      addRule(ruleFromReassignment(term.trim(), chosen, rules));
    }
    reset();
  };

  const reset = () => {
    setPoolId('');
    setSaveAsRule(false);
    setTerm('');
    setCommitmentId('');
    onClose();
  };

  return (
    <Modal
      open={tx !== null}
      onClose={reset}
      title="Reassign transaction"
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={reset}>
            Cancel
          </Button>
          <Button variant="primary" onClick={save}>
            Save
          </Button>
        </div>
      }
    >
      {tx && (
        <div className="space-y-4">
          <div className="rounded-2xl bg-blush-soft/60 p-4">
            <div className="flex items-center justify-between">
              <p className="font-medium text-plum-ink">{tx.merchant}</p>
              <p className="tnum font-semibold text-plum-ink">{formatCurrency(tx.amount)}</p>
            </div>
            <p className="mt-1 text-xs text-plum-soft">{formatDate(tx.date)} · {accountLabel}</p>
            <p className="mt-2 break-words rounded-xl bg-white/60 px-3 py-2 text-xs text-plum-soft">{tx.description}</p>
          </div>

          {candidateCommitments.length > 0 && (
            <Select
              label="Is this paying a commitment?"
              value={commitmentId}
              onChange={(e) => setCommitmentId(e.target.value)}
            >
              <option value="">No — just assign to a pool</option>
              {candidateCommitments.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.item} ({formatCurrency(c.amount)})
                </option>
              ))}
            </Select>
          )}

          {commitmentId ? (
            <p className="flex items-start gap-2 rounded-2xl bg-sage/15 px-4 py-3 text-xs text-sage-deep">
              <Link2 size={14} className="mt-0.5 shrink-0" />
              This will mark "{commitments.find((c) => c.id === commitmentId)?.item}" as paid and remember
              this wording so future bank statements match it automatically.
            </p>
          ) : (
            <>
              <Select
                label="Assign to pool"
                value={poolId || tx.pool_id || ''}
                onChange={(e) => {
                  setPoolId(e.target.value);
                  if (!term) setTerm(tx.merchant);
                }}
              >
                <option value="">Unmapped</option>
                {activePools.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </Select>

              <label className="flex items-start gap-3 rounded-2xl bg-blush-soft/60 px-4 py-3">
                <input
                  type="checkbox"
                  checked={saveAsRule}
                  onChange={(e) => {
                    setSaveAsRule(e.target.checked);
                    if (e.target.checked && !term) setTerm(tx.merchant);
                  }}
                  className="mt-0.5 h-4 w-4 accent-plum"
                />
                <span className="text-sm text-plum">
                  Save as rule
                  <span className="mt-0.5 flex items-center gap-1 text-xs text-plum-soft">
                    <Info size={12} /> This will affect how future imports are mapped.
                  </span>
                </span>
              </label>

              {saveAsRule && (
                <div className="animate-slide-up">
                  <label className="block">
                    <span className="mb-1.5 block text-sm font-medium text-plum-soft">Rule search term</span>
                    <input
                      value={term}
                      onChange={(e) => setTerm(e.target.value)}
                      className="w-full rounded-2xl border border-blush bg-white/70 px-4 py-3 text-plum-ink focus:border-rose focus:outline-none focus:ring-2 focus:ring-rose/30"
                      placeholder="e.g. WOOLWORTHS"
                    />
                  </label>
                  <p className="mt-1.5 text-xs text-plum-soft">
                    Matched case-insensitively against the raw description on future imports.
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </Modal>
  );
}
