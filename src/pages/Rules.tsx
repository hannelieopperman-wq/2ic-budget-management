import { useState } from 'react';
import { Plus, Pencil, Trash2, GripVertical, ListOrdered, Info } from 'lucide-react';
import { AppShell } from '../components/layout/AppShell';
import { Button, Card, Modal, Input, Select, EmptyState, Badge } from '../components/ui';
import { useApp } from '../store/AppStore';
import type { Rule } from '../types/budget';

export function Rules() {
  const { rules, pools, addRule, updateRule, deleteRuleById, reorderRules } = useApp();
  const [editing, setEditing] = useState<Rule | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [dragId, setDragId] = useState<string | null>(null);

  const poolName = (id: string) => pools.find((p) => p.id === id)?.name ?? 'Unknown pool';
  const ordered = [...rules].sort((a, b) => a.priority - b.priority);

  const openNew = () => {
    setEditing({ id: `rule_${Date.now()}`, priority: rules.length + 1, search_term: '', pool_id: pools[0]?.id ?? '' });
    setIsNew(true);
  };
  const openEdit = (r: Rule) => {
    setEditing({ ...r });
    setIsNew(false);
  };
  const save = () => {
    if (!editing || !editing.search_term.trim()) return;
    if (isNew) addRule(editing);
    else updateRule(editing);
    setEditing(null);
  };

  const onDrop = (targetId: string) => {
    if (!dragId || dragId === targetId) return;
    const list = [...ordered];
    const from = list.findIndex((r) => r.id === dragId);
    const to = list.findIndex((r) => r.id === targetId);
    const [moved] = list.splice(from, 1);
    list.splice(to, 0, moved);
    reorderRules(list.map((r, i) => ({ ...r, priority: i + 1 })));
    setDragId(null);
  };

  return (
    <AppShell title="Rules" subtitle={`${rules.length} automatic mapping rules`}>
      <Card className="mb-4 flex items-start gap-3 bg-blush-soft/60 p-4 animate-slide-up">
        <Info size={18} className="mt-0.5 shrink-0 text-rose-deep" />
        <p className="text-sm text-plum">
          Rules are evaluated from lowest priority number to highest. The first matching rule wins. Search terms don't
          need to be unique — a more specific term can sit above a broader one.
        </p>
      </Card>

      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-serif text-xl text-plum-ink">Priority order</h2>
        <Button variant="primary" onClick={openNew}>
          <Plus size={16} /> Add rule
        </Button>
      </div>

      {ordered.length === 0 ? (
        <EmptyState
          title="No rules yet"
          message="Your automatic mapping rules will appear here."
          icon={<ListOrdered size={26} />}
        />
      ) : (
        <Card className="divide-y divide-blush/40 overflow-hidden p-0 animate-slide-up">
          {ordered.map((r) => (
            <div
              key={r.id}
              draggable
              onDragStart={() => setDragId(r.id)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => onDrop(r.id)}
              className={`flex items-center gap-3 px-4 py-3 transition hover:bg-blush-soft/40 ${dragId === r.id ? 'opacity-50' : ''}`}
            >
              <span className="cursor-grab text-plum-soft/50" aria-hidden>
                <GripVertical size={16} />
              </span>
              <span className="tnum grid h-7 w-7 shrink-0 place-items-center rounded-full bg-plum/8 text-xs font-semibold text-plum">
                {r.priority}
              </span>
              <span className="min-w-0 flex-1 truncate font-mono text-sm text-plum-ink">{r.search_term}</span>
              <Badge tone="blush">{poolName(r.pool_id)}</Badge>
              <div className="flex shrink-0 gap-1">
                <button
                  onClick={() => openEdit(r)}
                  aria-label={`Edit rule ${r.search_term}`}
                  className="rounded-full p-1.5 text-plum-soft hover:bg-blush hover:text-plum"
                >
                  <Pencil size={15} />
                </button>
                <button
                  onClick={() => deleteRuleById(r.id)}
                  aria-label={`Delete rule ${r.search_term}`}
                  className="rounded-full p-1.5 text-plum-soft hover:bg-coral/15 hover:text-coral-deep"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </Card>
      )}

      <Modal
        open={editing !== null}
        onClose={() => setEditing(null)}
        title={isNew ? 'Add rule' : 'Edit rule'}
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setEditing(null)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={save}>
              Save rule
            </Button>
          </div>
        }
      >
        {editing && (
          <div className="space-y-4">
            <Input
              label="Search term"
              value={editing.search_term}
              onChange={(e) => setEditing({ ...editing, search_term: e.target.value })}
              placeholder="e.g. WOOLWORTHS"
              className="font-mono"
            />
            <Select
              label="Map to pool"
              value={editing.pool_id}
              onChange={(e) => setEditing({ ...editing, pool_id: e.target.value })}
            >
              {pools.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </Select>
            <Input
              label="Priority"
              type="number"
              value={editing.priority}
              onChange={(e) => setEditing({ ...editing, priority: Number(e.target.value) })}
            />
          </div>
        )}
      </Modal>
    </AppShell>
  );
}
