import { TrendingUp, TrendingDown, Minus, Info } from 'lucide-react';
import { Card } from '../ui';
import { formatCurrency } from '../../utils/currency';

export function IncomeCard({
  expected,
  received,
  variance,
  belowExpected,
  showWarning,
}: {
  expected: number;
  received: number;
  variance: number;
  belowExpected: boolean;
  showWarning: boolean;
}) {
  return (
    <Card className="p-6 animate-slide-up" style={{ animationDelay: '60ms' }}>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-serif text-lg text-plum-ink">Income this cycle</h2>
        <span className="inline-flex items-center gap-1 text-xs text-plum-soft">
          <Info size={13} /> You enter this
        </span>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Figure label="Expected" value={formatCurrency(expected)} />
        <Figure label="Received" value={formatCurrency(received)} />
        <Figure
          label="Variance"
          value={formatCurrency(variance)}
          icon={belowExpected ? TrendingDown : showWarning ? Minus : TrendingUp}
          tone={belowExpected ? 'coral' : 'sage'}
        />
      </div>

      {showWarning && (
        <div className="mt-4 flex items-start gap-2.5 rounded-2xl bg-champagne/15 px-4 py-3 text-sm text-plum">
          <TrendingDown size={16} className="mt-0.5 shrink-0 text-champagne-deep" />
          <span>Income is still below expected for this cycle.</span>
        </div>
      )}
    </Card>
  );
}

function Figure({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string;
  icon?: typeof TrendingUp;
  tone?: 'sage' | 'coral';
}) {
  const toneCls = tone === 'coral' ? 'text-coral-deep' : tone === 'sage' ? 'text-sage-deep' : 'text-plum-ink';
  return (
    <div className="rounded-2xl bg-blush-soft/60 px-3 py-3">
      <p className="mb-1 text-xs font-medium uppercase tracking-wide text-plum-soft">{label}</p>
      <p className={`tnum flex items-center gap-1 text-sm font-semibold ${toneCls}`}>
        {Icon && <Icon size={14} />}
        {value}
      </p>
    </div>
  );
}
