import { createContext, useContext, useState, useMemo, useCallback, type ReactNode } from 'react';
import type {
  Member,
  Pool,
  Commitment,
  Rule,
  Transaction,
  Account,
  Cycle,
  IncomeSource,
  SavingsEntry,
} from '../types/budget';
import {
  mockMembers,
  mockPools,
  mockCommitments,
  mockRules,
  mockTransactions,
  mockAccounts,
  mockCycles,
  mockIncomeSources,
  mockSavingsEntries,
  DEFAULT_CYCLE_ID,
  DEFAULT_HOUSEHOLD_NAME,
} from '../data/mockData';
import { ALL_MEMBERS } from '../utils/members';

// ---------------------------------------------------------------------------
// In-memory application store. Holds all entities plus the active cycle,
// active household-member view, and a mock auth flag. No permanent
// persistence (Phase 2 replaces this seam).
// ---------------------------------------------------------------------------

interface AppState {
  authed: boolean;
  login: () => void;
  logout: () => void;

  members: Member[];
  householdName: string;
  setHouseholdName: (name: string) => void;
  /** Data URL of an uploaded household photo/logo, or null to use the default mark. */
  householdAvatarUrl: string | null;
  setHouseholdAvatarUrl: (url: string | null) => void;
  pools: Pool[];
  commitments: Commitment[];
  rules: Rule[];
  transactions: Transaction[];
  accounts: Account[];
  cycles: Cycle[];
  incomeSources: IncomeSource[];
  savingsEntries: SavingsEntry[];

  activeCycleId: string;
  setActiveCycleId: (id: string) => void;
  activeCycle: Cycle;

  /** 'all' (combined household view) or a specific Member.id. */
  activeMemberId: string;
  setActiveMemberId: (id: string) => void;

  // mutations
  reassignTransaction: (txId: string, poolId: string | null, commitmentId?: string) => void;
  addRule: (rule: Rule) => void;
  updateRule: (rule: Rule) => void;
  deleteRuleById: (id: string) => void;
  reorderRules: (rules: Rule[]) => void;
  addPool: (pool: Pool) => void;
  updatePoolEntry: (pool: Pool) => void;
  removePool: (id: string) => void;
  reorderPools: (pools: Pool[]) => void;
  addCommitment: (commitment: Commitment) => void;
  updateCommitment: (commitment: Commitment) => void;
  removeCommitment: (id: string) => void;
  addIncomeSource: (source: IncomeSource) => void;
  updateIncomeSource: (source: IncomeSource) => void;
  removeIncomeSource: (id: string) => void;
  addSavingsEntry: (entry: SavingsEntry) => void;
  updateSavingsEntry: (entry: SavingsEntry) => void;
  removeSavingsEntry: (id: string) => void;
  updateAccount: (account: Account) => void;
  addAccount: (account: Account) => void;
  removeAccount: (id: string) => void;
  addMember: (member: Member) => void;
  updateMember: (member: Member) => void;
  removeMember: (id: string) => void;
  commitImport: (txs: Transaction[]) => void;
  addTransaction: (tx: Transaction, adjustAccountBalance: boolean) => void;
}

