import { AlertTriangle, CheckCircle2, Info, Sparkles } from 'lucide-react';
import { Card } from '../ui';
import type { Insight, InsightTone } from '../../utils/insights';

const toneStyle: Record<InsightTone, { icon: typeof AlertTriangle; cls: string }> = {
  warning: { icon: AlertTriangle, cls: 'bg-coral/10 text-coral-deep' },
  positive: { icon: CheckCircle2, cls: 'bg-sage/15 text-sage-deep' },
  neutral: { icon: Info, cls: 'bg-champagne/15 text-champagne-deep' },
};

export function InsightsPanel({ insights }: { insights: Insight[] }) {
  return (
    <Card className="p-6 animate-slide-up">
      <div className="mb-4 flex items-center gap-2.5">
        <div className="grid h-9 w-9 place-items-center rounded-2xl bg-blush text-rose-deep">
          <Sparkles size={17} />
        </div>
        <h3 className="font-serif text-lg text-plum-ink">Insights</h3>
      </div>

      {insights.length === 0 ? (
        <p className="text-sm text-plum-soft">
          Nothing stands out yet — check back once you've imported a few cycles of transactions.
        </p>
      ) : (
        <div className="space-y-2.5">
          {insights.map((insight) => {
            const { icon: Icon, cls } = toneStyle[insight.tone];
            return (
              <div key={insight.id} className={`flex items-start gap-3 rounded-2xl px-4 py-3 ${cls}`}>
                <Icon size={18} className="mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-semibold">{insight.title}</p>
                  <p className="mt-0.5 text-sm opacity-90">{insight.message}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
