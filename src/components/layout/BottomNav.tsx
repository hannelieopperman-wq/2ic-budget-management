import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { MoreHorizontal, LogOut } from 'lucide-react';
import { bottomNavItems, moreItems } from './navItems';
import { useApp } from '../../store/AppStore';

export function BottomNav() {
  const [moreOpen, setMoreOpen] = useState(false);
  const location = useLocation();
  const { logout } = useApp();
  const moreActive = moreItems.some((m) => location.pathname.startsWith(m.to));

  return (
    <>
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-blush/60 bg-cream/95 backdrop-blur lg:hidden">
        <div className="mx-auto flex max-w-lg items-stretch justify-around px-1 pb-[env(safe-area-inset-bottom)]">
          {bottomNavItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[11px] font-medium transition
                ${isActive ? 'text-plum' : 'text-plum-soft/70'}`
              }
            >
              {({ isActive }) => (
                <>
                  <span className={`grid h-8 w-12 place-items-center rounded-full transition ${isActive ? 'bg-blush' : ''}`}>
                    <Icon size={20} strokeWidth={isActive ? 2.4 : 2} />
                  </span>
                  {label}
                </>
              )}
            </NavLink>
          ))}
          <button
            onClick={() => setMoreOpen(true)}
            className={`flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[11px] font-medium transition
              ${moreActive ? 'text-plum' : 'text-plum-soft/70'}`}
          >
            <span className={`grid h-8 w-12 place-items-center rounded-full transition ${moreActive ? 'bg-blush' : ''}`}>
              <MoreHorizontal size={20} />
            </span>
            More
          </button>
        </div>
      </nav>

      {moreOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-label="More menu">
          <div className="absolute inset-0 bg-plum-ink/30 backdrop-blur-sm animate-fade-in" onClick={() => setMoreOpen(false)} />
          <div className="absolute inset-x-0 bottom-0 rounded-t-3xl bg-cream p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] shadow-lift animate-slide-up">
            <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-blush" />
            <h2 className="mb-4 font-serif text-xl text-plum-ink">More</h2>
            <div className="grid grid-cols-2 gap-3">
              {moreItems.map(({ to, label, icon: Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  onClick={() => setMoreOpen(false)}
                  className="flex items-center gap-3 rounded-2xl border border-blush/60 bg-white/60 px-4 py-4 text-sm font-medium text-plum transition hover:bg-blush-soft"
                >
                  <Icon size={20} className="text-rose" />
                  {label}
                </NavLink>
              ))}
            </div>
            <button
              onClick={() => {
                setMoreOpen(false);
                logout();
              }}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl bg-blush-soft px-4 py-3.5 text-sm font-semibold text-plum"
            >
              <LogOut size={18} />
              Sign out
            </button>
          </div>
        </div>
      )}
    </>
  );
}
