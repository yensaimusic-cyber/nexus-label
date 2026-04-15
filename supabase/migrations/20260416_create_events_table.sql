-- Create events table for concerts, open mics, freestyle, workshops, promo events, etc.
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('concert', 'open_mic', 'freestyle', 'workshop', 'promo', 'showcase', 'festival', 'soundcheck')),
  date DATE NOT NULL,
  time TIME,
  description TEXT,
  team_member_id UUID REFERENCES artist_team_members(id) ON DELETE SET NULL,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_events_date ON events(date);
CREATE INDEX IF NOT EXISTS idx_events_team_member_id ON events(team_member_id);
CREATE INDEX IF NOT EXISTS idx_events_created_by ON events(created_by);
CREATE INDEX IF NOT EXISTS idx_events_event_type ON events(event_type);

-- Enable RLS
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- RLS policies
-- Allow authenticated users to read all events
CREATE POLICY events_read_policy ON events
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Allow admins to create/update/delete events
CREATE POLICY events_write_policy ON events
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY events_update_policy ON events
  FOR UPDATE
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY events_delete_policy ON events
  FOR DELETE
  USING (auth.role() = 'authenticated');
