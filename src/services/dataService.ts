import type {
  Pool,
  Commitment,
  Rule,
  Transaction,
  Account,
  Cycle,
  IncomeSource,
} from '../types/budget';
import {
  mockPools,
  mockCommitments,
  mockRules,
  mockTransactions,
  mockAccounts,
  mockCycles,
  mockIncomeSources,
} from '../data/mockData';

// ---------------------------------------------------------------------------
// Service layer. Today it operates against in-memory mock state (no permanent
// persistence). In Phase 2 each function body is replaced with a Supabase call
// while keeping the same signatures, so the UI stays unchanged.
//
// These are the placeholder functions the spec asks for. They resolve async to
// mirror the eventual network shape.
// ---------------------------------------------------------------------------

const clone = <T,>(v: T): T => JSON.parse(JSON.stringify(v));

export async function getPools(): Promise<Pool[]> {
  return clone(mockPools);
}
export async function getCommitments(): Promise<Commitment[]> {
  return clone(mockCommitments);
}
export async function getRules(): Promise<Rule[]> {
  return clone(mockRules);
}
export async function getTransactions(): Promise<Transaction[]> {
  return clone(mockTransactions);
}
export async function getAccounts(): Promise<Account[]> {
  return clone(mockAccounts);
}
export async function getCycles(): Promise<Cycle[]> {
  return clone(mockCycles);
}
export async function getIncomeSources(): Promise<IncomeSource[]> {
  return clone(mockIncomeSources);
}

// Write placeholders — these mutate in-memory state via the store, not a DB.
// They exist so Phase 2 has a clear seam. The React store owns actual state.
export async function savePool(pool: Pool): Promise<Pool> {
  return pool;
}
export async function updatePool(pool: Pool): Promise<Pool> {
  return pool;
}
export async function saveTransaction(tx: Transaction): Promise<Transaction> {
  return tx;
}
export async function updateTransaction(tx: Transaction): Promise<Transaction> {
  return tx;
}
export async function saveRule(rule: Rule): Promise<Rule> {
  return rule;
}
export async function deleteRule(id: string): Promise<{ id: string }> {
  return { id };
}
export async function saveIncomeSource(source: IncomeSource): Promise<IncomeSource> {
  return source;
}
