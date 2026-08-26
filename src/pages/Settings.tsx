import { AppShell } from '../components/layout/AppShell';
import { MembersSettings } from '../components/settings/MembersSettings';
import { IncomeSources } from '../components/settings/IncomeSources';
import { AccountSettings } from '../components/settings/AccountSettings';

export function Settings() {
  return (
    <AppShell title="Settings" subtitle="Household, income & accounts">
      <div className="space-y-5">
        <MembersSettings />
        <IncomeSources />
        <AccountSettings />
      </div>
    </AppShell>
  );
}
