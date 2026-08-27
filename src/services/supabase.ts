import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// ---------------------------------------------------------------------------
// Live Supabase client. When `.env` isn't configured (local dev without a
// backing project), `supabase` is null and every caller in dataService.ts
// falls back to the in-memory mock data path instead. Never use a
// service-role key in the frontend — rely on RLS + auth.uid() for security.
// ---------------------------------------------------------------------------

export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;
export const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as
  | string
  | undefined;

export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_PUBLISHABLE_KEY);

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(SUPABASE_URL!, SUPABASE_PUBLISHABLE_KEY!)
  : null;
