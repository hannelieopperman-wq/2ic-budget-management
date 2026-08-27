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
  DEFAULT_HOUSEHOLD_NAME,
} from '../data/mockData';
import { supabase, isSupabaseConfigured } from './supabase';
import { cycleBoundsFor, toISO, parseISO, formatDayMonth } from '../utils/cycle';

// ---------------------------------------------------------------------------
// Service layer. When Supabase isn't configured (local dev with no .env),
// every function below falls back to the original in-memory mock behaviour.
// When it is configured, each function talks to the real database, scoped to
// the signed-in household via RLS (household_id = auth.uid()).
//
// Two real field-name mismatches between the app's TS types and the DB's
// snake_case columns are handled here, at this seam, so nothing above this
// layer needs to know about them: Transaction.cycle <-> cycle_id, and
// Member.avatarUrl <-> avatar_url. Every numeric column is also explicitly
// coerced with Number(...): Postgres `numeric` columns often round-trip as
// strings, which would otherwise silently become R 0,00 in the UI (see
// currency.ts's Number.isFinite guards).
// ---------------------------------------------------------------------------

const clone = <T,>(v: T): T => JSON.parse(JSON.stringify(v));
const toNum = (v: unknown): number => Number(v ?? 0);

// ---- current household id (cached for the session's lifetime) ------------

let cachedHouseholdId: string | null = null;

export function clearCachedHouseholdId(): void {
  cachedHouseholdId = null;
}

export async function getCurrentHouseholdId(): Promise<string> {
  if (cachedHouseholdId) return cachedHouseholdId;
  const { data, error } = await supabase!.auth.getUser();
  if (error || !data.user) throw error ?? new Error('Not signed in');
  cachedHouseholdId = data.user.id;
  return cachedHouseholdId;
}

// ---- generic per-table CRUD (used for entities with no name mismatch) ----

function makeTable<T extends { id: string }>(
  table: string,
  fromDb: (row: Record<string, unknown>) => T,
  toDb: (item: T, householdId: string) => Record<string, unknown>,
) {
  return {
    async list(orderColumn?: string, ascending = true): Promise<T[]> {
      let query = supabase!.from(table).select('*');
      if (orderColumn) query = query.order(orderColumn, { ascending });
      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []).map(fromDb);
    },
    async add(item: T): Promise<void> {
      const householdId = await getCurrentHouseholdId();
      const { error } = await supabase!.from(table).insert(toDb(item, householdId));
      if (error) throw error;
    },
    async update(item: T): Promise<void> {
      const householdId = await getCurrentHouseholdId();
      const { error } = await supabase!.from(table).update(toDb(item, householdId)).eq('id', item.id);
      if (error) throw error;
    },
    async remove(id: string): Promise<void> {
      const { error } = await supabase!.from(table).delete().eq('id', id);
      if (error) throw error;
    },
    async upsertMany(items: T[]): Promise<void> {
      const householdId = await getCurrentHouseholdId();
      const { error } = await supabase!.from(table).upsert(
        items.map((i) => toDb(i, householdId)),
        { onConflict: 'id' },
      );
      if (error) throw error;
    },
  };
}

// ---- adapters --------------------------------------------------------------

function fromDbMember(r: Record<string, any>): Member {
  return { id: r.id, name: r.name, color: r.color, avatarUrl: r.avatar_url };
}
function toDbMember(m: Member, householdId: string) {
  return { id: m.id, name: m.name, color: m.color, avatar_url: m.avatarUrl, household_id: householdId };
}

function fromDbPool(r: Record<string, any>): Pool {
  return {
    id: r.id,
    name: r.name,
    type: r.type,
    monthly_budget: toNum(r.monthly_budget),
    reserve_as_essential: r.reserve_as_essential,
    sort_order: r.sort_order,
    member_id: r.member_id,
  };
}
function toDbPool(p: Pool, householdId: string) {
  return { ...p, household_id: householdId };
}

function fromDbCommitment(r: Record<string, any>): Commitment {
  return {
    id: r.id,
    item: r.item,
    pool_id: r.pool_id,
    account_id: r.account_id,
    search_term: r.search_term,
    amount: toNum(r.amount),
    day_of_month: r.day_of_month,
    paid: r.paid,
  };
}
function toDbCommitment(c: Commitment, householdId: string) {
  return { ...c, paid: c.paid ?? false, household_id: householdId };
}

function fromDbRule(r: Record<string, any>): Rule {
  return { id: r.id, priority: r.priority, search_term: r.search_term, pool_id: r.pool_id };
}
function toDbRule(r: Rule, householdId: string) {
  return { ...r, household_id: householdId };
}

