// ---------------------------------------------------------------------------
// PHASE 2 PLACEHOLDER — Supabase is NOT connected yet.
//
// This module intentionally does not create a live client. It documents the
// intended service surface so the UI can be wired to Supabase cleanly later.
// For now, the app reads and writes an in-memory store (see AppStore).
//
// When Phase 2 begins:
//   import { createClient } from '@supabase/supabase-js';
//   export const supabase = createClient(
//     import.meta.env.VITE_SUPABASE_URL,
//     import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
//   );
// Never use a service-role key in the frontend. Rely on RLS + auth.uid().
// ---------------------------------------------------------------------------

export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;
export const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as
  | string
  | undefined;

export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_PUBLISHABLE_KEY);
