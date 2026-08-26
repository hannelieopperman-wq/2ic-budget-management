import { Home, Wallet, CalendarClock, Receipt, ListOrdered, Upload, Settings, CreditCard, BarChart3, BookOpen, PiggyBank } from 'lucide-react';

export interface NavItem {
  to: string;
  label: string;
  icon: typeof Home;
}

// Full desktop sidebar
export const sidebarItems: NavItem[] = [
  { to: '/', label: 'Home', icon: Home },
  { to: '/pools', label: 'Pools', icon: Wallet },
  { to: '/commitments', label: 'Commitments', icon: CalendarClock },
  { to: '/transactions', label: 'Transactions', icon: Receipt },
  { to: '/savings', label: 'Savings', icon: PiggyBank },
  { to: '/reports', label: 'Reports', icon: BarChart3 },
  { to: '/rules', label: 'Rules', icon: ListOrdered },
  { to: '/import', label: 'Import', icon: Upload },
  { to: '/settings', label: 'Settings', icon: Settings },
  { to: '/guide', label: 'How to use', icon: BookOpen },
];

// Primary mobile bottom nav (5 items; last is "More")
export const bottomNavItems: NavItem[] = [
  { to: '/', label: 'Home', icon: Home },
  { to: '/pools', label: 'Pools', icon: Wallet },
  { to: '/commitments', label: 'Commitments', icon: CalendarClock },
  { to: '/transactions', label: 'Transactions', icon: Receipt },
];

// Items exposed under "More" on mobile
export const moreItems: NavItem[] = [
  { to: '/savings', label: 'Savings', icon: PiggyBank },
  { to: '/reports', label: 'Reports', icon: BarChart3 },
  { to: '/rules', label: 'Rules', icon: ListOrdered },
  { to: '/import', label: 'Import', icon: Upload },
  { to: '/settings', label: 'Settings', icon: Settings },
  { to: '/accounts', label: 'Accounts', icon: CreditCard },
  { to: '/guide', label: 'How to use', icon: BookOpen },
];
