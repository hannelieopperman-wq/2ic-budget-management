import { useState } from 'react';
import { Plus, Pencil, Trash2, GripVertical } from 'lucide-react';
import { AppShell } from '../components/layout/AppShell';
import { PoolCard } from '../components/dashboard/PoolCard';
import { Button, Card, Modal, Input, Select, EmptyState, Badge } from '../components/ui';
import { useApp } from '../store/AppStore';
import { useCycleData } from '../hooks/useCycleData';
import { totalAllocated, unallocated } from '../utils/calculations';
import { INCOME_PLACEHOLDER, formatCurrency } from '../utils/currency';
import type { Pool, PoolType } from '../types/budget';

const emptyPool = (): Pool => ({
  id: crypto.randomUUID(),
  name: '',
  type: 'variable',
  monthly_budget: 0,
  reserve_as_essential: false,
  sort_order: 99,
  member_id: null,
});

export function Pools() {
  const { pools, members, activeCycle, addPool, updatePoolEntry, removePool, reorderPools } = useApp();
  const { poolViews, incomeExpected } = useCycleData();
  const [editing, setEditing] = useState<Pool | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [dragId, setDragId] = useState<string | null>(null);

  const memberName = (id: string | null) => (id ? members.find((m) => m.id === id)?.name : null);

  const allocated = totalAllocated(pools);
  const unalloc = unallocated(incomeExpected, pools);

  const openNew = () => {
    setEditing(emptyPool());
    setIsNew(true);
  };
  const openEdit = (p: Pool) => {
    setEditing({ ...p });
    setIsNew(false);
  };
  const save = () => {
    if (!editing || !editing.name.trim()) return;
    if (isNew) addPool({ ...editing, sort_order: pools.length + 1 });
    else updatePoolEntry(editing);
    setEditing(null);
  };

  const onDrop = (targetId: string) => {
    if (!dragId || dragId === targetId) return;
    const ordered = [...poolViews.map((v) => v.pool)];
    const from = ordered.findIndex((p) => p.id === dragId);
    const to = ordered.findIndex((p) => p.id === targetId);
    const [moved] = ordered.splice(from, 1);
    ordered.splice(to, 0, moved);
    reorderPools(ordered.map((p, i) => ({ ...p, sort_order: i + 1 })));
    setDragId(null);
  };

  return (
    <AppShell title="Pools" subtitle={activeCycle.label}>
      {/* Allocation summary */}
      <Card className="mb-5 p-6 animate-slide-up">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-plum-soft">Expected income</p>
            <p className="tnum mt-1 font-serif text-xl text-plum-ink">{INCOME_PLACEHOLDER}</p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-plum-soft">Total allocated</p>
            <p className="tnum mt-1 font-serif text-xl text-plum-ink">{formatCurrency(allocated)}</p>
          </div>
          <div className="col-span-2 sm:col-span-1">
            <p className="text-xs font-medium uppercase tracking-wide text-plum-soft">
              {unalloc >= 0 ? 'Unallocated' : 'Over-allocated by'}
            </p>
            <p className={`tnum mt-1 font-serif text-xl ${unalloc < 0 ? 'text-coral-deep' : 'text-sage-deep'}`}>
              {formatCurrency(Math.abs(unalloc))}
            </p>
          </div>
        </div>
        <p className="mt-3 text-xs text-plum-soft">
          Unallocated is expected income minus the sum of your pool budgets. Income shown masked.
        </p>
      </Card>

      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-serif text-xl text-plum-ink">Your pools</h2>
        <Button variant="primary" onClick={openNew}>
          <Plus size={16} /> Add pool
        </Button>
      </div>

      {poolViews.length === 0 ? (
        <EmptyState title="No pools yet" message="Create your first envelope to start budgeting." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {poolViews.map((view, i) => (
            <div
              key={view.pool.id}
              draggable
              onDragStart={() => setDragId(view.pool.id)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => onDrop(view.pool.id)}
              className={`group relative transition ${dragId === view.pool.id ? 'opacity-50' : ''}`}
            >
              <PoolCard view={view} index={i} />
              {memberName(view.pool.member_id) && (
                <div className="absolute left-3 top-3">
                  <Badge tone="blush">{memberName(view.pool.member_id)}</Badge>
                </div>
              )}
              <div className="absolute right-3 top-3 flex gap-1 opacity-0 transition group-hover:opacity-100">
                <button
                  onClick={() => openEdit(view.pool)}
                  aria-label={`Edit ${view.pool.name}`}
                  className="rounded-full bg-cream/90 p-1.5 text-plum-soft shadow-soft hover:text-plum"
                >
                  <Pencil size={14} />
                </button>
                <span className="cursor-grab rounded-full bg-cream/90 p-1.5 text-plum-soft shadow-soft" aria-hidden>
                  <GripVertical size={14} />
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={editing !== null}
        onClose={() => setEditing(null)}
        title={isNew ? 'Add pool' : 'Edit pool'}
        footer={
          editing && (
            <div className="flex items-center justify-between gap-3">
              {!isNew ? (
                <Button
                  variant="ghost"
                  onClick={() => {
                    removePool(editing.id);
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
                  Save pool
                </Button>
              </div>
            </div>
          )
        }
      >
        {editing && (
          <div className="space-y-4">
            <Input
              label="Pool name"
              value={editing.name}
              onChange={(e) => setEditing({ ...editing, name: e.target.value })}
              placeholder="e.g. Groceries"
            />
            <Input
              label="Monthly budget (R)"
              type="number"
              value={editing.monthly_budget}
              onChange={(e) => setEditing({ ...editing, monthly_budget: Number(e.target.value) })}
            />
            <Select
              label="Type"
              value={editing.type}
              onChange={(e) => setEditing({ ...editing, type: e.target.value as PoolType })}
            >
              <option value="variable">Variable</option>
              <option value="fixed">Fixed-driven</option>
              <option value="excluded">Excluded</option>
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
            <label className="flex items-center gap-3 rounded-2xl bg-blush-soft/60 px-4 py-3">
              <input
                type="checkbox"
                checked={editing.reserve_as_essential}
                onChange={(e) => setEditing({ ...editing, reserve_as_essential: e.target.checked })}
                className="h-4 w-4 accent-plum"
              />
              <span className="text-sm text-plum">
                Reserve as essential
                <span className="block text-xs text-plum-soft">
                  Remaining budget is held back from safe-to-spend. Best for ongoing spending (Groceries,
                  Petrol) — if this pool is really just one commitment (rent, insurance), that commitment
                  is already reserved on its own, so marking the pool essential too would reserve it twice.
                </span>
              </span>
            </label>
          </div>
        )}
      </Modal>
    </AppShell>
  );
}
