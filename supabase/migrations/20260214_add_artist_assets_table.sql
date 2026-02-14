-- Add artist_assets table and policies

CREATE TABLE IF NOT EXISTS artist_assets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    artist_id UUID REFERENCES artists(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    url TEXT NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE artist_assets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public access to artist_assets" ON artist_assets;
CREATE POLICY "Public access to artist_assets" ON artist_assets FOR ALL TO authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_artist_assets_artist_id ON artist_assets(artist_id);
CREATE INDEX IF NOT EXISTS idx_artist_assets_created_at ON artist_assets(created_at);
