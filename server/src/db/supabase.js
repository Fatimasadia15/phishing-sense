// ─────────────────────────────────────────────────────────────
//  Supabase Client (server-side, uses service role key)
//  This client bypasses RLS — only use from backend routes.
// ─────────────────────────────────────────────────────────────

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

let supabase = null;

if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
  supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });
  console.log('[supabase] Connected to', SUPABASE_URL);
} else {
  console.warn('[supabase] SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY missing — database disabled');
}

function isAvailable() {
  return supabase !== null;
}

function getClient() {
  return supabase;
}

module.exports = { supabase, isAvailable, getClient };
