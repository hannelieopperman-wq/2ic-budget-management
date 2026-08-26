import Papa from 'papaparse';
import type { Transaction, Commitment, Rule, Cycle } from '../types/budget';
import { cleanMerchant } from './merchant';
import { cycleBoundsFor, toISO } from './cycle';
import { mapTransaction } from './mapping';

// ---------------------------------------------------------------------------
// Bank CSV import engine.
// Bank files often contain junk rows (account holder, balances, etc.) before
// the real header. We locate the header by finding the row that mentions
// Date, Amount and Description, then parse only genuine transaction rows.
// Junk rows are never stored, displayed, logged, or counted as skipped.
// ---------------------------------------------------------------------------

export interface ParsedRow {
  date: string; // ISO
  amount: number;
  balance: number | null;
  description: string;
  merchant: string;
}

export interface RawGrid {
  rows: string[][];
}

/** Parse a CSV file into a raw string grid (no header assumptions). */
export function readGrid(file: File): Promise<RawGrid> {
  return new Promise((resolve, reject) => {
    Papa.parse<string[]>(file, {
      skipEmptyLines: 'greedy',
      complete: (res) => resolve({ rows: res.data as string[][] }),
      error: reject,
    });
  });
}

const DATE_KEYS = ['date', 'transaction date', 'txn date', 'posting date'];
const AMOUNT_KEYS = ['amount', 'debit', 'credit', 'value'];
const DESC_KEYS = ['description', 'narrative', 'details', 'reference'];

function rowMatches(row: string[], keys: string[]): boolean {
  return row.some((cell) => keys.some((k) => cell?.toLowerCase().trim().includes(k)));
}

/** Find the index of the real header row, or -1 if none looks valid. */
export function findHeaderRow(rows: string[][]): number {
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    if (rowMatches(row, DATE_KEYS) && rowMatches(row, AMOUNT_KEYS) && rowMatches(row, DESC_KEYS)) {
      return i;
    }
  }
  return -1;
}

function columnIndex(header: string[], keys: string[]): number {
  for (let i = 0; i < header.length; i++) {
    const cell = header[i]?.toLowerCase().trim() ?? '';
    if (keys.some((k) => cell.includes(k))) return i;
  }
  return -1;
}

/** Convert a bank date cell (DD/MM/YYYY or Excel serial) to ISO. */
export function normaliseDate(cell: string): string | null {
  if (!cell) return null;
  const trimmed = cell.trim();

  // Excel serial number (days since 1899-12-30)
  if (/^\d{4,6}$/.test(trimmed)) {
    const serial = Number(trimmed);
    if (serial > 20000 && serial < 80000) {
      const epoch = new Date(Date.UTC(1899, 11, 30));
      const d = new Date(epoch.getTime() + serial * 86_400_000);
      return toISO(new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
    }
  }

  // DD/MM/YYYY or DD-MM-YYYY or DD/MM/YY
  const m = trimmed.match(/^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{2,4})$/);
  if (m) {
    let [, dd, mm, yy] = m;
    let year = Number(yy);
    if (year < 100) year += 2000;
    return toISO(new Date(year, Number(mm) - 1, Number(dd)));
  }

  // ISO fallback
  const iso = trimmed.match(/^(\d{4})[/\-.](\d{1,2})[/\-.](\d{1,2})$/);
  if (iso) {
    const [, y, mo, d] = iso;
    return toISO(new Date(Number(y), Number(mo) - 1, Number(d)));
  }
  return null;
}

function parseAmount(cell: string): number {
  if (!cell) return 0;
  // handle "R 1 234,56", "-1234.56", "(123.45)"
  let s = cell.replace(/[R\s]/g, '').trim();
  const negativeParen = /^\(.*\)$/.test(s);
  s = s.replace(/[()]/g, '');
  // If comma is decimal separator (za) and no dot present
  if (s.includes(',') && !s.includes('.')) {
    s = s.replace(/\./g, '').replace(',', '.');
  } else {
    s = s.replace(/,/g, '');
  }
  let n = Number(s);
  if (!Number.isFinite(n)) n = 0;
  return negativeParen ? -Math.abs(n) : n;
}

