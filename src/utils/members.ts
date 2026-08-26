import type { Account } from '../types/budget';

// ---------------------------------------------------------------------------
// Household member visibility.
//
// activeMemberId is either 'all' (combined view) or a specific Member.id.
// An item is visible if:
//   - the view is 'all' (everything shows), OR
//   - the item's owner is null (shared/joint — visible in every view), OR
//   - the item's owner matches the active member.
// ---------------------------------------------------------------------------

export const ALL_MEMBERS = 'all' as const;

export function isVisible(ownerMemberId: string | null, activeMemberId: string): boolean {
  return activeMemberId === ALL_MEMBERS || ownerMemberId === null || ownerMemberId === activeMemberId;
}

/** Resolve the owning member for an account_id-based entity (Commitment, Transaction, IncomeSource). */
export function memberIdForAccount(accountId: string, accounts: Account[]): string | null {
  return accounts.find((a) => a.id === accountId)?.member_id ?? null;
}
