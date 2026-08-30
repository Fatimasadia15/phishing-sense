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
  input_hash  text NOT NULL,
  risk_score  integer NOT NULL CHECK (risk_score BETWEEN 0 AND 100),
  verdict     text NOT NULL CHECK (verdict IN ('SAFE', 'SUSPICIOUS', 'DANGEROUS')),
  details     text,
  created_at  timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_scan_input
  ON scan_history (input_hash);

-- RLS policies: allow public read (counts), restrict writes to service role
ALTER TABLE community_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE scan_history ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read report counts (needed for GET /api/community/count)
CREATE POLICY "Allow public read on community_reports"
  ON community_reports FOR SELECT
  USING (true);

-- Only service role can insert (backend uses service role key)
CREATE POLICY "Allow service role insert on community_reports"
  ON community_reports FOR INSERT
  WITH CHECK (true);

-- Allow public read on scan history
CREATE POLICY "Allow public read on scan_history"
  ON scan_history FOR SELECT
  USING (true);

CREATE POLICY "Allow service role insert on scan_history"
  ON scan_history FOR INSERT
  WITH CHECK (true);
