import type { Account, Commitment, Cycle, Pool, Transaction } from '../types/budget';
import { formatCurrency } from './currency';
import { formatDate } from './cycle';
import { spentThisCycle, remaining, pctUsed } from './calculations';

// ---------------------------------------------------------------------------
// Client-side export. Everything here runs in the browser against data
// already in memory — nothing is sent anywhere. Income amounts are
// intentionally excluded/masked in every export, mirroring the in-app rule
// that a real salary figure is never displayed.
//
// jsPDF and xlsx are loaded lazily (dynamic import) so their ~1MB combined
// weight only downloads when someone actually clicks an export button,
// instead of bloating every page load.
// ---------------------------------------------------------------------------

export interface ReportExportInput {
  viewLabel: string; // "Combined household" | member name
  cycleRange: Cycle[];
  pools: Pool[]; // visible pools only
  transactions: Transaction[]; // visible transactions only
  commitments: Commitment[];
  accounts: Account[]; // visible accounts only
  accountLabel: (id: string) => string;
  poolLabel: (id: string | null) => string;
}

/** Redact income-pool transactions before they ever reach an export. */
function redactIncome(transactions: Transaction[], pools: Pool[]): Transaction[] {
  const incomePoolIds = new Set(pools.filter((p) => p.name.toLowerCase() === 'income').map((p) => p.id));
  return transactions.filter((t) => !(t.direction === 'in' && t.pool_id && incomePoolIds.has(t.pool_id)));
}

export async function exportReportToPDF(input: ReportExportInput) {
  const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([
    import('jspdf'),
    import('jspdf-autotable'),
  ]);
  const { viewLabel, cycleRange, pools, transactions, commitments, accountLabel, poolLabel } = input;
  const doc = new jsPDF();
  const safeTx = redactIncome(transactions, pools);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(27, 58, 75);
  doc.text('2IC Budget Management — Report', 14, 18);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(122, 82, 102);
  doc.text(`${viewLabel} · ${cycleRange[0]?.label ?? ''} to ${cycleRange[cycleRange.length - 1]?.label ?? ''}`, 14, 25);
  doc.text('Income figures are not included in exports.', 14, 30);

  let y = 40;

  for (const cycle of cycleRange) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(91, 58, 75);
    doc.text(cycle.label, 14, y);
    y += 4;

    const poolRows = pools.map((p) => [
      p.name,
      formatCurrency(p.monthly_budget),
      formatCurrency(spentThisCycle(p, safeTx, cycle)),
      formatCurrency(remaining(p, safeTx, cycle)),
      `${Math.round(pctUsed(p, safeTx, cycle) * 100)}%`,
    ]);

    autoTable(doc, {
      startY: y,
      head: [['Pool', 'Budget', 'Spent', 'Remaining', '% Used']],
      body: poolRows,
      theme: 'plain',
      headStyles: { fillColor: [247, 227, 230], textColor: [91, 58, 75], fontStyle: 'bold' },
      styles: { fontSize: 9, cellPadding: 2.5 },
      margin: { left: 14, right: 14 },
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    y = (doc as any).lastAutoTable.finalY + 10;
    if (y > 250) {
      doc.addPage();
      y = 20;
    }
  }

  // Commitments summary
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(91, 58, 75);
  doc.text('Commitments', 14, y);
  y += 4;

  autoTable(doc, {
    startY: y,
    head: [['Item', 'Pool', 'Account', 'Amount', 'Day']],
    body: commitments.map((c) => [c.item, poolLabel(c.pool_id), accountLabel(c.account_id), formatCurrency(c.amount), String(c.day_of_month)]),
    theme: 'plain',
    headStyles: { fillColor: [247, 227, 230], textColor: [91, 58, 75], fontStyle: 'bold' },
    styles: { fontSize: 9, cellPadding: 2.5 },
    margin: { left: 14, right: 14 },
  });

  doc.save(`envelope-report-${new Date().toISOString().slice(0, 10)}.pdf`);
}

export async function exportReportToExcel(input: ReportExportInput) {
  const XLSX = await import('xlsx');
  const { viewLabel, cycleRange, pools, transactions, commitments, accountLabel, poolLabel } = input;
  const safeTx = redactIncome(transactions, pools);
  const wb = XLSX.utils.book_new();

  // Pool summary sheet — one row per pool per cycle.
  const poolRows: Record<string, string | number>[] = [];
  for (const cycle of cycleRange) {
    for (const p of pools) {
      poolRows.push({
        Cycle: cycle.label,
        Pool: p.name,
        Budget: p.monthly_budget,
        Spent: Math.round(spentThisCycle(p, safeTx, cycle) * 100) / 100,
        Remaining: Math.round(remaining(p, safeTx, cycle) * 100) / 100,
        'Pct Used': Math.round(pctUsed(p, safeTx, cycle) * 100),
      });
    }
  }
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(poolRows), 'Pool Summary');

  // Transactions sheet — spending only, income redacted.
  const cycleIds = new Set(cycleRange.map((c) => c.id));
  const txRows = safeTx
    .filter((t) => cycleIds.has(t.cycle))
    .map((t) => ({
      Date: formatDate(t.date),
      Account: accountLabel(t.account_id),
      Merchant: t.merchant,
      Description: t.description,
      Amount: t.amount,
      Pool: poolLabel(t.pool_id),
      'Mapped By': t.mapped_by ?? 'Unmapped',
    }));
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(txRows), 'Transactions');

  // Commitments sheet.
  const comRows = commitments.map((c) => ({
    Item: c.item,
    Pool: poolLabel(c.pool_id),
    Account: accountLabel(c.account_id),
    Amount: c.amount,
    'Day of Month': c.day_of_month,
    Paid: c.paid ? 'Yes' : 'No',
  }));
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(comRows), 'Commitments');

  // A tiny cover sheet noting scope, placed first.
  const cover = [{ Report: '2IC Budget Management Report', View: viewLabel, Range: `${cycleRange[0]?.label ?? ''} – ${cycleRange[cycleRange.length - 1]?.label ?? ''}`, Note: 'Income figures are not included in exports.' }];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(cover), 'Overview');
  // Move cover sheet to the front.
  wb.SheetNames.unshift(wb.SheetNames.splice(wb.SheetNames.indexOf('Overview'), 1)[0]);

  XLSX.writeFile(wb, `envelope-report-${new Date().toISOString().slice(0, 10)}.xlsx`);
}
