import { Link } from 'react-router-dom';
import { AlertTriangle, ChevronRight } from 'lucide-react';

export interface AlertItem {
  id: string;
  text: string;
  to: string;
  tone: 'coral' | 'champagne' | 'blush';
}

const toneCls: Record<AlertItem['tone'], string> = {
  coral: 'bg-coral/10 text-coral-deep',
  champagne: 'bg-champagne/15 text-champagne-deep',
  blush: 'bg-blush text-rose-deep',
};

export function AlertStrip({ alerts }: { alerts: AlertItem[] }) {
  if (alerts.length === 0) return null;
  return (
    <div className="space-y-2 animate-fade-in">
      {alerts.map((a) => (
        <Link
          key={a.id}
          to={a.to}
          className={`flex items-center justify-between gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition hover:brightness-[0.98] ${toneCls[a.tone]}`}
        >
          <span className="flex items-center gap-2.5">
            <AlertTriangle size={16} className="shrink-0" />
            {a.text}
          </span>
          <ChevronRight size={16} className="shrink-0 opacity-70" />
        </Link>
      ))}
    </div>
  );
}
