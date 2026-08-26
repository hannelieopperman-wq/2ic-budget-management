import { NavLink } from 'react-router-dom';
import { CreditCard, LogOut } from 'lucide-react';
import { sidebarItems } from './navItems';
import { useApp } from '../../store/AppStore';
import { assetUrl } from '../../utils/assetUrl';

export function Sidebar() {
  const { logout, householdName } = useApp();
  return (
    <aside className="hidden lg:flex lg:w-64 xl:w-72 shrink-0 flex-col border-r border-blush/50 bg-cream-deep/60 px-4 py-6">
      <div className="mb-8 px-3">
        <div className="flex items-start gap-2.5">
          <img
            src={assetUrl('brand/couple-avatar.png')}
            alt=""
            className="mt-0.5 h-9 w-9 shrink-0 rounded-full object-cover ring-2 ring-teal/20"
          />
          <div className="min-w-0">
            <p className="font-serif text-lg leading-tight text-teal">
              2IC <span className="text-coral">Budget</span>
            </p>
            <p className="truncate text-xs text-plum-soft">{householdName}</p>
          </div>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-1">
        {sidebarItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `group flex items-center gap-3 rounded-2xl px-3.5 py-2.5 text-sm font-medium transition
              ${isActive ? 'bg-plum text-cream shadow-soft' : 'text-plum-soft hover:bg-blush-soft hover:text-plum'}`
            }
          >
            {({ isActive }) => (
              <>
                <Icon size={18} className={isActive ? 'text-cream' : 'text-rose'} />
                {label}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="mt-4 border-t border-blush/60 pt-4">
        <NavLink
          to="/accounts"
          className={({ isActive }) =>
            `flex items-center gap-3 rounded-2xl px-3.5 py-2.5 text-sm font-medium transition
            ${isActive ? 'bg-plum text-cream' : 'text-plum-soft hover:bg-blush-soft hover:text-plum'}`
          }
        >
          {({ isActive }) => (
            <>
              <CreditCard size={18} className={isActive ? 'text-cream' : 'text-rose'} />
              Accounts
            </>
          )}
        </NavLink>
        <button
          onClick={logout}
          className="mt-1 flex w-full items-center gap-3 rounded-2xl px-3.5 py-2.5 text-sm font-medium text-plum-soft transition hover:bg-blush-soft hover:text-plum"
        >
          <LogOut size={18} className="text-rose" />
          Sign out
        </button>
      </div>
    </aside>
  );
}
