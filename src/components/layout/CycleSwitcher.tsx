import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Calendar } from 'lucide-react';
import { useApp } from '../../store/AppStore';

export function CycleSwitcher() {
  const { cycles, activeCycle, setActiveCycleId } = useApp();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="inline-flex items-center gap-2 rounded-full border border-blush bg-white/70 px-4 py-2
          text-sm font-semibold text-plum shadow-soft transition hover:bg-blush-soft min-h-[40px]"
      >
        <Calendar size={15} className="text-rose" />
        <span className="tnum">{activeCycle.label}</span>
        <ChevronDown size={15} className={`transition ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <ul
          role="listbox"
          className="absolute right-0 z-40 mt-2 w-52 overflow-hidden rounded-2xl border border-blush bg-cream shadow-lift animate-scale-in"
        >
          {cycles.map((c) => (
            <li key={c.id}>
              <button
                role="option"
                aria-selected={c.id === activeCycle.id}
                onClick={() => {
                  setActiveCycleId(c.id);
                  setOpen(false);
                }}
                className={`flex w-full items-center justify-between px-4 py-3 text-sm transition hover:bg-blush-soft
                  ${c.id === activeCycle.id ? 'bg-blush-soft font-semibold text-plum-ink' : 'text-plum-soft'}`}
              >
                <span className="tnum">{c.label}</span>
                {c.id === activeCycle.id && <span className="h-2 w-2 rounded-full bg-rose" />}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
