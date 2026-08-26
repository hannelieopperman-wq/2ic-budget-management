import type {
  Member,
  Pool,
  Commitment,
  Rule,
  Transaction,
  Account,
  Cycle,
  IncomeSource,
} from '../types/budget';

// ---------------------------------------------------------------------------
// MOCK DATA — clearly fictional. No real personal information.
// Income is masked (income_expected/received here are illustrative demo
// figures used only to make the allocation maths render; the UI shows
// "R 00 000,00" wherever a real salary might appear).
//
// This dataset demonstrates a two-member household: "You" and "Husband".
// Shared/joint items (accounts, pools) use member_id: null and are visible
// in every view. Everything else is owned by whichever account it belongs to.
// ---------------------------------------------------------------------------

// ---- Household members ------------------------------------------------------
export const mockMembers: Member[] = [
  { id: 'mem_her', name: 'You', color: 'rose', avatarUrl: 'brand/her-avatar.png' },
  { id: 'mem_him', name: 'Husband', color: 'sage', avatarUrl: 'brand/him-avatar.png' },
];

export const DEFAULT_HOUSEHOLD_NAME = 'Our Household';

export const MEM_HER = 'mem_her';
export const MEM_HIM = 'mem_him';

// ---- Cycles ----------------------------------------------------------------
export const mockCycles: Cycle[] = [
  {
    id: 'cyc_2026_07',
    label: '25 Jul → 24 Aug',
    start_date: '2026-07-25',
    end_date: '2026-08-24',
    income_expected: 68000,
    income_received: 68000,
  },
  {
    id: 'cyc_2026_08',
    label: '25 Aug → 24 Sep',
    start_date: '2026-08-25',
    end_date: '2026-09-24',
    income_expected: 68000,
    income_received: 68000,
  },
  {
    id: 'cyc_2026_09',
    label: '25 Sep → 24 Oct',
    start_date: '2026-09-25',
    end_date: '2026-10-24',
    income_expected: 68000,
    income_received: 0,
  },
];

export const DEFAULT_CYCLE_ID = 'cyc_2026_08';

// ---- Accounts ----------------------------------------------------------------
export const mockAccounts: Account[] = [
  {
    id: 'acc_cheque',
    label: 'Cheque / Current',
    kind: 'cheque',
    current_balance: 18450.0,
    as_of_date: '2026-08-25',
    member_id: MEM_HER,
  },
  {
    id: 'acc_credit',
    label: 'Credit Card',
    kind: 'credit',
    current_balance: -6320.5,
    as_of_date: '2026-08-25',
    member_id: MEM_HER,
  },
  {
    id: 'acc_cheque_him',
    label: "Husband's Cheque",
    kind: 'cheque',
    current_balance: 9200.0,
    as_of_date: '2026-08-25',
    member_id: MEM_HIM,
  },
  {
    id: 'acc_credit_him',
    label: "Husband's Credit Card",
    kind: 'credit',
    current_balance: -850.0,
    as_of_date: '2026-08-25',
    member_id: MEM_HIM,
  },
];

// ---- Pools -----------------------------------------------------------------
export const mockPools: Pool[] = [
  { id: 'pool_groceries', name: 'Groceries', type: 'variable', monthly_budget: 8000, reserve_as_essential: true, sort_order: 1, member_id: MEM_HER },
  { id: 'pool_petrol', name: 'Petrol', type: 'variable', monthly_budget: 3000, reserve_as_essential: true, sort_order: 2, member_id: MEM_HER },
  { id: 'pool_subs', name: 'Subscriptions', type: 'variable', monthly_budget: 1200, reserve_as_essential: false, sort_order: 3, member_id: MEM_HER },
  { id: 'pool_home', name: 'Home & Rates', type: 'fixed', monthly_budget: 6500, reserve_as_essential: false, sort_order: 4, member_id: null },
  { id: 'pool_insurance', name: 'Insurance', type: 'fixed', monthly_budget: 4200, reserve_as_essential: false, sort_order: 5, member_id: null },
  { id: 'pool_eating_out', name: 'Eating Out', type: 'variable', monthly_budget: 2000, reserve_as_essential: false, sort_order: 6, member_id: MEM_HER },
  { id: 'pool_personal', name: 'Personal Care', type: 'variable', monthly_budget: 1500, reserve_as_essential: false, sort_order: 7, member_id: MEM_HER },
  { id: 'pool_kids', name: 'Kids & School', type: 'variable', monthly_budget: 2500, reserve_as_essential: false, sort_order: 8, member_id: null },
  { id: 'pool_petrol_him', name: 'His Petrol', type: 'variable', monthly_budget: 1500, reserve_as_essential: true, sort_order: 9, member_id: MEM_HIM },
  { id: 'pool_subs_him', name: 'His Subscriptions', type: 'variable', monthly_budget: 400, reserve_as_essential: false, sort_order: 10, member_id: MEM_HIM },
  { id: 'pool_hobbies_him', name: 'His Hobbies', type: 'variable', monthly_budget: 1000, reserve_as_essential: false, sort_order: 11, member_id: MEM_HIM },
  { id: 'pool_income', name: 'Income', type: 'excluded', monthly_budget: 0, reserve_as_essential: false, sort_order: 20, member_id: null },
  { id: 'pool_transfers', name: 'Transfers / CC Payment', type: 'excluded', monthly_budget: 0, reserve_as_essential: false, sort_order: 21, member_id: null },
];