function fromDbAccount(r: Record<string, any>): Account {
  return {
    id: r.id,
    label: r.label,
    kind: r.kind,
    current_balance: toNum(r.current_balance),
    as_of_date: r.as_of_date,
    member_id: r.member_id,
  };
}
function toDbAccount(a: Account, householdId: string) {
  return { ...a, household_id: householdId };
}

function fromDbCycle(r: Record<string, any>): Cycle {
  return {
    id: r.id,
    label: r.label,
    start_date: r.start_date,
    end_date: r.end_date,
    income_expected: toNum(r.income_expected),
    income_received: toNum(r.income_received),
  };
}

function fromDbIncomeSource(r: Record<string, any>): IncomeSource {
  return {
    id: r.id,
    label: r.label,
    amount_expected: toNum(r.amount_expected),
    day_of_month: r.day_of_month,
    recurring: r.recurring,
    account_id: r.account_id,
  };
}
function toDbIncomeSource(s: IncomeSource, householdId: string) {
  return { ...s, household_id: householdId };
}

function fromDbSavingsEntry(r: Record<string, any>): SavingsEntry {
  return {
    id: r.id,
    account_id: r.account_id,
    cycle_id: r.cycle_id,
    contribution: toNum(r.contribution),
    closing_balance: toNum(r.closing_balance),
  };
}
function toDbSavingsEntry(s: SavingsEntry, householdId: string) {
  return { ...s, household_id: householdId };
}

function fromDbTransaction(r: Record<string, any>): Transaction {
  return {
    id: r.id,
    date: r.date,
    account_id: r.account_id,
    description: r.description,
    merchant: r.merchant,
    amount: toNum(r.amount),
    pool_id: r.pool_id,
    cycle: r.cycle_id,
    direction: r.direction,
    mapped_by: r.mapped_by,
    commitment_id: r.commitment_id ?? undefined,
  };
}
function toDbTransaction(t: Transaction, householdId: string) {
  const { cycle, ...rest } = t;
  return { ...rest, cycle_id: cycle, household_id: householdId };
}

// ---- household ---------------------------------------------------------

export async function getHousehold(): Promise<Household> {
  if (!isSupabaseConfigured) return { id: 'mock', name: DEFAULT_HOUSEHOLD_NAME, avatar_url: null };
  const householdId = await getCurrentHouseholdId();
  const { data, error } = await supabase!.from('households').select('*').eq('id', householdId).single();
  if (error) throw error;
  return { id: data.id, name: data.name, avatar_url: data.avatar_url };
}

export async function updateHousehold(patch: Partial<Pick<Household, 'name' | 'avatar_url'>>): Promise<void> {
  if (!isSupabaseConfigured) return;
  const householdId = await getCurrentHouseholdId();
  const { error } = await supabase!.from('households').update(patch).eq('id', householdId);
  if (error) throw error;
}

// ---- members -------------------------------------------------------------

const membersTable = makeTable<Member>('members', fromDbMember, toDbMember);
export const getMembers = (): Promise<Member[]> =>
  isSupabaseConfigured ? membersTable.list() : Promise.resolve(clone(mockMembers));
export const addMember = (m: Member): Promise<void> => (isSupabaseConfigured ? membersTable.add(m) : Promise.resolve());
export const updateMember = (m: Member): Promise<void> =>
  isSupabaseConfigured ? membersTable.update(m) : Promise.resolve();
export const removeMember = (id: string): Promise<void> =>
  isSupabaseConfigured ? membersTable.remove(id) : Promise.resolve();

// ---- pools -----------------------------------------------------------------

const poolsTable = makeTable<Pool>('pools', fromDbPool, toDbPool);
export const getPools = (): Promise<Pool[]> =>
  isSupabaseConfigured ? poolsTable.list('sort_order') : Promise.resolve(clone(mockPools));
export const addPool = (p: Pool): Promise<void> => (isSupabaseConfigured ? poolsTable.add(p) : Promise.resolve());
export const updatePool = (p: Pool): Promise<void> => (isSupabaseConfigured ? poolsTable.update(p) : Promise.resolve());
export const removePool = (id: string): Promise<void> =>
  isSupabaseConfigured ? poolsTable.remove(id) : Promise.resolve();
export const reorderPools = (pools: Pool[]): Promise<void> =>
  isSupabaseConfigured ? poolsTable.upsertMany(pools) : Promise.resolve();

