-- Phishing Sense — Database Schema
-- Run this in Supabase SQL Editor (https://supabase.com/dashboard → SQL Editor)

-- Community scam reports
CREATE TABLE IF NOT EXISTS community_reports (
  id            bigserial PRIMARY KEY,
  content_type  text NOT NULL CHECK (content_type IN ('text', 'link', 'phone')),
  identifier    text NOT NULL,
  reporter_hash text NOT NULL,
  created_at    timestamptz DEFAULT now()
);

-- Prevent duplicate reports from the same reporter
CREATE UNIQUE INDEX IF NOT EXISTS idx_community_unique
  ON community_reports (identifier, reporter_hash);

-- Fast lookup by identifier for count queries
CREATE INDEX IF NOT EXISTS idx_community_identifier
  ON community_reports (identifier);

-- Scan history (persist analysis results)
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

-- RLS policies: user-scoped reads, service-role writes
ALTER TABLE community_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE scan_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Community reports: public read for counts, authenticated users can report
CREATE POLICY "Allow public read on community_reports"
  ON community_reports FOR SELECT
  USING (true);

CREATE POLICY "Allow authenticated insert on community_reports"
  ON community_reports FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Scan history: owners read their own rows, service role inserts everything
CREATE POLICY "Allow users to read own scan_history"
  ON scan_history FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Allow service role insert on scan_history"
  ON scan_history FOR INSERT
  WITH CHECK (true);

-- Profiles: users can read/update their own profile
CREATE POLICY "Allow users to read own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Allow users to update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Allow authenticated insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);