const AppContext = createContext<AppState | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [authed, setAuthed] = useState(false);
  const [members, setMembers] = useState<Member[]>(mockMembers);
  const [householdName, setHouseholdName] = useState<string>(DEFAULT_HOUSEHOLD_NAME);
  const [householdAvatarUrl, setHouseholdAvatarUrl] = useState<string | null>(null);
  const [pools, setPools] = useState<Pool[]>(mockPools);
  const [commitments, setCommitments] = useState<Commitment[]>(mockCommitments);
  const [rules, setRules] = useState<Rule[]>(mockRules);
  const [transactions, setTransactions] = useState<Transaction[]>(mockTransactions);
  const [accounts, setAccounts] = useState<Account[]>(mockAccounts);
  const [cycles] = useState<Cycle[]>(mockCycles);
  const [incomeSources, setIncomeSources] = useState<IncomeSource[]>(mockIncomeSources);
  const [savingsEntries, setSavingsEntries] = useState<SavingsEntry[]>(mockSavingsEntries);
  const [activeCycleId, setActiveCycleId] = useState<string>(DEFAULT_CYCLE_ID);
  const [activeMemberId, setActiveMemberId] = useState<string>(ALL_MEMBERS);

  const activeCycle = useMemo(
    () => cycles.find((c) => c.id === activeCycleId) ?? cycles[0],
    [cycles, activeCycleId],
  );

  const reassignTransaction = useCallback((txId: string, poolId: string | null, commitmentId?: string) => {
    setTransactions((prev) =>
      prev.map((t) =>
        t.id === txId
          ? {
              ...t,
              pool_id: poolId,
              mapped_by: commitmentId ? 'commitment' : poolId ? 'manual' : null,
              commitment_id: commitmentId,
            }
          : t,
      ),
    );
    if (commitmentId) {
      setCommitments((prev) => prev.map((c) => (c.id === commitmentId ? { ...c, paid: true } : c)));
    }
  }, []);

  const addRule = useCallback((rule: Rule) => setRules((prev) => [...prev, rule]), []);
  const updateRule = useCallback(
    (rule: Rule) => setRules((prev) => prev.map((r) => (r.id === rule.id ? rule : r))),
    [],
  );
  const deleteRuleById = useCallback((id: string) => setRules((prev) => prev.filter((r) => r.id !== id)), []);
  const reorderRules = useCallback((next: Rule[]) => setRules(next), []);

  const addPool = useCallback((pool: Pool) => setPools((prev) => [...prev, pool]), []);
  const updatePoolEntry = useCallback(
    (pool: Pool) => setPools((prev) => prev.map((p) => (p.id === pool.id ? pool : p))),
    [],
  );
  const removePool = useCallback((id: string) => setPools((prev) => prev.filter((p) => p.id !== id)), []);
  const reorderPools = useCallback((next: Pool[]) => setPools(next), []);

  const addCommitment = useCallback((c: Commitment) => setCommitments((prev) => [...prev, c]), []);
  const updateCommitment = useCallback(
    (c: Commitment) => setCommitments((prev) => prev.map((x) => (x.id === c.id ? c : x))),
    [],
  );
  const removeCommitment = useCallback((id: string) => setCommitments((prev) => prev.filter((c) => c.id !== id)), []);

  const addIncomeSource = useCallback((s: IncomeSource) => setIncomeSources((prev) => [...prev, s]), []);
  const updateIncomeSource = useCallback(
    (s: IncomeSource) => setIncomeSources((prev) => prev.map((x) => (x.id === s.id ? s : x))),
    [],
  );
  const removeIncomeSource = useCallback(
    (id: string) => setIncomeSources((prev) => prev.filter((x) => x.id !== id)),
    [],
  );

  const addSavingsEntry = useCallback((e: SavingsEntry) => setSavingsEntries((prev) => [...prev, e]), []);
  const updateSavingsEntry = useCallback(
    (e: SavingsEntry) => setSavingsEntries((prev) => prev.map((x) => (x.id === e.id ? e : x))),
    [],
  );
  const removeSavingsEntry = useCallback(
    (id: string) => setSavingsEntries((prev) => prev.filter((x) => x.id !== id)),
    [],
  );

  const updateAccount = useCallback(
    (account: Account) => setAccounts((prev) => prev.map((a) => (a.id === account.id ? account : a))),
    [],
  );
  const addAccount = useCallback((account: Account) => setAccounts((prev) => [...prev, account]), []);
  const removeAccount = useCallback((id: string) => setAccounts((prev) => prev.filter((a) => a.id !== id)), []);

  const addMember = useCallback((member: Member) => setMembers((prev) => [...prev, member]), []);
  const updateMember = useCallback(
    (member: Member) => setMembers((prev) => prev.map((m) => (m.id === member.id ? member : m))),
    [],
  );
  const removeMember = useCallback(
    (id: string) => {
      setMembers((prev) => prev.filter((m) => m.id !== id));
      if (activeMemberId === id) setActiveMemberId(ALL_MEMBERS);
    },
    [activeMemberId],
  );

  const commitImport = useCallback((txs: Transaction[]) => {
    setTransactions((prev) => [...txs, ...prev]);
    // Any transaction the import engine matched to a commitment should flip
    // that commitment to paid — this is what makes "still to go off" accurate
    // straight after import, without a manual step.
    const paidIds = new Set(txs.map((t) => t.commitment_id).filter((id): id is string => Boolean(id)));
    if (paidIds.size > 0) {
      setCommitments((prev) => prev.map((c) => (paidIds.has(c.id) ? { ...c, paid: true } : c)));
    }
  }, []);

  /**
   * Manually log a single transaction — the "no CSV available" fallback
   * (cash, informal transfers, anything outside a bank export). Unlike
   * import, this also optionally nudges the account balance directly by the
   * transaction amount, since there's no bank statement balance to read.
   */
  const addTransaction = useCallback((tx: Transaction, adjustAccountBalance: boolean) => {
    setTransactions((prev) => [tx, ...prev]);
    if (tx.commitment_id) {
      setCommitments((prev) => prev.map((c) => (c.id === tx.commitment_id ? { ...c, paid: true } : c)));
    }
    if (adjustAccountBalance) {
      setAccounts((prev) =>
        prev.map((a) =>
          a.id === tx.account_id
            ? { ...a, current_balance: a.current_balance + tx.amount, as_of_date: tx.date }
            : a,
        ),
      );
    }
  }, []);

  const value: AppState = {
    authed,
    login: () => setAuthed(true),
    logout: () => setAuthed(false),
    members,
    householdName,
    setHouseholdName,
    householdAvatarUrl,
    setHouseholdAvatarUrl,
    pools,
    commitments,
    rules,
    transactions,
    accounts,
    cycles,
    incomeSources,
    savingsEntries,
    activeCycleId,
    setActiveCycleId,
    activeCycle,
    activeMemberId,
    setActiveMemberId,
    reassignTransaction,
    addRule,
    updateRule,
    deleteRuleById,
    reorderRules,
    addPool,
    updatePoolEntry,
    removePool,
    reorderPools,
    addCommitment,
    updateCommitment,
    removeCommitment,
    addIncomeSource,
    updateIncomeSource,
    removeIncomeSource,
    addSavingsEntry,
    updateSavingsEntry,
    removeSavingsEntry,
    updateAccount,
    addAccount,
    removeAccount,
    addMember,
    updateMember,
    removeMember,
    commitImport,
    addTransaction,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useApp(): AppState {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
