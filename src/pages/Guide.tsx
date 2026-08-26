import { type ReactNode } from 'react';
import {
  Sparkles,
  Users,
  Wallet,
  CalendarClock,
  Upload,
  Receipt,
  ListOrdered,
  BarChart3,
  ShieldCheck,
} from 'lucide-react';
import { AppShell } from '../components/layout/AppShell';
import { Card } from '../components/ui';

function GuideSection({
  icon: Icon,
  step,
  title,
  children,
}: {
  icon: typeof Sparkles;
  step: number;
  title: string;
  children: ReactNode;
}) {
  return (
    <Card className="p-6 animate-slide-up">
      <div className="mb-3 flex items-center gap-3">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-blush text-rose-deep">
          <Icon size={19} />
        </div>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-plum-soft">Step {step}</p>
          <h2 className="font-serif text-lg text-plum-ink">{title}</h2>
        </div>
      </div>
      <div className="space-y-2 pl-[52px] text-sm leading-relaxed text-plum-soft">{children}</div>
    </Card>
  );
}

export function Guide() {
  return (
    <AppShell title="How to use 2IC Budget" subtitle="A quick walkthrough, start to finish">
      <div className="space-y-4">
        <Card className="p-6 animate-slide-up">
          <div className="flex items-center gap-3">
            <ShieldCheck size={22} className="text-teal" />
            <p className="font-serif text-xl text-plum-ink">The big idea</p>
          </div>
          <p className="mt-2 text-sm leading-relaxed text-plum-soft">
            Every rand gets a home in an envelope (a "pool"), your recurring bills ("commitments") are tracked
            separately so nothing catches you off guard, and <strong className="text-plum">Safe to Spend</strong> on
            the Home screen always shows what's genuinely free to spend right now — after what's still coming off
            and what's reserved for essentials.
          </p>
        </Card>

        <GuideSection icon={Users} step={1} title="Set up your profiles">
          <p>
            Go to <strong className="text-plum">Settings</strong> and give your household a name (e.g. "Joubert
            Family"), then add a profile for each person with their own name and photo.
          </p>
          <p>
            The switcher in the header (top right) lets you flip between <strong className="text-plum">Combined</strong>{' '}
            and each person's individual view — pools, accounts and spending marked as shared always show in every
            view; anything marked to one person only shows there and in Combined.
          </p>
        </GuideSection>

        <GuideSection icon={Wallet} step={2} title="Add your accounts and pools">
          <p>
            In <strong className="text-plum">Settings → Accounts</strong>, add your cheque account, credit card,
            and any savings accounts — enter the current balance for each.
          </p>
          <p>
            In <strong className="text-plum">Pools</strong>, set up your budget categories (Groceries, Petrol,
            Subscriptions...). Mark the essential ones as "Reserve as essential" so Safe to Spend holds that money
            back automatically.
          </p>
        </GuideSection>

        <GuideSection icon={CalendarClock} step={3} title="Add your commitments">
          <p>
            Go to <strong className="text-plum">Commitments</strong> and add your recurring debit orders — loan
            repayments, insurance, subscriptions. Give each one a <em>search term</em>: a distinctive word from how
            it appears on your bank statement (e.g. "DISCOVERY" for a Discovery debit order).
          </p>
        </GuideSection>

        <GuideSection icon={Upload} step={4} title="Import your bank statement">
          <p>
            Go to <strong className="text-plum">Import</strong> and upload your bank's CSV export. The app finds
            the real transaction rows automatically — no need to clean up the file first.
          </p>
          <p>Every transaction is matched in this order:</p>
          <ol className="ml-4 list-decimal space-y-1">
            <li>
              <strong className="text-plum">Commitment match</strong> — if it matches an unpaid commitment on that
              account, it's linked automatically and the commitment is marked paid.
            </li>
            <li>
              <strong className="text-plum">Rule match</strong> — otherwise, your saved rules assign it to a pool.
            </li>
            <li>
              <strong className="text-plum">Unmapped</strong> — if nothing matches, it's flagged for you to sort
              out by hand.
            </li>
          </ol>
        </GuideSection>

        <GuideSection icon={Receipt} step={5} title="Clean up anything unmapped">
          <p>
            On <strong className="text-plum">Transactions</strong>, tap any unmapped row. If it's actually paying
            one of your commitments, pick it from the dropdown — the app remembers the wording so future
            statements match it on their own. Otherwise, just assign it to a pool, and tick{' '}
            <em>"Save as rule"</em> so the same merchant auto-maps next time too.
          </p>
        </GuideSection>

        <GuideSection icon={ListOrdered} step={6} title="Fine-tune your rules">
          <p>
            <strong className="text-plum">Rules</strong> shows every automatic mapping rule, evaluated in priority
            order — the first match wins. Drag to reorder, and put more specific terms (like "RATES AND WATER")
            above broader ones (like "RATES") so they get checked first.
          </p>
        </GuideSection>

        <GuideSection icon={BarChart3} step={7} title="Check Reports for the bigger picture">
          <p>
            <strong className="text-plum">Reports</strong> shows spending trends across cycles, a breakdown by pool
            and by household member, and an <strong className="text-plum">Insights</strong> panel that flags things
            worth knowing — pools trending up, cashflow warnings if upcoming bills might outpace your balance, and
            streaks worth celebrating. Export a PDF or Excel copy any time — income figures are always left out of
            exports and the Income card, by design.
          </p>
        </GuideSection>

        <Card className="p-6 animate-slide-up">
          <p className="font-serif text-lg text-plum-ink">That's it</p>
          <p className="mt-2 text-sm leading-relaxed text-plum-soft">
            Each new cycle, most of this runs itself — import your statement, glance at what's unmapped, and check
            Safe to Spend before you make a big purchase. The cycle switcher in the header always shows which
            25th-to-24th window you're looking at.
          </p>
        </Card>
      </div>
    </AppShell>
  );
}
