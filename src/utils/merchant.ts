// Derive a clean, human merchant name from a raw bank description.
// The raw description is preserved elsewhere; this never mutates it.

const NOISE_PREFIXES = [
  'POS PURCHASE',
  'POS ',
  'CARD PURCHASE',
  'DEBIT ORDER',
  'DEBITORDER',
  'DO ',
  'PAYMENT TO',
  'PAYMENT FROM',
  'PURCHASE',
  'FNB APP PAYMENT TO',
  'INTERNET PMT TO',
  'EFT PAYMENT TO',
  'MAGTAPE CREDIT',
  'IB PAYMENT TO',
];

/** Turn "POS PURCHASE SUPERMARKET STORE 1234" into "Supermarket Store". */
export function cleanMerchant(raw: string): string {
  if (!raw) return 'Unknown';
  let s = raw.trim();

  // strip known noise prefixes (case-insensitive)
  for (const prefix of NOISE_PREFIXES) {
    const re = new RegExp('^' + prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    if (re.test(s)) {
      s = s.replace(re, '').trim();
      break;
    }
  }

  // drop trailing reference numbers (runs of 4+ digits, or digit-heavy tails)
  s = s.replace(/\s+[\d*#-]{4,}$/g, '').trim();
  s = s.replace(/\s{2,}/g, ' ');

  // title-case the remaining words, keeping short all-caps acronyms sensible
  s = s
    .toLowerCase()
    .split(' ')
    .filter(Boolean)
    .map((w) => (w.length <= 2 ? w.toUpperCase() : w.charAt(0).toUpperCase() + w.slice(1)))
    .join(' ');

  return s || 'Unknown';
}
