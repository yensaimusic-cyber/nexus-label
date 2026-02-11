
-- INDIGO RECORDS - FULL DATABASE ARCHITECTURE

-- 1. ENUMS (Ensure they exist)
DO $$ BEGIN
    CREATE TYPE artist_status AS ENUM ('active', 'on_hold', 'archived');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE project_type AS ENUM ('single', 'ep', 'album', 'mixtape');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE project_status AS ENUM ('idea', 'pre_production', 'production', 'post_production', 'release', 'released');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE track_status AS ENUM ('demo', 'recording', 'recorded', 'mixing_v1', 'mixing_v2', 'mixing_v3', 'mix_approved', 'mastering', 'mastered', 'distributed');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE task_status AS ENUM ('todo', 'in_progress', 'review', 'done');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE task_priority AS ENUM ('low', 'medium', 'high', 'urgent', 'overdue');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE member_type AS ENUM ('internal', 'external');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('admin', 'manager', 'artist', 'engineer', 'designer');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 2. TABLES

-- Artists Assets Table
CREATE TABLE IF NOT EXISTS artist_assets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    artist_id UUID REFERENCES artists(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT NOT NULL, -- 'contract', 'photo', 'epk', 'rider', 'other'
    url TEXT NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ensure projects table has all necessary columns
ALTER TABLE projects ADD COLUMN IF NOT EXISTS cover_url TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS release_date DATE;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS budget DECIMAL DEFAULT 0;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS spent DECIMAL DEFAULT 0;

-- Ensure artist_team_members exists (Management)
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

-- RLS CONFIGURATION
ALTER TABLE artist_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE artist_team_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public access to artist_assets" ON artist_assets;
CREATE POLICY "Public access to artist_assets" ON artist_assets FOR ALL TO authenticated USING (true);

DROP POLICY IF EXISTS "Public access to artist_team_members" ON artist_team_members;
CREATE POLICY "Public access to artist_team_members" ON artist_team_members FOR ALL TO authenticated USING (true);
