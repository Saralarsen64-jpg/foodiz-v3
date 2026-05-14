import { createClient } from '@supabase/supabase-js';

const rawUrl = import.meta.env.VITE_SUPABASE_URL?.trim();
const rawAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();

const looksLikePlaceholder = (value = '') =>
  value.includes('your_supabase') || value.includes('your_supabase_anon_key_here');

export const isSupabaseConfigured = Boolean(
  rawUrl && rawAnonKey && !looksLikePlaceholder(rawUrl) && !looksLikePlaceholder(rawAnonKey)
);

export const supabaseConfigError = isSupabaseConfigured
  ? null
  : 'Configuration Supabase absente. Renseignez VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY dans un fichier .env local.';

if (!isSupabaseConfigured) {
  console.warn(`[Foodiz] ${supabaseConfigError}`);
}

export const supabase = isSupabaseConfigured
  ? createClient(rawUrl, rawAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
      },
    })
  : null;
