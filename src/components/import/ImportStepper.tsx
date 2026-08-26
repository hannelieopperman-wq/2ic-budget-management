import { Check } from 'lucide-react';

const STEPS = ['Upload', 'Choose Account', 'Preview & Mapping', 'Confirm', 'Complete'];

export function ImportStepper({ current }: { current: number }) {
  return (
    <>
      {/* Desktop horizontal stepper */}
      <ol className="mb-8 hidden items-center sm:flex">
        {STEPS.map((label, i) => {
          const done = i < current;
          const active = i === current;
          return (
            <li key={label} className="flex flex-1 items-center last:flex-none">
              <div className="flex flex-col items-center">
                <div
                  className={`grid h-9 w-9 place-items-center rounded-full text-sm font-semibold transition
                    ${done ? 'bg-sage text-plum-ink' : active ? 'bg-plum text-cream shadow-soft' : 'bg-blush text-plum-soft'}`}
                >
                  {done ? <Check size={16} /> : i + 1}
                </div>
                <span className={`mt-1.5 text-xs font-medium ${active ? 'text-plum-ink' : 'text-plum-soft'}`}>{label}</span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`mx-2 h-0.5 flex-1 rounded-full ${done ? 'bg-sage' : 'bg-blush'}`} />
              )}
            </li>
          );
        })}
      </ol>

      {/* Mobile compact indicator */}
      <div className="mb-6 flex items-center gap-2 sm:hidden">
        {STEPS.map((_, i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full transition ${i <= current ? 'bg-plum' : 'bg-blush'}`}
          />
        ))}
        <span className="ml-2 shrink-0 text-xs font-semibold text-plum-soft">
          {current + 1}/{STEPS.length}
        </span>
      </div>
      <p className="mb-4 -mt-4 font-serif text-lg text-plum-ink sm:hidden">{STEPS[current]}</p>
    </>
  );
}
