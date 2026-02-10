
-- NEXUS LABEL - EXTENSION SCHEMA RESOURCES
ALTER TABLE resources ADD COLUMN IF NOT EXISTS phone text;
ALTER TABLE resources ADD COLUMN IF NOT EXISTS email text;
ALTER TABLE resources ADD COLUMN IF NOT EXISTS instagram text;

-- TABLES POUR LA GESTION D'ARTISTE
CREATE TABLE IF NOT EXISTS artist_team_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  artist_id UUID REFERENCES artists(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS artist_assets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  artist_id UUID REFERENCES artists(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT,
  file_size BIGINT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