/** Extract clean transaction rows from a raw grid. Returns [] if no header. */
export function extractRows(grid: RawGrid): ParsedRow[] {
  const headerIdx = findHeaderRow(grid.rows);
  if (headerIdx === -1) return [];

  const header = grid.rows[headerIdx];
  const dateCol = columnIndex(header, DATE_KEYS);
  const amountCol = columnIndex(header, AMOUNT_KEYS);
  const descCol = columnIndex(header, DESC_KEYS);
  const balanceCol = columnIndex(header, ['balance']);

  const out: ParsedRow[] = [];
  for (let i = headerIdx + 1; i < grid.rows.length; i++) {
    const row = grid.rows[i];
    const rawDate = row[dateCol];
    const iso = normaliseDate(rawDate);
    const description = (row[descCol] ?? '').trim();
    // Skip anything that isn't a genuine dated transaction row (junk/footer).
    if (!iso || !description) continue;

    out.push({
      date: iso,
      amount: parseAmount(row[amountCol] ?? ''),
      balance: balanceCol >= 0 ? parseAmount(row[balanceCol] ?? '') : null,
      description,
      merchant: cleanMerchant(description),
    });
  }
  return out;
}

export interface PreparedTransaction extends Transaction {
  isDuplicate: boolean;
}

/** A transaction key for duplicate detection: date + amount + description. */
function dupKey(date: string, amount: number, description: string): string {
  return `${date}|${amount.toFixed(2)}|${description.trim().toLowerCase()}`;
}

export interface PreparationResult {
  prepared: PreparedTransaction[];
  imported: number;
  duplicates: number;
  unmapped: number;
}

/**
 * Turn parsed rows into fully-mapped transactions, flagging duplicates against
 * both the existing set and within the file itself.
 */
export function prepareImport(
  rows: ParsedRow[],
  accountId: string,
  existing: Transaction[],
  commitments: Commitment[],
  rules: Rule[],
  cycles: Cycle[],
): PreparationResult {
  const existingKeys = new Set(existing.map((t) => dupKey(t.date, t.amount, t.description)));
  const seenInFile = new Set<string>();
  const paidCommitmentIds = new Set<string>();

  const prepared: PreparedTransaction[] = rows.map((row, idx) => {
    const key = dupKey(row.date, row.amount, row.description);
    const isDuplicate = existingKeys.has(key) || seenInFile.has(key);
    seenInFile.add(key);

    const bounds = cycleBoundsFor(row.date);
    const cycle =
      cycles.find((c) => c.start_date === bounds.start) ??
      cycles.find((c) => c.start_date <= row.date && c.end_date >= row.date);
    const cycleId = cycle?.id ?? bounds.start;

    let pool_id: string | null = null;
    let mapped_by: Transaction['mapped_by'] = null;
    let commitment_id: string | undefined;
    if (cycle && !isDuplicate) {
      const result = mapTransaction({ ...row, account_id: accountId }, commitments, rules, cycle, paidCommitmentIds);
      pool_id = result.pool_id;
      mapped_by = result.mapped_by;
      commitment_id = result.commitment_id;
    }

    return {
      id: `imp_${Date.now()}_${idx}`,
      date: row.date,
      account_id: accountId,
      description: row.description,
      merchant: row.merchant,
      amount: row.amount,
      pool_id,
      cycle: cycleId,
      direction: row.amount < 0 ? 'out' : 'in',
      mapped_by,
      commitment_id,
      isDuplicate,
    };
  });

  const nonDup = prepared.filter((p) => !p.isDuplicate);
  return {
    prepared,
    imported: nonDup.length,
    duplicates: prepared.length - nonDup.length,
    unmapped: nonDup.filter((p) => p.pool_id === null && p.direction === 'out').length,
  };
}
