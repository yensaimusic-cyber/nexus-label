-- Create artist_roadmap_items table for custom roadmap entries
CREATE TABLE IF NOT EXISTS artist_roadmap_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  artist_id UUID NOT NULL REFERENCES artists(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  item_type TEXT DEFAULT 'milestone' CHECK (item_type IN ('milestone', 'post', 'event', 'collaboration', 'release', 'other')),
  date DATE,
  status TEXT DEFAULT 'planned' CHECK (status IN ('planned', 'in_progress', 'completed', 'cancelled')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_artist_roadmap_items_artist_id ON artist_roadmap_items(artist_id);
CREATE INDEX IF NOT EXISTS idx_artist_roadmap_items_date ON artist_roadmap_items(date);
CREATE INDEX IF NOT EXISTS idx_artist_roadmap_items_status ON artist_roadmap_items(status);

-- Enable RLS
ALTER TABLE artist_roadmap_items ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY artist_roadmap_items_read_policy ON artist_roadmap_items
  FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY artist_roadmap_items_write_policy ON artist_roadmap_items
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY artist_roadmap_items_update_policy ON artist_roadmap_items
  FOR UPDATE
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY artist_roadmap_items_delete_policy ON artist_roadmap_items
  FOR DELETE
  USING (auth.role() = 'authenticated');
