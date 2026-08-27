import { useEffect, useState } from 'react';
import { Check, AlertTriangle, TrendingUp, Sparkles } from 'lucide-react';
import type { PoolHealth } from '../../utils/calculations';

const healthColor: Record<PoolHealth, string> = {
  under: '#20B7A4', // sage (brand teal)
  approaching: '#FF6F61', // rose (brand coral)
  reached: '#E2483A', // coral (danger red)
  over: '#C13327', // deeper danger red
};

const healthTrack: Record<PoolHealth, string> = {
  under: '#DFF3F0',
  approaching: '#FFE9E5',
  reached: '#FBDCD8',
  over: '#F8CFC8',
};

export function ProgressRing({
  pct,
  health,
  size = 88,
  stroke = 9,
  label,
  animate = true,
}: {
  pct: number; // 0..n
  health: PoolHealth;
  size?: number;
  stroke?: number;
  label?: string;
  animate?: boolean;
}) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.min(Math.max(pct, 0), 1);
  const target = circumference * (1 - clamped);
  const [offset, setOffset] = useState(animate ? circumference : target);

  useEffect(() => {
    if (!animate) {
      setOffset(target);
      return;
    }
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) {
      setOffset(target);
      return;
    }
    const id = requestAnimationFrame(() => setOffset(target));
    return () => cancelAnimationFrame(id);
  }, [target, animate, circumference]);

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={healthTrack[health]} strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={healthColor[health]}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 1s cubic-bezier(0.22,1,0.36,1)' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="tnum font-serif text-lg leading-none text-plum-ink">{Math.round(pct * 100)}%</span>
        {label && <span className="mt-0.5 text-[10px] font-medium uppercase tracking-wide text-plum-soft">{label}</span>}
      </div>
      {health === 'under' && pct < 0.75 && (
        <Sparkles size={14} className="absolute -right-0.5 -top-0.5 animate-sparkle text-champagne" aria-hidden />
      )}
    </div>
  );
}

export function StatusPill({ health }: { health: PoolHealth }) {
  const map: Record<PoolHealth, { icon: typeof Check; text: string; cls: string }> = {
    under: { icon: Check, text: 'Under budget', cls: 'bg-sage/25 text-sage-deep' },
    approaching: { icon: TrendingUp, text: 'Approaching', cls: 'bg-blush text-rose-deep' },
    reached: { icon: AlertTriangle, text: 'Budget reached', cls: 'bg-coral/20 text-coral-deep' },
    over: { icon: AlertTriangle, text: 'Over budget', cls: 'bg-coral/25 text-coral-deep' },
  };
  const { icon: Icon, text, cls } = map[health];
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${cls}`}>
      <Icon size={13} strokeWidth={2.5} />
      {text}
    </span>
  );
}
