import { createClient } from "@supabase/supabase-js";

const env = import.meta.env || {};
const supabaseUrl = String(env.VITE_SUPABASE_URL || "").trim();
const supabaseKey = String(env.VITE_SUPABASE_ANON_KEY || "").trim();
const looksConfigured = /^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(supabaseUrl)
  && supabaseKey.length > 20
  && !/^your[_-]/i.test(supabaseKey);

export const isSupabaseConfigured = looksConfigured;

export const supabase = looksConfigured
  ? createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    })
  : null;

function redirectUrl() {
  return typeof window !== "undefined" ? `${window.location.origin}${window.location.pathname}` : undefined;
}

export async function sendMagicLink(email) {
  if (!supabase) return { error: new Error("Account sync is unavailable in this build.") };
  return supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: redirectUrl() }
  });
}

export async function signInWithGoogle() {
  if (!supabase) return { error: new Error("Account sync is unavailable in this build.") };
  return supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: redirectUrl() }
  });
}

export async function signOutOfSupabase() {
  if (!supabase) return { error: null };
  return supabase.auth.signOut();
}
