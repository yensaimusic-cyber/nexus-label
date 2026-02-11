-- Migration: Add google_tokens table and meeting sync columns
CREATE TABLE IF NOT EXISTS google_tokens (
  user_id uuid PRIMARY KEY,
  access_token text,
  refresh_token text,
  expires_at bigint,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE IF EXISTS meetings
  ADD COLUMN IF NOT EXISTS google_event_id text,
  ADD COLUMN IF NOT EXISTS synced_at timestamptz;
