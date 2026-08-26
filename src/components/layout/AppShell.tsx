import { type ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { BottomNav } from './BottomNav';
import { CycleSwitcher } from './CycleSwitcher';
import { MemberSwitcher } from './MemberSwitcher';

export function AppShell({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  return (
    <div className="flex min-h-screen bg-cream">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 border-b border-blush/50 bg-cream/85 backdrop-blur">
          <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6">
            <div className="min-w-0">
              <h1 className="truncate font-serif text-2xl leading-tight text-plum-ink sm:text-[28px]">{title}</h1>
              {subtitle && <p className="truncate text-sm text-plum-soft">{subtitle}</p>}
            </div>
            <div className="flex items-center gap-2">
              <MemberSwitcher />
              <CycleSwitcher />
            </div>
          </div>
        </header>
        <main className="mx-auto w-full max-w-5xl flex-1 px-4 pb-28 pt-5 sm:px-6 lg:pb-10">{children}</main>
      </div>
      <BottomNav />
    </div>
  );
}