// ---- Commitments -------------------------------------------------------------
export const mockCommitments: Commitment[] = [
  { id: 'com_capitec', item: 'Capitec Loan', pool_id: 'pool_home', account_id: 'acc_cheque', search_term: 'CAPITEC', amount: 3200, day_of_month: 25, paid: false },
  { id: 'com_kingprice', item: 'King Price', pool_id: 'pool_insurance', account_id: 'acc_cheque', search_term: 'KING PRICE', amount: 1450, day_of_month: 1, paid: false },
  { id: 'com_discovery', item: 'Discovery Life', pool_id: 'pool_insurance', account_id: 'acc_cheque', search_term: 'DISCOVERY LIFE', amount: 1875, day_of_month: 1, paid: false },
  { id: 'com_rates', item: 'Rates and Water', pool_id: 'pool_home', account_id: 'acc_cheque', search_term: 'RATES AND WATER', amount: 2100, day_of_month: 3, paid: false },
  { id: 'com_school', item: 'School Fees', pool_id: 'pool_kids', account_id: 'acc_cheque', search_term: 'SCHOOL FEES', amount: 2500, day_of_month: 2, paid: false },
  { id: 'com_medaid', item: 'Medical Aid', pool_id: 'pool_insurance', account_id: 'acc_cheque', search_term: 'MEDICAL AID', amount: 3100, day_of_month: 1, paid: true },
  { id: 'com_netflix', item: 'Netflix', pool_id: 'pool_subs', account_id: 'acc_credit', search_term: 'NETFLIX', amount: 199, day_of_month: 5, paid: true },
  { id: 'com_spotify', item: 'Spotify', pool_id: 'pool_subs', account_id: 'acc_credit', search_term: 'SPOTIFY', amount: 119, day_of_month: 7, paid: true },
  { id: 'com_gym_him', item: 'Gym Membership', pool_id: 'pool_hobbies_him', account_id: 'acc_credit_him', search_term: 'VIRGIN ACTIVE', amount: 799, day_of_month: 1, paid: false },
];

