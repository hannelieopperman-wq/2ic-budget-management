import type { Commitment, Rule, Transaction, MappedBy, Cycle, AccountKind } from '../types/budget';
import { isInCycle } from './cycle';

// ---------------------------------------------------------------------------
// Mapping order is exactly: 1) Commitment  2) Rule  3) Unmapped.
// All matching is case-insensitive "contains".
// ---------------------------------------------------------------------------

export interface MappingResult {
  pool_id: string | null;
  mapped_by: MappedBy;
  commitment_id?: string;
}

function contains(haystack: string, needle: string): boolean {
  if (!needle) return false;
  return haystack.toLowerCase().includes(needle.toLowerCase());
}

/**
 * Attempt to match a transaction against unpaid commitments for its cycle.
 * Respects: exact account, cycle membership, unpaid status, search_term contains.
 * A commitment can only be consumed once (tracked via paidCommitmentIds).
 */
export function matchCommitment(
  tx: Pick<Transaction, 'description' | 'account_id' | 'date'>,
  commitments: Commitment[],
  cycle: Cycle,
  paidCommitmentIds: Set<string>,
): Commitment | undefined {
  if (!isInCycle(tx.date, cycle)) return undefined;
  return commitments.find(
    (c) =>
      c.account_id === tx.account_id &&
      !c.paid &&
      !paidCommitmentIds.has(c.id) &&
      contains(tx.description, c.search_term),
  );
}

/** Evaluate rules in ascending priority; the first match wins. */
export function matchRule(
  tx: Pick<Transaction, 'description'>,
  rules: Rule[],
): Rule | undefined {
  const ordered = [...rules].sort((a, b) => a.priority - b.priority);
  return ordered.find((r) => contains(tx.description, r.search_term));
}

/**
 * Full mapping pipeline for a single transaction. Mutates paidCommitmentIds
 * when a commitment is consumed so it can't be paid twice in the same cycle.
 */
export function mapTransaction(
  tx: Pick<Transaction, 'description' | 'account_id' | 'date'>,
  commitments: Commitment[],
  rules: Rule[],
  cycle: Cycle,
  paidCommitmentIds: Set<string>,
): MappingResult {
  const commitment = matchCommitment(tx, commitments, cycle, paidCommitmentIds);
  if (commitment) {
    paidCommitmentIds.add(commitment.id);
    return { pool_id: commitment.pool_id, mapped_by: 'commitment', commitment_id: commitment.id };
  }
  const rule = matchRule(tx, rules);
  if (rule) {
    return { pool_id: rule.pool_id, mapped_by: 'rule' };
  }
  return { pool_id: null, mapped_by: null };
}

/** Build a rule from a manual reassignment's search term + chosen pool. */
export function ruleFromReassignment(
  searchTerm: string,
  poolId: string,
  existingRules: Rule[],
): Rule {
  const maxPriority = existingRules.reduce((m, r) => Math.max(m, r.priority), 0);
  return {
    id: `rule_${Date.now()}`,
    priority: maxPriority + 1,
    search_term: searchTerm,
    pool_id: poolId,
  };
}

export type { AccountKind };