// ---- commitments -------------------------------------------------------------

const commitmentsTable = makeTable<Commitment>('commitments', fromDbCommitment, toDbCommitment);
export const getCommitments = (): Promise<Commitment[]> =>
  isSupabaseConfigured ? commitmentsTable.list() : Promise.resolve(clone(mockCommitments));
export const addCommitment = (c: Commitment): Promise<void> =>
  isSupabaseConfigured ? commitmentsTable.add(c) : Promise.resolve();
export const updateCommitment = (c: Commitment): Promise<void> =>
  isSupabaseConfigured ? commitmentsTable.update(c) : Promise.resolve();
export const removeCommitment = (id: string): Promise<void> =>
  isSupabaseConfigured ? commitmentsTable.remove(id) : Promise.resolve();

// ---- rules -------------------------------------------------------------------

const rulesTable = makeTable<Rule>('rules', fromDbRule, toDbRule);
export const getRules = (): Promise<Rule[]> =>
  isSupabaseConfigured ? rulesTable.list('priority') : Promise.resolve(clone(mockRules));
export const addRule = (r: Rule): Promise<void> => (isSupabaseConfigured ? rulesTable.add(r) : Promise.resolve());
export const updateRule = (r: Rule): Promise<void> => (isSupabaseConfigured ? rulesTable.update(r) : Promise.resolve());
export const removeRule = (id: string): Promise<void> =>
  isSupabaseConfigured ? rulesTable.remove(id) : Promise.resolve();
export const reorderRules = (rules: Rule[]): Promise<void> =>
  isSupabaseConfigured ? rulesTable.upsertMany(rules) : Promise.resolve();

// ---- accounts ------------------------------------------------------------

const accountsTable = makeTable<Account>('accounts', fromDbAccount, toDbAccount);
export const getAccounts = (): Promise<Account[]> =>
  isSupabaseConfigured ? accountsTable.list() : Promise.resolve(clone(mockAccounts));
export const addAccount = (a: Account): Promise<void> =>
  isSupabaseConfigured ? accountsTable.add(a) : Promise.resolve();
export const updateAccount = (a: Account): Promise<void> =>
  isSupabaseConfigured ? accountsTable.update(a) : Promise.resolve();
export const removeAccount = (id: string): Promise<void> =>
  isSupabaseConfigured ? accountsTable.remove(id) : Promise.resolve();

// ---- income sources --------------------------------------------------------

const incomeSourcesTable = makeTable<IncomeSource>('income_sources', fromDbIncomeSource, toDbIncomeSource);
export const getIncomeSources = (): Promise<IncomeSource[]> =>
  isSupabaseConfigured ? incomeSourcesTable.list() : Promise.resolve(clone(mockIncomeSources));
export const addIncomeSource = (s: IncomeSource): Promise<void> =>
  isSupabaseConfigured ? incomeSourcesTable.add(s) : Promise.resolve();
export const updateIncomeSource = (s: IncomeSource): Promise<void> =>
  isSupabaseConfigured ? incomeSourcesTable.update(s) : Promise.resolve();
export const removeIncomeSource = (id: string): Promise<void> =>
  isSupabaseConfigured ? incomeSourcesTable.remove(id) : Promise.resolve();

// ---- savings entries -----------------------------------------------------

const savingsTable = makeTable<SavingsEntry>('savings_entries', fromDbSavingsEntry, toDbSavingsEntry);
export const getSavingsEntries = (): Promise<SavingsEntry[]> =>
  isSupabaseConfigured ? savingsTable.list() : Promise.resolve(clone(mockSavingsEntries));
export const addSavingsEntry = (s: SavingsEntry): Promise<void> =>
  isSupabaseConfigured ? savingsTable.add(s) : Promise.resolve();
export const updateSavingsEntry = (s: SavingsEntry): Promise<void> =>
  isSupabaseConfigured ? savingsTable.update(s) : Promise.resolve();
export const removeSavingsEntry = (id: string): Promise<void> =>
  isSupabaseConfigured ? savingsTable.remove(id) : Promise.resolve();

// ---- cycles ----------------------------------------------------------------

export async function getCycles(): Promise<Cycle[]> {
  if (!isSupabaseConfigured) return clone(mockCycles);
  const { data, error } = await supabase!.from('cycles').select('*').order('start_date', { ascending: true });
  if (error) throw error;
  return (data ?? []).map(fromDbCycle);
}

