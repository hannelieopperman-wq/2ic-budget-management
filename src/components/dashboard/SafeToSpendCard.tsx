import { ShieldCheck } from 'lucide-react';
import { formatCurrency } from '../../utils/currency';

export function SafeToSpendCard({ amount, cycleLabel }: { amount: number; cycleLabel: string }) {
  return (
    <section
      className="relative overflow-hidden rounded-3xl bg-plum px-6 py-8 text-cream shadow-hero animate-slide-up sm:px-10 sm:py-10"
      aria-label="Safe to spend"
    >
      {/* soft radial bloom — the signature accent */}
      <div
        aria-hidden
        className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full opacity-70 blur-2xl"
        style={{ background: 'radial-gradient(circle, rgba(217,140,160,0.55), transparent 70%)' }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-24 -left-10 h-64 w-64 rounded-full opacity-50 blur-2xl"
        style={{ background: 'radial-gradient(circle, rgba(217,190,134,0.4), transparent 70%)' }}
      />

      <div className="relative">
        <div className="mb-1 flex items-center gap-2 text-blush/90">
          <ShieldCheck size={16} />
          <span className="text-xs font-semibold uppercase tracking-[0.18em]">Safe to spend</span>
        </div>
        <p className="tnum font-serif text-5xl leading-none tracking-tight sm:text-6xl">
          {formatCurrency(amount)}
        </p>
        <p className="mt-3 max-w-sm text-sm text-blush/80">
          After upcoming commitments and essential reserves · {cycleLabel}
        </p>
      </div>
    </section>
  );
}
