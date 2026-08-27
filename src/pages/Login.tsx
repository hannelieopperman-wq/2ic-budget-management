import { useState, type FormEvent } from 'react';
import { Home, AlertCircle } from 'lucide-react';
import { Button, Input } from '../components/ui';
import { useApp } from '../store/AppStore';
import { assetUrl } from '../utils/assetUrl';
import { supabase, isSupabaseConfigured } from '../services/supabase';

type Mode = 'signin' | 'signup';

export function Login() {
  const { login, householdName, householdAvatarUrl } = useApp();
  const [mode, setMode] = useState<Mode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);

    if (!isSupabaseConfigured) {
      // Local demo fallback — no real backend configured, anything signs in.
      login();
      return;
    }

    setSubmitting(true);
    try {
      if (mode === 'signup') {
        const { error: signUpError } = await supabase!.auth.signUp({ email, password });
        if (signUpError) throw signUpError;
        setInfo('Check your email to confirm your account, then sign in.');
        setMode('signin');
      } else {
        const { error: signInError } = await supabase!.auth.signInWithPassword({ email, password });
        if (signInError) throw signInError;
        // Success: AppStore's onAuthStateChange listener picks up the new
        // session and routing takes over — nothing more to do here.
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong — please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const onForgotPassword = async () => {
    setError(null);
    setInfo(null);
    if (!email.trim()) {
      setError('Enter your email above first, then try again.');
      return;
    }
    if (!isSupabaseConfigured) return;
    try {
      const { error: resetError } = await supabase!.auth.resetPasswordForEmail(email.trim());
      if (resetError) throw resetError;
      setInfo('Check your email for a password reset link.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send a reset email — please try again.');
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-cream px-5 py-10">
      {/* restrained blush gradient wash */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full opacity-70 blur-3xl"
        style={{ background: 'radial-gradient(circle, rgba(246,234,224,0.9), transparent 70%)' }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-32 -right-10 h-72 w-72 rounded-full opacity-50 blur-3xl"
        style={{ background: 'radial-gradient(circle, rgba(246,184,78,0.35), transparent 70%)' }}
      />

      <div className="relative w-full max-w-sm animate-slide-up">
        <div className="mb-8 text-center">
          {householdAvatarUrl ? (
            <img
              src={householdAvatarUrl}
              alt=""
              className="mx-auto mb-4 h-20 w-20 rounded-full object-cover shadow-hero ring-4 ring-white"
            />
          ) : (
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-plum shadow-hero ring-4 ring-white">
              <Home size={30} className="text-cream" strokeWidth={2} />
            </div>
          )}
          <h1 className="font-serif text-3xl text-teal">
            2IC <span className="text-coral">Budget Management</span>
          </h1>
          <p className="mt-1.5 text-sm text-plum-soft">Plan smarter. Spend wiser. Live easier.</p>
          <p className="mt-0.5 text-xs text-plum-soft/70">{householdName}</p>
        </div>

        <form onSubmit={onSubmit} className="rounded-3xl border border-blush/50 bg-cream/80 p-6 shadow-card backdrop-blur">
          <div className="space-y-4">
            <Input
              label="Email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
              required
              minLength={isSupabaseConfigured ? 6 : undefined}
            />
          </div>

          {error && (
            <p className="mt-4 flex items-start gap-2 rounded-2xl bg-coral/10 px-4 py-3 text-xs text-coral-deep">
              <AlertCircle size={14} className="mt-0.5 shrink-0" />
              {error}
            </p>
          )}
          {info && (
            <p className="mt-4 rounded-2xl bg-sage/15 px-4 py-3 text-xs text-sage-deep">{info}</p>
          )}

          <div className="mt-4 flex items-center justify-between">
            <button
              type="button"
              onClick={() => {
                setMode((m) => (m === 'signin' ? 'signup' : 'signin'));
                setError(null);
                setInfo(null);
              }}
              className="text-sm font-medium text-plum-soft hover:underline"
            >
              {mode === 'signin' ? 'New household? Create an account' : 'Already have one? Sign in'}
            </button>
            {mode === 'signin' && (
              <button type="button" onClick={onForgotPassword} className="text-sm font-medium text-coral hover:underline">
                Forgot password?
              </button>
            )}
          </div>

          <Button type="submit" full className="mt-6 !bg-teal hover:!bg-teal-deep" disabled={submitting}>
            {submitting ? 'Please wait…' : mode === 'signup' ? 'Create account' : 'Sign in'}
          </Button>
        </form>

        {!isSupabaseConfigured && (
          <div className="mt-5 flex items-center justify-center gap-2 text-xs text-plum-soft/70">
            <img src={assetUrl('brand/mascot.png')} alt="" className="h-6 w-6 rounded-full object-cover" />
            Demo mode · no real account required
          </div>
        )}
      </div>
    </div>
  );
}
