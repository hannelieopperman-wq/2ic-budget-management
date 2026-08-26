import { useState, type FormEvent } from 'react';
import { Button, Input } from '../components/ui';
import { useApp } from '../store/AppStore';
import { assetUrl } from '../utils/assetUrl';

export function Login() {
  const { login, householdName } = useApp();
  const [remember, setRemember] = useState(true);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    // Mock auth only — no real credentials. Phase 2 wires Supabase Auth here.
    login();
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-cream px-5 py-10">
      {/* restrained blush gradient wash */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full opacity-70 blur-3xl"
        style={{ background: 'radial-gradient(circle, rgba(247,227,230,0.9), transparent 70%)' }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-32 -right-10 h-72 w-72 rounded-full opacity-50 blur-3xl"
        style={{ background: 'radial-gradient(circle, rgba(217,190,134,0.35), transparent 70%)' }}
      />

      <div className="relative w-full max-w-sm animate-slide-up">
        <div className="mb-8 text-center">
          <img
            src={assetUrl('brand/couple-avatar.png')}
            alt=""
            className="mx-auto mb-4 h-20 w-20 rounded-full object-cover shadow-hero ring-4 ring-white"
          />
          <h1 className="font-serif text-3xl text-teal">
            2IC <span className="text-coral">Budget Management</span>
          </h1>
          <p className="mt-1.5 text-sm text-plum-soft">Plan smarter. Spend wiser. Live easier.</p>
          <p className="mt-0.5 text-xs text-plum-soft/70">{householdName}</p>
        </div>

        <form onSubmit={onSubmit} className="rounded-3xl border border-blush/50 bg-cream/80 p-6 shadow-card backdrop-blur">
          <div className="space-y-4">
            <Input label="Email" type="email" placeholder="you@example.com" defaultValue="demo@2ic.app" autoComplete="email" />
            <Input label="Password" type="password" placeholder="••••••••" defaultValue="demo" autoComplete="current-password" />
          </div>

          <div className="mt-4 flex items-center justify-between">
            <label className="flex cursor-pointer items-center gap-2 text-sm text-plum-soft">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="h-4 w-4 rounded border-blush text-teal accent-teal"
              />
              Remember me
            </label>
            <button type="button" className="text-sm font-medium text-coral hover:underline">
              Forgot password?
            </button>
          </div>

          <Button type="submit" full className="mt-6 !bg-teal hover:!bg-teal-deep">
            Sign in
          </Button>
        </form>

        <div className="mt-5 flex items-center justify-center gap-2 text-xs text-plum-soft/70">
          <img src={assetUrl('brand/mascot.png')} alt="" className="h-6 w-6 rounded-full object-cover" />
          Demo mode · no real account required
        </div>
      </div>
    </div>
  );
}
