import { createClient } from '@supabase/supabase-js';
import { env } from '../config/env';

// Admin client — full DB access. Server-side only. NEVER expose to client.
export const supabaseAdmin = createClient(
  env.supabase.url,
  env.supabase.serviceRoleKey,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

// Public client — respects Row Level Security policies
export const supabase = createClient(env.supabase.url, env.supabase.anonKey);