// ---- Rules (84, duplicates preserved intentionally) ------------------------
const ruleSeed: Array<[string, string]> = [
  ['CAPITEC', 'pool_home'],
  ['KING PRICE', 'pool_insurance'],
  ['DISCOVERY LIFE', 'pool_insurance'],
  ['DISCOVERY', 'pool_insurance'],
  ['RATES AND WATER', 'pool_home'],
  ['RATES', 'pool_home'],
  ['LEEUPOORT WATER', 'pool_home'],
  ['LEEUPOORT', 'pool_home'],
  ['LEEUPOORT', 'pool_home'],
  ['ESKOM', 'pool_home'],
  ['CITY POWER', 'pool_home'],
  ['MUNICIPAL', 'pool_home'],
  ['NETFLIX', 'pool_subs'],
  ['SPOTIFY', 'pool_subs'],
  ['DSTV', 'pool_subs'],
  ['SHOWMAX', 'pool_subs'],
  ['YOUTUBE PREMIUM', 'pool_subs'],
  ['APPLE.COM', 'pool_subs'],
  ['GOOGLE STORAGE', 'pool_subs'],
  ['AMAZON PRIME', 'pool_subs'],
  ['ICLOUD', 'pool_subs'],
  ['MICROSOFT', 'pool_subs'],
  ['ADOBE', 'pool_subs'],
  ['CANVA', 'pool_subs'],
  ['WOOLWORTHS', 'pool_groceries'],
  ['WOOLIES', 'pool_groceries'],
  ['CHECKERS', 'pool_groceries'],
  ['PICK N PAY', 'pool_groceries'],
  ['PNP', 'pool_groceries'],
  ['SPAR', 'pool_groceries'],
  ['FOOD LOVERS', 'pool_groceries'],
  ['SHOPRITE', 'pool_groceries'],
  ['FRUIT AND VEG', 'pool_groceries'],
  ['MAKRO', 'pool_groceries'],
  ['GAME STORES', 'pool_groceries'],
  ['ENGEN', 'pool_petrol'],
  ['SHELL', 'pool_petrol'],
  ['BP ', 'pool_petrol'],
  ['SASOL', 'pool_petrol'],
  ['TOTAL ', 'pool_petrol'],
  ['CALTEX', 'pool_petrol'],
  ['PETROLEUM', 'pool_petrol'],
  ['FILLING STATION', 'pool_petrol'],
  ['NANDOS', 'pool_eating_out'],
  ['MCDONALDS', 'pool_eating_out'],
  ['KFC', 'pool_eating_out'],
  ['STEERS', 'pool_eating_out'],
  ['UBER EATS', 'pool_eating_out'],
  ['MR DELIVERY', 'pool_eating_out'],
  ['MUGG AND BEAN', 'pool_eating_out'],
  ['VIDA', 'pool_eating_out'],
  ['STARBUCKS', 'pool_eating_out'],
  ['WIMPY', 'pool_eating_out'],
  ['ROMANS PIZZA', 'pool_eating_out'],
  ['DEBONAIRS', 'pool_eating_out'],
  ['CLICKS', 'pool_personal'],
  ['DIS-CHEM', 'pool_personal'],
  ['DISCHEM', 'pool_personal'],
  ['SORBET', 'pool_personal'],
  ['SALON', 'pool_personal'],
  ['PHARMACY', 'pool_personal'],
  ['MEDICAL AID', 'pool_insurance'],
  ['OUTSURANCE', 'pool_insurance'],
  ['MOMENTUM', 'pool_insurance'],
  ['SANLAM', 'pool_insurance'],
  ['OLD MUTUAL', 'pool_insurance'],
  ['LIBERTY', 'pool_insurance'],
  ['SCHOOL FEES', 'pool_kids'],
  ['STATIONERY', 'pool_kids'],
  ['UNIFORM', 'pool_kids'],
  ['AFTERCARE', 'pool_kids'],
  ['TOY KINGDOM', 'pool_kids'],
  ['TAKEALOT', 'pool_personal'],
  ['SUPERBALIST', 'pool_personal'],
  ['MR PRICE', 'pool_personal'],
  ['H&M', 'pool_personal'],
  ['COTTON ON', 'pool_personal'],
  ['SALARY', 'pool_income'],
  ['INTEREST', 'pool_income'],
  ['REFUND', 'pool_income'],
  ['CREDIT CARD PAYMENT', 'pool_transfers'],
  ['CC PAYMENT', 'pool_transfers'],
  ['TRANSFER TO', 'pool_transfers'],
  ['PAYMENT TO SAVINGS', 'pool_transfers'],
];

export const mockRules: Rule[] = ruleSeed.map(([search_term, pool_id], i) => ({
  id: `rule_${i + 1}`,
  priority: i + 1,
  search_term,
  pool_id,
}));

