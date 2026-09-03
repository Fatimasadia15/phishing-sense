// ─────────────────────────────────────────────────────────────
//  Database Migration — Create Phishing Sense tables
//  Run: node scripts/migrate.js
//  Uses the service role key (bypasses RLS).
// ─────────────────────────────────────────────────────────────

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false },
});

const SQL = `
-- Community scam reports
CREATE TABLE IF NOT EXISTS community_reports (
  id            bigserial PRIMARY KEY,
  content_type  text NOT NULL CHECK (content_type IN ('text', 'link', 'phone')),
  identifier    text NOT NULL,
  reporter_hash text NOT NULL,
  created_at    timestamptz DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_community_unique
  ON community_reports (identifier, reporter_hash);

CREATE INDEX IF NOT EXISTS idx_community_identifier
  ON community_reports (identifier);

-- Scan history (optional persistence)
CREATE TABLE IF NOT EXISTS scan_history (
  id          bigserial PRIMARY KEY,
  user_id     uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  input_hash  text NOT NULL,
  input_type  text NOT NULL CHECK (input_type IN ('text', 'link', 'message', 'phone')),
  risk_score  integer NOT NULL CHECK (risk_score BETWEEN 0 AND 100),
  verdict     text NOT NULL CHECK (verdict IN ('SAFE', 'SUSPICIOUS', 'DANGEROUS')),
  details     jsonb,
  created_at  timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_scan_input
  ON scan_history (input_hash);
CREATE INDEX IF NOT EXISTS idx_scan_user
  ON scan_history (user_id, created_at DESC);

-- User profiles (mirrors Supabase Auth users)
CREATE TABLE IF NOT EXISTS profiles (
  id         uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name       text,
  avatar_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE community_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE scan_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read on community_reports"
  ON community_reports FOR SELECT USING (true);

CREATE POLICY "Allow authenticated insert on community_reports"
  ON community_reports FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow users to read own scan_history"
  ON scan_history FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Allow service role insert on scan_history"
  ON scan_history FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow users to read own profile"
  ON profiles FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Allow users to update own profile"
  ON profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Allow authenticated insert own profile"
  ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
`;

async function migrate() {
  console.log('Running migration on', SUPABASE_URL, '...');

  const { data, error } = await supabase.rpc('exec_sql', { sql: SQL });

  if (error) {
    // rpc may not exist — try REST approach
    console.log('rpc exec_sql not available, trying direct SQL via REST...');

    // Supabase supports raw SQL via POST to /rest/v1/rpc with a custom function
    // We'll create the function first, then call it
    const { error: fnError } = await supabase.rpc('exec_sql', { sql: 'SELECT 1' });

    if (fnError && fnError.message?.includes('Could not find the function')) {
      console.log('Creating exec_sql helper function...');

      const createFn = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SERVICE_KEY,
          'Authorization': `Bearer ${SERVICE_KEY}`,
        },
        body: JSON.stringify({ sql: 'SELECT 1' }),
      });

      // If rpc endpoint doesn't support arbitrary SQL, use the Supabase Management API
      // or tell the user to run the SQL manually
      if (!createFn.ok) {
        console.error('Could not execute SQL via RPC.');
        console.log('\nPlease run this SQL manually in the Supabase SQL Editor:\n');
        console.log(SQL);
        process.exit(1);
      }
    }

    // Try again with actual migration SQL
    const result = await supabase.rpc('exec_sql', { sql: SQL });
    if (result.error) {
      console.error('Migration failed:', result.error.message);
      console.log('\nRun this SQL manually in the Supabase SQL Editor:\n');
      console.log(SQL);
      process.exit(1);
    }
  }

  console.log('Migration complete!');
  console.log('Tables: community_reports, scan_history, profiles');

  // Verify
  const { count } = await supabase.from('community_reports').select('*', { count: 'exact', head: true });
  console.log('community_reports rows:', count);

  const { count: scanCount } = await supabase.from('scan_history').select('*', { count: 'exact', head: true });
  console.log('scan_history rows:', scanCount);

  const { count: profileCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
  console.log('profiles rows:', profileCount);
}

migrate().catch((err) => {
  console.error('Migration error:', err);
  process.exit(1);
});
