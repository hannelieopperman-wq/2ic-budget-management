import { AppShell } from '../components/layout/AppShell';
import { AccountSettings } from '../components/settings/AccountSettings';

export function Accounts() {
  return (
    <AppShell title="Accounts" subtitle="Cheque & credit card balances">
      <AccountSettings />
    </AppShell>
  );
}
