// en-ZA currency + number formatting. Produces "R 1 234,56".

const zaNumber = new Intl.NumberFormat('en-ZA', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** Format a rand amount, e.g. 1234.5 -> "R 1 234,50". */
export function formatCurrency(value: number): string {
  const safe = Number.isFinite(value) ? value : 0;
  const sign = safe < 0 ? '-' : '';
  return `${sign}R ${zaNumber.format(Math.abs(safe))}`;
}

/** Format without the currency symbol, e.g. "1 234,50". */
export function formatAmount(value: number): string {
  const safe = Number.isFinite(value) ? value : 0;
  return zaNumber.format(safe);
}

/** Format a percentage as a whole number, clamped to [0, 999]. */
export function formatPercent(value: number): string {
  if (!Number.isFinite(value)) return '0%';
  return `${Math.round(Math.min(Math.max(value, 0), 9.99) * 100)}%`;
}
