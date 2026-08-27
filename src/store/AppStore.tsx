import {
  createContext,
  useContext,
  useState,
  useMemo,
  useCallback,
  useEffect,
  type ReactNode,
  type Dispatch,
  type SetStateAction,
} from 'react';
import type { Session } from '@supabase/supabase-js';
import type {
  Household,
  Member,
  Pool,
  Commitment,
  Rule,
  Transaction,
  Account,
  Cycle,
  IncomeSource,
  SavingsEntry,
  MappedBy,
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
import { supabase, isSupabaseConfigured } from '../services/supabase';
import * as dataService from '../services/dataService';
import { toISO, findCycleFor } from '../utils/cycle';

// ---------------------------------------------------------------------------
// Application store. In mock mode (no .env) this behaves exactly as Phase 1
// did: synchronous in-memory arrays seeded from mockData, a fake `login()`.
// In Supabase mode, real auth drives a fetch-on-login effect, and every
// mutation is optimistic-then-persisted (apply locally immediately, await the
// real write, roll back just that one array on failure).
// ---------------------------------------------------------------------------

interface AppState {
  authed: boolean;
  authLoading: boolean;
  dataLoading: boolean;
  /** Mock-mode-only sign in (no real credential check). No-ops in Supabase mode. */
  login: () => void;
  logout: () => void;

  household: Household | null;
  members: Member[];
  householdName: string;
  setHouseholdName: (name: string) => void;
  /** Data URL or Storage public URL of the household photo/logo, or null for the default mark. */
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
  commitImport: (
    txs: Transaction[],
    accountUpdate?: { accountId: string; balance: number; asOfDate: string } | null,
  ) => void;
  addTransaction: (tx: Transaction, adjustAccountBalance: boolean) => void;
}

const AppContext = createContext<AppState | null>(null);

// ---- small optimistic-CRUD helpers (module-level: no component state needed) --

async function optimisticAdd<T extends { id: string }>(
  setter: Dispatch<SetStateAction<T[]>>,
  item: T,
  persist: (item: T) => Promise<void>,
) {
  setter((prev) => [...prev, item]);
  try {
    await persist(item);
  } catch (e) {
    console.error(e);
    setter((prev) => prev.filter((x) => x.id !== item.id));
  }
}

async function optimisticUpdate<T extends { id: string }>(
  setter: Dispatch<SetStateAction<T[]>>,
  item: T,
  persist: (item: T) => Promise<void>,
) {
  let prevItem: T | undefined;
  setter((prev) => {
    prevItem = prev.find((x) => x.id === item.id);
    return prev.map((x) => (x.id === item.id ? item : x));
  });
  try {
    await persist(item);
  } catch (e) {
    console.error(e);
    if (prevItem) {
      const restore = prevItem;
      setter((prev) => prev.map((x) => (x.id === item.id ? restore : x)));
    }
  }
}

async function optimisticRemove<T extends { id: string }>(
  setter: Dispatch<SetStateAction<T[]>>,
  id: string,
  persist: (id: string) => Promise<void>,
) {
  let prevItem: T | undefined;
  setter((prev) => {
    prevItem = prev.find((x) => x.id === id);
    return prev.filter((x) => x.id !== id);
  });
  try {
    await persist(id);
  } catch (e) {
    console.error(e);
    if (prevItem) {
      const restore = prevItem;
      setter((prev) => [...prev, restore]);
    }
  }
}

async function optimisticReorder<T>(
  setter: Dispatch<SetStateAction<T[]>>,
  next: T[],
  persist: (items: T[]) => Promise<void>,
) {
  let prev: T[] = [];
  setter((p) => {
    prev = p;
    return next;
  });
  try {
    await persist(next);
  } catch (e) {
    console.error(e);
    setter(prev);
  }
}

export function AppProvider({ children }: { children: ReactNode }) {
  // ---- auth ----------------------------------------------------------------
  const [session, setSession] = useState<Session | null>(null);
  const [mockAuthed, setMockAuthed] = useState(false);
  const [authLoading, setAuthLoading] = useState(isSupabaseConfigured);
  const authed = isSupabaseConfigured ? session !== null : mockAuthed;

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    let mounted = true;
    supabase!.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      setAuthLoading(false);
    });
    const { data: sub } = supabase!.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });
    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const login = useCallback(() => {
    if (!isSupabaseConfigured) setMockAuthed(true);
  }, []);
  const logout = useCallback(() => {
    if (isSupabaseConfigured) supabase!.auth.signOut();
    else setMockAuthed(false);
  }, []);

  // ---- entity state ----------------------------------------------------------
  const [household, setHousehold] = useState<Household | null>(
    isSupabaseConfigured ? null : { id: 'mock', name: DEFAULT_HOUSEHOLD_NAME, avatar_url: null },
  );
  const [members, setMembers] = useState<Member[]>(isSupabaseConfigured ? [] : mockMembers);
  const [pools, setPools] = useState<Pool[]>(isSupabaseConfigured ? [] : mockPools);
  const [commitments, setCommitments] = useState<Commitment[]>(isSupabaseConfigured ? [] : mockCommitments);
  const [rules, setRules] = useState<Rule[]>(isSupabaseConfigured ? [] : mockRules);
  const [transactions, setTransactions] = useState<Transaction[]>(isSupabaseConfigured ? [] : mockTransactions);
  const [accounts, setAccounts] = useState<Account[]>(isSupabaseConfigured ? [] : mockAccounts);
  const [cycles, setCycles] = useState<Cycle[]>(isSupabaseConfigured ? [] : mockCycles);
  const [incomeSources, setIncomeSources] = useState<IncomeSource[]>(
    isSupabaseConfigured ? [] : mockIncomeSources,
  );
  const [savingsEntries, setSavingsEntries] = useState<SavingsEntry[]>(
    isSupabaseConfigured ? [] : mockSavingsEntries,
  );
  const [activeCycleId, setActiveCycleId] = useState<string>(isSupabaseConfigured ? '' : DEFAULT_CYCLE_ID);
  const [activeMemberId, setActiveMemberId] = useState<string>(ALL_MEMBERS);
  // Derived (not independently-tracked) so there's no window where a stale
  // "not loading" value can outlive the session it was computed for — see the
  // fetch effect below. Recomputed fresh every render from session + this id.
  const [loadedForUserId, setLoadedForUserId] = useState<string | null>(null);
  const dataLoading = isSupabaseConfigured && session !== null && loadedForUserId !== session.user.id;

  const householdName = household?.name ?? DEFAULT_HOUSEHOLD_NAME;
  const householdAvatarUrl = household?.avatar_url ?? null;

  const setHouseholdName = useCallback((name: string) => {
    setHousehold((prev) => (prev ? { ...prev, name } : prev));
    dataService.updateHousehold({ name }).catch((e) => console.error(e));
  }, []);
  const setHouseholdAvatarUrl = useCallback((url: string | null) => {
    setHousehold((prev) => (prev ? { ...prev, avatar_url: url } : prev));
    dataService.updateHousehold({ avatar_url: url }).catch((e) => console.error(e));
  }, []);

  // ---- fetch-on-login / reset-on-logout --------------------------------------
  useEffect(() => {
    if (!isSupabaseConfigured) return; // mock mode: arrays already seeded, nothing to fetch

    if (!session) {
      setMembers([]);
      setPools([]);
      setCommitments([]);
      setRules([]);
      setTransactions([]);
      setAccounts([]);
      setCycles([]);
      setIncomeSources([]);
      setSavingsEntries([]);
      setHousehold(null);
      setActiveCycleId('');
      dataService.clearCachedHouseholdId();
      setLoadedForUserId(null);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const householdId = await dataService.getCurrentHouseholdId();
        await dataService.ensureCyclesExist(householdId);
        const [
          householdData,
          membersData,
          poolsData,
          commitmentsData,
          rulesData,
          transactionsData,
          accountsData,
          cyclesData,
          incomeSourcesData,
          savingsData,
        ] = await Promise.all([
          dataService.getHousehold(),
          dataService.getMembers(),
          dataService.getPools(),
          dataService.getCommitments(),
          dataService.getRules(),
          dataService.getTransactions(),
          dataService.getAccounts(),
          dataService.getCycles(),
          dataService.getIncomeSources(),
          dataService.getSavingsEntries(),
        ]);
        if (cancelled) return;
        setHousehold(householdData);
        setMembers(membersData);
        setPools(poolsData);
        setCommitments(commitmentsData);
        setRules(rulesData);
        setTransactions(transactionsData);
        setAccounts(accountsData);
        setCycles(cyclesData);
        setIncomeSources(incomeSourcesData);
        setSavingsEntries(savingsData);
        const current = findCycleFor(toISO(new Date()), cyclesData);
        setActiveCycleId(current?.id ?? cyclesData[0]?.id ?? '');
      } catch (e) {
        console.error(e);
      } finally {
        // Mark this session's load done even on failure — surfacing whatever
        // partial/empty state resulted beats leaving the app stuck loading
        // forever behind the gate in App.tsx.
        if (!cancelled) setLoadedForUserId(session.user.id);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [session]);

  const activeCycle = useMemo(
    () => cycles.find((c) => c.id === activeCycleId) ?? cycles[0],
    [cycles, activeCycleId],
  );

  // ---- simple CRUD mutations (optimistic, persisted via dataService) --------

  const addRule = useCallback((rule: Rule) => optimisticAdd(setRules, rule, dataService.addRule), []);
  const updateRule = useCallback((rule: Rule) => optimisticUpdate(setRules, rule, dataService.updateRule), []);
  const deleteRuleById = useCallback((id: string) => optimisticRemove(setRules, id, dataService.removeRule), []);
  const reorderRules = useCallback(
    (next: Rule[]) => optimisticReorder(setRules, next, dataService.reorderRules),
    [],
  );

  const addPool = useCallback((pool: Pool) => optimisticAdd(setPools, pool, dataService.addPool), []);
  const updatePoolEntry = useCallback(
    (pool: Pool) => optimisticUpdate(setPools, pool, dataService.updatePool),
    [],
  );
  const removePool = useCallback((id: string) => optimisticRemove(setPools, id, dataService.removePool), []);
  const reorderPools = useCallback(
    (next: Pool[]) => optimisticReorder(setPools, next, dataService.reorderPools),
    [],
  );

  const addCommitment = useCallback(
    (c: Commitment) => optimisticAdd(setCommitments, c, dataService.addCommitment),
    [],
  );
  const updateCommitment = useCallback(
    (c: Commitment) => optimisticUpdate(setCommitments, c, dataService.updateCommitment),
    [],
  );
  const removeCommitment = useCallback(
    (id: string) => optimisticRemove(setCommitments, id, dataService.removeCommitment),
    [],
  );

  const addIncomeSource = useCallback(
    (s: IncomeSource) => optimisticAdd(setIncomeSources, s, dataService.addIncomeSource),
    [],
  );
  const updateIncomeSource = useCallback(
    (s: IncomeSource) => optimisticUpdate(setIncomeSources, s, dataService.updateIncomeSource),
    [],
  );
  const removeIncomeSource = useCallback(
    (id: string) => optimisticRemove(setIncomeSources, id, dataService.removeIncomeSource),
    [],
  );

  const addSavingsEntry = useCallback(
    (e: SavingsEntry) => optimisticAdd(setSavingsEntries, e, dataService.addSavingsEntry),
    [],
  );
  const updateSavingsEntry = useCallback(
    (e: SavingsEntry) => optimisticUpdate(setSavingsEntries, e, dataService.updateSavingsEntry),
    [],
  );
  const removeSavingsEntry = useCallback(
    (id: string) => optimisticRemove(setSavingsEntries, id, dataService.removeSavingsEntry),
    [],
  );

  const updateAccount = useCallback(
    (account: Account) => optimisticUpdate(setAccounts, account, dataService.updateAccount),
    [],
  );
  const addAccount = useCallback(
    (account: Account) => optimisticAdd(setAccounts, account, dataService.addAccount),
    [],
  );

  const addMember = useCallback((member: Member) => optimisticAdd(setMembers, member, dataService.addMember), []);
  const updateMember = useCallback(
    (member: Member) => optimisticUpdate(setMembers, member, dataService.updateMember),
    [],
  );

  // ---- mutations with cross-cutting effects ---------------------------------

  const removeMember = useCallback(
    async (id: string) => {
      let prevMember: Member | undefined;
      setMembers((prev) => {
        prevMember = prev.find((m) => m.id === id);
        return prev.filter((m) => m.id !== id);
      });
      if (activeMemberId === id) setActiveMemberId(ALL_MEMBERS);
      try {
        await dataService.removeMember(id);
        // The DB sets member_id -> null (shared/joint) on any pool/account that
        // pointed at this member — mirror that locally instead of waiting for
        // a refetch to show them as un-orphaned.
        setPools((prev) => prev.map((p) => (p.member_id === id ? { ...p, member_id: null } : p)));
        setAccounts((prev) => prev.map((a) => (a.member_id === id ? { ...a, member_id: null } : a)));
      } catch (e) {
        console.error(e);
        if (prevMember) {
          const restore = prevMember;
          setMembers((prev) => [...prev, restore]);
        }
      }
    },
    [activeMemberId],
  );

  const removeAccount = useCallback(async (id: string) => {
    let prevAccount: Account | undefined;
    setAccounts((prev) => {
      prevAccount = prev.find((a) => a.id === id);
      return prev.filter((a) => a.id !== id);
    });
    // The DB cascades-deletes commitments/transactions/income sources tied to
    // this account — mirror that locally so the UI matches immediately.
    setCommitments((prev) => prev.filter((c) => c.account_id !== id));
    setTransactions((prev) => prev.filter((t) => t.account_id !== id));
    setIncomeSources((prev) => prev.filter((s) => s.account_id !== id));
    try {
      await dataService.removeAccount(id);
    } catch (e) {
      console.error(e);
      // A full cascade rollback isn't worth the complexity for this rare
      // failure path — restore the account itself; a refresh resyncs the rest.
      if (prevAccount) {
        const restore = prevAccount;
        setAccounts((prev) => [...prev, restore]);
      }
    }
  }, []);

  const reassignTransaction = useCallback(
    async (txId: string, poolId: string | null, commitmentId?: string) => {
      const mappedBy: MappedBy = commitmentId ? 'commitment' : poolId ? 'manual' : null;
      let prevTx: Transaction | undefined;
      setTransactions((prev) => {
        prevTx = prev.find((t) => t.id === txId);
        return prev.map((t) =>
          t.id === txId ? { ...t, pool_id: poolId, mapped_by: mappedBy, commitment_id: commitmentId } : t,
        );
      });
      let prevCommitment: Commitment | undefined;
      if (commitmentId) {
        setCommitments((prev) => {
          prevCommitment = prev.find((c) => c.id === commitmentId);
          return prev.map((c) => (c.id === commitmentId ? { ...c, paid: true } : c));
        });
      }
      try {
        if (prevTx) {
          await dataService.updateTransaction({
            ...prevTx,
            pool_id: poolId,
            mapped_by: mappedBy,
            commitment_id: commitmentId,
          });
        }
        if (commitmentId && prevCommitment) {
          await dataService.updateCommitment({ ...prevCommitment, paid: true });
        }
      } catch (e) {
        console.error(e);
        if (prevTx) {
          const restore = prevTx;
          setTransactions((prev) => prev.map((t) => (t.id === txId ? restore : t)));
        }
        if (commitmentId && prevCommitment) {
          const restore = prevCommitment;
          setCommitments((prev) => prev.map((c) => (c.id === commitmentId ? restore : c)));
        }
      }
    },
    [],
  );

  const commitImport = useCallback(
    async (
      txs: Transaction[],
      accountUpdate?: { accountId: string; balance: number; asOfDate: string } | null,
    ) => {
      const paidIds = [...new Set(txs.map((t) => t.commitment_id).filter((id): id is string => Boolean(id)))];
      setTransactions((prev) => [...txs, ...prev]);
      if (paidIds.length > 0) {
        setCommitments((prev) => prev.map((c) => (paidIds.includes(c.id) ? { ...c, paid: true } : c)));
      }
      if (accountUpdate) {
        setAccounts((prev) =>
          prev.map((a) =>
            a.id === accountUpdate.accountId
              ? { ...a, current_balance: accountUpdate.balance, as_of_date: accountUpdate.asOfDate }
              : a,
          ),
        );
      }
      try {
        await dataService.commitImportBulk(txs, paidIds, accountUpdate ?? null);
      } catch (e) {
        console.error(e);
        setTransactions((prev) => prev.filter((t) => !txs.some((x) => x.id === t.id)));
      }
    },
    [],
  );

  /**
   * Manually log a single transaction — the "no CSV available" fallback
   * (cash, informal transfers, anything outside a bank export). Unlike
   * import, this also optionally nudges the account balance directly by the
   * transaction amount, since there's no bank statement balance to read.
   */
  const addTransaction = useCallback(async (tx: Transaction, adjustAccountBalance: boolean) => {
    setTransactions((prev) => [tx, ...prev]);
    let prevCommitment: Commitment | undefined;
    if (tx.commitment_id) {
      setCommitments((prev) => {
        prevCommitment = prev.find((c) => c.id === tx.commitment_id);
        return prev.map((c) => (c.id === tx.commitment_id ? { ...c, paid: true } : c));
      });
    }
    let prevAccount: Account | undefined;
    if (adjustAccountBalance) {
      setAccounts((prev) => {
        prevAccount = prev.find((a) => a.id === tx.account_id);
        return prev.map((a) =>
          a.id === tx.account_id
            ? { ...a, current_balance: a.current_balance + tx.amount, as_of_date: tx.date }
            : a,
        );
      });
    }
    try {
      await dataService.addTransaction(tx);
      if (tx.commitment_id && prevCommitment) {
        await dataService.updateCommitment({ ...prevCommitment, paid: true });
      }
      if (adjustAccountBalance && prevAccount) {
        await dataService.updateAccount({
          ...prevAccount,
          current_balance: prevAccount.current_balance + tx.amount,
          as_of_date: tx.date,
        });
      }
    } catch (e) {
      console.error(e);
      setTransactions((prev) => prev.filter((t) => t.id !== tx.id));
      if (prevCommitment) {
        const restore = prevCommitment;
        setCommitments((prev) => prev.map((c) => (c.id === tx.commitment_id ? restore : c)));
      }
      if (prevAccount) {
        const restore = prevAccount;
        setAccounts((prev) => prev.map((a) => (a.id === tx.account_id ? restore : a)));
      }
    }
  }, []);

  const value: AppState = {
    authed,
    authLoading,
    dataLoading,
    login,
    logout,
    household,
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
    activeCycle: activeCycle as Cycle,
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
