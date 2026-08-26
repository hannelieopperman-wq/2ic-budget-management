// ---------------------------------------------------------------------------
// Domain types for the envelope-budget app.
// These mirror the intended Supabase tables so Phase 2 can map cleanly.
// ---------------------------------------------------------------------------

export type AccountKind = 'cheque' | 'credit' | 'savings' | 'other';

export type PoolType = 'variable' | 'fixed' | 'excluded';

export type MappedBy = 'commitment' | 'rule' | 'manual' | null;

export type Direction = 'in' | 'out';

/**
 * A household member. `member_id: null` elsewhere (on Account / Pool) means
 * "shared / joint" — visible and counted in every member's view, not just one.
 */
export interface Member {
  id: string;
  name: string;
  /** Semantic tone used for the fallback initial badge and dot indicators. */
  color: 'rose' | 'sage' | 'champagne' | 'coral' | 'plum';
  /** Path under /public (e.g. "brand/her-avatar.png"), or null for an initials badge. */
  avatarUrl: string | null;
}

export interface Pool {
  id: string;
  name: string;
  type: PoolType;
  monthly_budget: number;
  reserve_as_essential: boolean;
  sort_order: number;
  /** Owning member, or null for a shared/joint envelope (e.g. Rent). */
  member_id: string | null;
}

export interface Commitment {
  id: string;
  item: string;
  pool_id: string | null;
  /** The specific account this comes off — ownership is derived from here. */
  account_id: string;
  search_term: string;
  amount: number;
  day_of_month: number;
  /** True when a transaction in the active cycle has matched this commitment. */
  paid?: boolean;
}

export interface Rule {
  id: string;
  priority: number;
  search_term: string;
  pool_id: string;
}

export interface Transaction {
  id: string;
  date: string; // ISO yyyy-mm-dd
  /** The specific account this was imported against — ownership derives from here. */
  account_id: string;
  description: string; // raw, never destroyed
  merchant: string; // cleaned
  amount: number; // negative = out, positive = in
  pool_id: string | null; // null = unmapped
  cycle: string; // cycle id
  direction: Direction;
  mapped_by: MappedBy;
  /** Set when this transaction paid a specific commitment — drives auto "paid" status. */
  commitment_id?: string;
}

export interface Account {
  id: string;
  label: string;
  kind: AccountKind;
  current_balance: number;
  as_of_date: string;
  /** Owning member, or null for a shared/joint account. */
  member_id: string | null;
}

export interface Cycle {
  id: string;
  label: string;
  start_date: string;
  end_date: string;
  income_expected: number;
  income_received: number;
}

export interface IncomeSource {
  id: string;
  label: string;
  amount_expected: number;
  day_of_month: number;
  recurring: boolean;
  /** The account this income lands in — ownership derives from here. */
  account_id: string;
}
