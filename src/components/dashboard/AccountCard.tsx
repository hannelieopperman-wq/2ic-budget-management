import { Wallet, CreditCard, PiggyBank, Landmark } from 'lucide-react';
import { Card } from '../ui';
import { formatCurrency } from '../../utils/currency';
import { formatDate } from '../../utils/cycle';
import type { Account, AccountKind } from '../../types/budget';

const kindIcon: Record<AccountKind, typeof Wallet> = {
  cheque: Wallet,
  credit: CreditCard,
  savings: PiggyBank,
  other: Landmark,
};

const kindTone: Record<AccountKind, string> = {
  cheque: 'bg-sage/25 text-sage-deep',
  credit: 'bg-champagne/25 text-champagne-deep',
  savings: 'bg-blush text-rose-deep',
  other: 'bg-plum/10 text-plum',
};

export function AccountCard({ account, index = 0 }: { account: Account; index?: number }) {
  const Icon = kindIcon[account.kind];
  return (
    <Card className="p-5 animate-slide-up" style={{ animationDelay: `${120 + index * 40}ms` }}>
      <div className="mb-3 flex items-center gap-2.5">
        <div className={`grid h-9 w-9 place-items-center rounded-2xl ${kindTone[account.kind]}`}>
          <Icon size={17} />
        </div>
        <div>
          <p className="text-sm font-semibold text-plum-ink">{account.label}</p>
          <p className="text-xs text-plum-soft">as of {formatDate(account.as_of_date)}</p>
        </div>
      </div>
      <p className={`tnum font-serif text-2xl ${account.current_balance < 0 ? 'text-coral-deep' : 'text-plum-ink'}`}>
        {formatCurrency(account.current_balance)}
      </p>
      {account.kind === 'credit' && account.current_balance < 0 && (
        <p className="mt-1 text-xs text-plum-soft">Outstanding balance</p>
      )}
    </Card>
  );
}
