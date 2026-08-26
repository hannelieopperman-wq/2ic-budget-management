import { type ReactNode, type ButtonHTMLAttributes, type InputHTMLAttributes, type SelectHTMLAttributes, useEffect } from 'react';
import { X, Inbox, AlertCircle, Loader2 } from 'lucide-react';
import { assetUrl } from '../../utils/assetUrl';

// ---- Button ----------------------------------------------------------------
type Variant = 'primary' | 'secondary' | 'positive' | 'warning' | 'ghost';
interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  full?: boolean;
}
const variantClasses: Record<Variant, string> = {
  primary: 'bg-plum text-white hover:bg-plum-ink active:scale-[0.98] shadow-soft',
  secondary: 'bg-blush text-plum hover:bg-blush-soft active:scale-[0.98]',
  positive: 'bg-sage text-plum-ink hover:bg-sage-deep active:scale-[0.98]',
  warning: 'bg-coral text-white hover:bg-coral-deep active:scale-[0.98]',
  ghost: 'bg-transparent text-plum hover:bg-blush-soft active:scale-[0.98]',
};
export function Button({ variant = 'primary', full, className = '', children, ...rest }: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold
        min-h-[44px] transition-all duration-150 disabled:opacity-50 disabled:pointer-events-none
        ${variantClasses[variant]} ${full ? 'w-full' : ''} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}

// ---- Card ------------------------------------------------------------------
export function Card({
  children,
  className = '',
  as: Tag = 'div',
  ...rest
}: { children: ReactNode; className?: string; as?: 'div' | 'button' | 'section' } & Record<string, unknown>) {
  return (
    <Tag
      className={`bg-cream rounded-3xl shadow-card border border-blush/40 ${className}`}
      {...rest}
    >
      {children}
    </Tag>
  );
}

// ---- Badge -----------------------------------------------------------------
type BadgeTone = 'sage' | 'blush' | 'coral' | 'plum' | 'champagne' | 'neutral';
const badgeTone: Record<BadgeTone, string> = {
  sage: 'bg-sage/25 text-sage-deep',
  blush: 'bg-blush text-plum',
  coral: 'bg-coral/20 text-coral-deep',
  plum: 'bg-plum/10 text-plum',
  champagne: 'bg-champagne/25 text-champagne-deep',
  neutral: 'bg-plum/8 text-plum-soft',
};
export function Badge({ tone = 'neutral', children, className = '' }: { tone?: BadgeTone; children: ReactNode; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${badgeTone[tone]} ${className}`}>
      {children}
    </span>
  );
}

// ---- Input -----------------------------------------------------------------
interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}
export function Input({ label, id, className = '', ...rest }: InputProps) {
  return (
    <label className="block">
      {label && <span className="mb-1.5 block text-sm font-medium text-plum-soft">{label}</span>}
      <input
        id={id}
        className={`w-full rounded-2xl border border-blush bg-white/70 px-4 py-3 text-plum-ink
          placeholder:text-plum-soft/50 focus:border-rose focus:outline-none focus:ring-2 focus:ring-rose/30
          transition ${className}`}
        {...rest}
      />
    </label>
  );
}

// ---- Select ----------------------------------------------------------------
interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
}
export function Select({ label, id, className = '', children, ...rest }: SelectProps) {
  return (
    <label className="block">
      {label && <span className="mb-1.5 block text-sm font-medium text-plum-soft">{label}</span>}
      <select
        id={id}
        className={`w-full appearance-none rounded-2xl border border-blush bg-white/70 px-4 py-3 text-plum-ink
          focus:border-rose focus:outline-none focus:ring-2 focus:ring-rose/30 transition
          bg-[url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%235B3A4B' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")] bg-[length:16px] bg-[right_1rem_center] bg-no-repeat pr-10
          ${className}`}
        {...rest}
      >
        {children}
      </select>
    </label>
  );
}

// ---- Modal -----------------------------------------------------------------
export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  /** Rendered in a bar pinned to the bottom of the modal — always visible, no scrolling needed. */
  footer?: ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-plum-ink/30 backdrop-blur-sm animate-fade-in" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="relative flex w-full sm:max-w-lg flex-col bg-cream rounded-t-3xl sm:rounded-3xl shadow-lift
          animate-scale-in max-h-[90vh]"
      >
        <div className="sticky top-0 z-10 flex shrink-0 items-center justify-between border-b border-blush/50 bg-cream/95 px-6 py-4 backdrop-blur">
          <h2 className="font-serif text-xl text-plum-ink">{title}</h2>
          <button onClick={onClose} aria-label="Close" className="rounded-full p-2 text-plum-soft hover:bg-blush-soft">
            <X size={20} />
          </button>
        </div>
        <div className="overflow-y-auto p-6">{children}</div>
        {footer && (
          <div className="sticky bottom-0 shrink-0 border-t border-blush/50 bg-cream/95 px-6 py-4 backdrop-blur">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

// ---- Empty / Loading / Error ----------------------------------------------
export function EmptyState({
  icon,
  title,
  message,
  showMascot = false,
}: {
  icon?: ReactNode;
  title: string;
  message: string;
  /** Show the 2IC mascot instead of a plain icon — nice for friendlier, less-frequent empty states. */
  showMascot?: boolean;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-blush bg-cream/50 px-6 py-16 text-center">
      {showMascot ? (
        <img src={assetUrl('brand/mascot.png')} alt="" className="mb-4 h-16 w-16 rounded-full object-cover shadow-soft" />
      ) : (
        <div className="mb-4 rounded-full bg-blush-soft p-4 text-rose">{icon ?? <Inbox size={28} />}</div>
      )}
      <h3 className="mb-1 font-serif text-lg text-plum-ink">{title}</h3>
      <p className="max-w-sm text-sm text-plum-soft">{message}</p>
    </div>
  );
}

export function LoadingState({ label = 'Loading' }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-16 text-plum-soft">
      <Loader2 className="animate-spin" size={20} />
      <span className="text-sm">{label}…</span>
    </div>
  );
}

export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded-2xl bg-blush/40 ${className}`} />;
}

export function ErrorState({ title, message, onRetry }: { title: string; message: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-3xl border border-coral/30 bg-coral/5 px-6 py-12 text-center">
      <div className="mb-3 rounded-full bg-coral/15 p-3 text-coral-deep">
        <AlertCircle size={26} />
      </div>
      <h3 className="mb-1 font-serif text-lg text-plum-ink">{title}</h3>
      <p className="mb-4 max-w-sm text-sm text-plum-soft">{message}</p>
      {onRetry && <Button variant="secondary" onClick={onRetry}>Try again</Button>}
    </div>
  );
}
