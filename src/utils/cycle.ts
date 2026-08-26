import type { Cycle } from '../types/budget';

// ---------------------------------------------------------------------------
// Pay-date driven cycle logic. A cycle runs from the 25th of one month to the
// 24th of the next. Membership is ALWAYS by date range, never by month.
// ---------------------------------------------------------------------------

export const CYCLE_START_DAY = 25;

/** Parse an ISO yyyy-mm-dd string into a local Date (no timezone drift). */
export function parseISO(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

/** Format a Date as ISO yyyy-mm-dd. */
export function toISO(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Format a Date as en-ZA DD/MM/YYYY. */
export function formatDate(iso: string): string {
  const d = parseISO(iso);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  return `${day}/${month}/${d.getFullYear()}`;
}

/** Short label, e.g. "25 Aug". */
export function formatDayMonth(iso: string): string {
  const d = parseISO(iso);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${d.getDate()} ${months[d.getMonth()]}`;
}

/** True if start_date <= date <= end_date (inclusive), by range not month. */
export function isInCycle(dateISO: string, cycle: Cycle): boolean {
  const t = parseISO(dateISO).getTime();
  return t >= parseISO(cycle.start_date).getTime() && t <= parseISO(cycle.end_date).getTime();
}

/** Given a date, compute the {start,end} ISO bounds of its 25->24 cycle. */
export function cycleBoundsFor(dateISO: string): { start: string; end: string } {
  const d = parseISO(dateISO);
  let startYear = d.getFullYear();
  let startMonth = d.getMonth(); // 0-based
  if (d.getDate() < CYCLE_START_DAY) {
    // belongs to the cycle that started the previous month
    startMonth -= 1;
    if (startMonth < 0) {
      startMonth = 11;
      startYear -= 1;
    }
  }
  const start = new Date(startYear, startMonth, CYCLE_START_DAY);
  const end = new Date(startYear, startMonth + 1, CYCLE_START_DAY - 1);
  return { start: toISO(start), end: toISO(end) };
}

/** Find the cycle that contains a given date, if any. */
export function findCycleFor(dateISO: string, cycles: Cycle[]): Cycle | undefined {
  return cycles.find((c) => isInCycle(dateISO, c));
}

/** Days elapsed since the cycle start (0 on the start day). */
export function daysSinceCycleStart(cycle: Cycle, today = new Date()): number {
  const start = parseISO(cycle.start_date).getTime();
  const now = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  return Math.floor((now - start) / 86_400_000);
}

/** Total number of days in a cycle (inclusive of both ends). */
export function cycleLengthDays(cycle: Cycle): number {
  const start = parseISO(cycle.start_date).getTime();
  const end = parseISO(cycle.end_date).getTime();
  return Math.round((end - start) / 86_400_000) + 1;
}

/** Long, friendly date, e.g. "Wednesday, 26 August 2026". */
export function formatFriendlyDate(date: Date = new Date()): string {
  return date.toLocaleDateString('en-ZA', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

/** Days remaining until the cycle after this one begins (0 = starts today). */
export function daysUntilNextCycle(cycle: Cycle, today = new Date()): number {
  const end = parseISO(cycle.end_date);
  const nextStart = new Date(end.getFullYear(), end.getMonth(), end.getDate() + 1);
  const now = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  return Math.max(0, Math.round((nextStart.getTime() - now.getTime()) / 86_400_000));
}

/** A warm, tasteful countdown line — never juvenile, just a little personality. */
export function cycleCountdownMessage(cycle: Cycle, today = new Date()): string {
  const days = daysUntilNextCycle(cycle, today);
  if (days === 0) return 'Your next cycle starts today';
  if (days === 1) return '1 day left in this cycle';
  if (days <= 5) return `${days} days left — almost at the next cycle`;
  return `${days} days until your next cycle begins`;
}