async function ensureCycleRange(householdId: string, bounds: { start: string; end: string }): Promise<void> {
  const { data, error } = await supabase!
    .from('cycles')
    .select('id')
    .eq('household_id', householdId)
    .eq('start_date', bounds.start)
    .maybeSingle();
  if (error) throw error;
  if (data) return;
  const label = `${formatDayMonth(bounds.start)} → ${formatDayMonth(bounds.end)}`;
  const { error: insertError } = await supabase!.from('cycles').insert({
    id: crypto.randomUUID(),
    household_id: householdId,
    label,
    start_date: bounds.start,
    end_date: bounds.end,
    income_expected: 0,
    income_received: 0,
  });
  if (insertError) throw insertError;
}

/** Make sure a cycle row covering today (and the one after it) exists before the app tries to use them. */
export async function ensureCyclesExist(householdId: string): Promise<void> {
  if (!isSupabaseConfigured) return;
  const todayISO = toISO(new Date());
  const current = cycleBoundsFor(todayISO);
  const nextStart = new Date(parseISO(current.end).getTime() + 86_400_000);
  const next = cycleBoundsFor(toISO(nextStart));
  await ensureCycleRange(householdId, current);
  await ensureCycleRange(householdId, next);
}

// ---- transactions ----------------------------------------------------------

/** Fetches every transaction, paginated — CSV import's duplicate/rule/commitment
 * matching needs the complete set in memory, however large the household's history. */
export async function getTransactions(): Promise<Transaction[]> {
  if (!isSupabaseConfigured) return clone(mockTransactions);
  const pageSize = 1000;
  let from = 0;
  const all: Record<string, any>[] = [];
  for (;;) {
    const { data, error } = await supabase!
      .from('transactions')
      .select('*')
      .order('date', { ascending: false })
      .range(from, from + pageSize - 1);
    if (error) throw error;
    all.push(...(data ?? []));
    if (!data || data.length < pageSize) break;
    from += pageSize;
  }
  return all.map(fromDbTransaction);
}

export async function addTransaction(tx: Transaction): Promise<void> {
  if (!isSupabaseConfigured) return;
  const householdId = await getCurrentHouseholdId();
  const { error } = await supabase!.from('transactions').insert(toDbTransaction(tx, householdId));
  if (error) throw error;
}

export async function updateTransaction(tx: Transaction): Promise<void> {
  if (!isSupabaseConfigured) return;
  const householdId = await getCurrentHouseholdId();
  const { error } = await supabase!.from('transactions').update(toDbTransaction(tx, householdId)).eq('id', tx.id);
  if (error) throw error;
}

/**
 * The CSV import write chain, as one sequenced unit: bulk-insert every
 * non-duplicate row, bulk-flip any commitments they paid, then (optionally)
 * update the account balance from the CSV's own balance column. Three
 * network calls regardless of import size.
 */
export async function commitImportBulk(
  txs: Transaction[],
  paidCommitmentIds: string[],
  accountUpdate: { accountId: string; balance: number; asOfDate: string } | null,
): Promise<void> {
  if (!isSupabaseConfigured) return;
  const householdId = await getCurrentHouseholdId();
  if (txs.length > 0) {
    const { error } = await supabase!.from('transactions').insert(txs.map((t) => toDbTransaction(t, householdId)));
    if (error) throw error;
  }
  if (paidCommitmentIds.length > 0) {
    const { error } = await supabase!.from('commitments').update({ paid: true }).in('id', paidCommitmentIds);
    if (error) throw error;
  }
  if (accountUpdate) {
    const { error } = await supabase!
      .from('accounts')
      .update({ current_balance: accountUpdate.balance, as_of_date: accountUpdate.asOfDate })
      .eq('id', accountUpdate.accountId);
    if (error) throw error;
  }
}

// ---- avatar uploads (Supabase Storage) -------------------------------------

async function uploadAvatar(path: string, file: File): Promise<string> {
  const { error } = await supabase!.storage.from('avatars').upload(path, file, { upsert: true });
  if (error) throw error;
  const { data } = supabase!.storage.from('avatars').getPublicUrl(path);
  return data.publicUrl;
}

export async function uploadHouseholdAvatar(file: File): Promise<string> {
  const householdId = await getCurrentHouseholdId();
  const ext = file.name.split('.').pop() || 'jpg';
  return uploadAvatar(`${householdId}/household.${ext}`, file);
}

export async function uploadMemberAvatar(memberId: string, file: File): Promise<string> {
  const householdId = await getCurrentHouseholdId();
  const ext = file.name.split('.').pop() || 'jpg';
  return uploadAvatar(`${householdId}/members/${memberId}.${ext}`, file);
}