// ---- Transactions (current cycle 25 Aug → 24 Sep) --------------------------
export const mockTransactions: Transaction[] = [
  // Income
  { id: 'tx_1', date: '2026-08-25', account_id: 'acc_cheque', description: 'SALARY DEPOSIT EMPLOYER PTY LTD', merchant: 'Salary', amount: 42000, pool_id: 'pool_income', cycle: 'cyc_2026_08', direction: 'in', mapped_by: 'rule' },
  { id: 'tx_1h', date: '2026-08-25', account_id: 'acc_cheque_him', description: 'SALARY DEPOSIT HIS EMPLOYER LTD', merchant: 'Salary', amount: 26000, pool_id: 'pool_income', cycle: 'cyc_2026_08', direction: 'in', mapped_by: 'rule' },
  // Groceries (her)
  { id: 'tx_2', date: '2026-08-26', account_id: 'acc_credit', description: 'POS PURCHASE WOOLWORTHS SANDTON 4471', merchant: 'Woolworths Sandton', amount: -1240.55, pool_id: 'pool_groceries', cycle: 'cyc_2026_08', direction: 'out', mapped_by: 'rule' },
  { id: 'tx_3', date: '2026-08-29', account_id: 'acc_credit', description: 'POS PURCHASE CHECKERS HYPER 8821', merchant: 'Checkers Hyper', amount: -1899.9, pool_id: 'pool_groceries', cycle: 'cyc_2026_08', direction: 'out', mapped_by: 'rule' },
  { id: 'tx_4', date: '2026-09-03', account_id: 'acc_credit', description: 'POS PURCHASE PICK N PAY FAMILY 2210', merchant: 'Pick N Pay Family', amount: -2100.0, pool_id: 'pool_groceries', cycle: 'cyc_2026_08', direction: 'out', mapped_by: 'rule' },
  // Petrol (her)
  { id: 'tx_5', date: '2026-08-27', account_id: 'acc_cheque', description: 'POS PURCHASE ENGEN GARAGE 1123', merchant: 'Engen Garage', amount: -950.0, pool_id: 'pool_petrol', cycle: 'cyc_2026_08', direction: 'out', mapped_by: 'rule' },
  { id: 'tx_6', date: '2026-09-05', account_id: 'acc_cheque', description: 'POS PURCHASE SHELL ULTRA CITY 9987', merchant: 'Shell Ultra City', amount: -925.0, pool_id: 'pool_petrol', cycle: 'cyc_2026_08', direction: 'out', mapped_by: 'rule' },
  // Subscriptions (her)
  { id: 'tx_7', date: '2026-08-30', account_id: 'acc_credit', description: 'NETFLIX.COM SUBSCRIPTION', merchant: 'Netflix', amount: -199.0, pool_id: 'pool_subs', cycle: 'cyc_2026_08', direction: 'out', mapped_by: 'commitment' },
  { id: 'tx_8', date: '2026-09-01', account_id: 'acc_credit', description: 'SPOTIFY AB STOCKHOLM', merchant: 'Spotify AB Stockholm', amount: -119.0, pool_id: 'pool_subs', cycle: 'cyc_2026_08', direction: 'out', mapped_by: 'commitment' },
  { id: 'tx_9', date: '2026-09-02', account_id: 'acc_credit', description: 'DSTV DEBIT ORDER 887766', merchant: 'Dstv', amount: -882.0, pool_id: 'pool_subs', cycle: 'cyc_2026_08', direction: 'out', mapped_by: 'rule' },
  // Insurance (joint, medical aid already paid)
  { id: 'tx_10', date: '2026-09-01', account_id: 'acc_cheque', description: 'DEBIT ORDER MEDICAL AID SCHEME 00099', merchant: 'Medical Aid Scheme', amount: -3100.0, pool_id: 'pool_insurance', cycle: 'cyc_2026_08', direction: 'out', mapped_by: 'commitment' },
  // Eating out (her)
  { id: 'tx_11', date: '2026-08-28', account_id: 'acc_credit', description: 'POS PURCHASE NANDOS MENLYN 3321', merchant: 'Nandos Menlyn', amount: -345.0, pool_id: 'pool_eating_out', cycle: 'cyc_2026_08', direction: 'out', mapped_by: 'rule' },
  { id: 'tx_12', date: '2026-09-04', account_id: 'acc_credit', description: 'UBER EATS AMSTERDAM', merchant: 'Uber Eats Amsterdam', amount: -289.5, pool_id: 'pool_eating_out', cycle: 'cyc_2026_08', direction: 'out', mapped_by: 'rule' },
  // Personal care (her)
  { id: 'tx_13', date: '2026-08-31', account_id: 'acc_credit', description: 'POS PURCHASE CLICKS PHARMACY 5567', merchant: 'Clicks Pharmacy', amount: -420.0, pool_id: 'pool_personal', cycle: 'cyc_2026_08', direction: 'out', mapped_by: 'rule' },
  // Transfers (excluded — CC payment, her)
  { id: 'tx_14', date: '2026-09-06', account_id: 'acc_cheque', description: 'CREDIT CARD PAYMENT TRANSFER', merchant: 'Credit Card Payment', amount: -5000.0, pool_id: 'pool_transfers', cycle: 'cyc_2026_08', direction: 'out', mapped_by: 'rule' },
  { id: 'tx_15', date: '2026-09-07', account_id: 'acc_credit', description: 'POS PURCHASE TAKEALOT ONLINE 1188', merchant: 'Takealot Online', amount: -350.0, pool_id: 'pool_personal', cycle: 'cyc_2026_08', direction: 'out', mapped_by: 'rule' },
  // Unmapped (her, need attention)
  { id: 'tx_16', date: '2026-09-02', account_id: 'acc_credit', description: 'POS PURCHASE UNKNOWN VENDOR 7781', merchant: 'Unknown Vendor', amount: -260.0, pool_id: null, cycle: 'cyc_2026_08', direction: 'out', mapped_by: null },
  { id: 'tx_17', date: '2026-09-03', account_id: 'acc_cheque', description: 'EFT PAYMENT TO J SMITH REF 2290', merchant: 'J Smith', amount: -800.0, pool_id: null, cycle: 'cyc_2026_08', direction: 'out', mapped_by: null },
  { id: 'tx_18', date: '2026-09-05', account_id: 'acc_credit', description: 'POS PURCHASE CORNER CAFE 3312', merchant: 'Corner Cafe', amount: -85.0, pool_id: null, cycle: 'cyc_2026_08', direction: 'out', mapped_by: null },
  { id: 'tx_19', date: '2026-09-06', account_id: 'acc_credit', description: 'POS PURCHASE MARKET STALL 0091', merchant: 'Market Stall', amount: -150.0, pool_id: null, cycle: 'cyc_2026_08', direction: 'out', mapped_by: null },
  { id: 'tx_20', date: '2026-09-07', account_id: 'acc_cheque', description: 'ATM WITHDRAWAL BRANCH 4410', merchant: 'ATM Withdrawal', amount: -600.0, pool_id: null, cycle: 'cyc_2026_08', direction: 'out', mapped_by: null },
  { id: 'tx_21', date: '2026-09-08', account_id: 'acc_credit', description: 'POS PURCHASE ONLINE STORE 2214', merchant: 'Online Store', amount: -430.0, pool_id: null, cycle: 'cyc_2026_08', direction: 'out', mapped_by: null },
  // Husband's transactions
  { id: 'tx_h1', date: '2026-08-27', account_id: 'acc_cheque_him', description: 'POS PURCHASE ENGEN GARAGE 6612', merchant: 'Engen Garage', amount: -880.0, pool_id: 'pool_petrol_him', cycle: 'cyc_2026_08', direction: 'out', mapped_by: 'rule' },
  { id: 'tx_h2', date: '2026-09-04', account_id: 'acc_credit_him', description: 'VIRGIN ACTIVE DEBIT ORDER', merchant: 'Virgin Active', amount: -799.0, pool_id: 'pool_hobbies_him', cycle: 'cyc_2026_08', direction: 'out', mapped_by: 'commitment' },
  { id: 'tx_h3', date: '2026-09-02', account_id: 'acc_credit_him', description: 'DSTV DEBIT ORDER 991122', merchant: 'Dstv', amount: -459.0, pool_id: 'pool_subs_him', cycle: 'cyc_2026_08', direction: 'out', mapped_by: 'rule' },
  { id: 'tx_h4', date: '2026-09-05', account_id: 'acc_credit_him', description: 'POS PURCHASE GOLF SHOP 3391', merchant: 'Golf Shop', amount: -650.0, pool_id: null, cycle: 'cyc_2026_08', direction: 'out', mapped_by: null },
  // Previous cycle sample (for cycle switching)
  { id: 'tx_p1', date: '2026-08-01', account_id: 'acc_credit', description: 'POS PURCHASE WOOLWORTHS ROSEBANK 1121', merchant: 'Woolworths Rosebank', amount: -1500.0, pool_id: 'pool_groceries', cycle: 'cyc_2026_07', direction: 'out', mapped_by: 'rule' },
  { id: 'tx_p2', date: '2026-07-25', account_id: 'acc_cheque', description: 'SALARY DEPOSIT EMPLOYER PTY LTD', merchant: 'Salary', amount: 42000, pool_id: 'pool_income', cycle: 'cyc_2026_07', direction: 'in', mapped_by: 'rule' },
];

// ---- Income sources --------------------------------------------------------
export const mockIncomeSources: IncomeSource[] = [
  { id: 'inc_salary', label: 'Salary', amount_expected: 42000, day_of_month: 25, recurring: true, account_id: 'acc_cheque' },
  { id: 'inc_side', label: 'Side income', amount_expected: 0, day_of_month: 28, recurring: false, account_id: 'acc_cheque' },
  { id: 'inc_salary_him', label: "Husband's Salary", amount_expected: 26000, day_of_month: 25, recurring: true, account_id: 'acc_cheque_him' },
];
