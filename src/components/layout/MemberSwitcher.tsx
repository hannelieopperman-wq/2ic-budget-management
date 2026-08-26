import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Users } from 'lucide-react';
import { useApp } from '../../store/AppStore';
import { MemberAvatar } from '../ui/MemberAvatar';
import { ALL_MEMBERS } from '../../utils/members';

export function MemberSwitcher() {
  const { members, householdName, activeMemberId, setActiveMemberId } = useApp();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  // Only worth showing once there's more than one member to switch between.
  if (members.length === 0) return null;

  const activeMember = members.find((m) => m.id === activeMemberId);
  const activeLabel = activeMemberId === ALL_MEMBERS ? householdName : activeMember?.name ?? householdName;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="inline-flex items-center gap-2 rounded-full border border-blush bg-white/70 pl-2 pr-4 py-1.5
          text-sm font-semibold text-plum shadow-soft transition hover:bg-blush-soft min-h-[40px]"
      >
        {activeMember ? (
          <MemberAvatar member={activeMember} size={24} />
        ) : (
          <span className="grid h-6 w-6 place-items-center rounded-full bg-teal text-white">
            <Users size={13} />
          </span>
        )}
        {activeLabel}
        <ChevronDown size={15} className={`transition ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <ul
          role="listbox"
          className="absolute right-0 z-40 mt-2 w-56 overflow-hidden rounded-2xl border border-blush bg-cream shadow-lift animate-scale-in"
        >
          <li>
            <button
              role="option"
              aria-selected={activeMemberId === ALL_MEMBERS}
              onClick={() => {
                setActiveMemberId(ALL_MEMBERS);
                setOpen(false);
              }}
              className={`flex w-full items-center gap-2.5 px-4 py-3 text-sm transition hover:bg-blush-soft
                ${activeMemberId === ALL_MEMBERS ? 'bg-blush-soft font-semibold text-plum-ink' : 'text-plum-soft'}`}
            >
              <span className="grid h-6 w-6 place-items-center rounded-full bg-teal text-white">
                <Users size={13} />
              </span>
              {householdName}
            </button>
          </li>
          {members.map((m) => (
            <li key={m.id}>
              <button
                role="option"
                aria-selected={m.id === activeMemberId}
                onClick={() => {
                  setActiveMemberId(m.id);
                  setOpen(false);
                }}
                className={`flex w-full items-center gap-2.5 px-4 py-3 text-sm transition hover:bg-blush-soft
                  ${m.id === activeMemberId ? 'bg-blush-soft font-semibold text-plum-ink' : 'text-plum-soft'}`}
              >
                <MemberAvatar member={m} size={24} />
                {m.name}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
