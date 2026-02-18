-- ⚡ INDIGO RECORDS - MIGRATIONS BATCH
-- Exécutez ce fichier complet dans Supabase SQL Editor
-- Il appliquera toutes les migrations en attente de manière sécurisée

-- ============================================================
-- MIGRATION 0: Base meetings table
-- ============================================================

CREATE TABLE IF NOT EXISTS meetings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    date DATE NOT NULL,
    summary TEXT,
    attendees TEXT[] DEFAULT '{}',
    action_items TEXT[] DEFAULT '{}',
    project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
    google_event_id TEXT,
    synced_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE IF EXISTS meetings
    ADD COLUMN IF NOT EXISTS title TEXT,
    ADD COLUMN IF NOT EXISTS date DATE,
    ADD COLUMN IF NOT EXISTS summary TEXT,
    ADD COLUMN IF NOT EXISTS attendees TEXT[] DEFAULT '{}',
    ADD COLUMN IF NOT EXISTS action_items TEXT[] DEFAULT '{}',
    ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS google_event_id TEXT,
    ADD COLUMN IF NOT EXISTS synced_at TIMESTAMP WITH TIME ZONE,
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

ALTER TABLE meetings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public access to meetings" ON meetings;
CREATE POLICY "Public access to meetings" ON meetings FOR ALL TO authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_meetings_date ON meetings(date);
CREATE INDEX IF NOT EXISTS idx_meetings_project_id ON meetings(project_id);

-- ============================================================
-- MIGRATION 1: Support membres internes dans artist_team_members
-- ============================================================

-- Add member_type column (internal = profile from team, external = manual entry)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='artist_team_members' AND column_name='member_type') THEN
        ALTER TABLE artist_team_members 
        ADD COLUMN member_type TEXT DEFAULT 'external';
    END IF;
END $$;

-- Add check constraint for member_type
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'artist_team_members_member_type_check') THEN
        ALTER TABLE artist_team_members 
        ADD CONSTRAINT artist_team_members_member_type_check CHECK (member_type IN ('internal', 'external'));
    END IF;
END $$;

-- Add profile_id for internal team members
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='artist_team_members' AND column_name='profile_id') THEN
        ALTER TABLE artist_team_members 
        ADD COLUMN profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Make name nullable since internal members will use profile data
DO $$
BEGIN
    ALTER TABLE artist_team_members 
    ALTER COLUMN name DROP NOT NULL;
EXCEPTION
    WHEN OTHERS THEN NULL;
END $$;

-- Make role nullable since it can come from profile
DO $$
BEGIN
    ALTER TABLE artist_team_members 
    ALTER COLUMN role DROP NOT NULL;
EXCEPTION
    WHEN OTHERS THEN NULL;
END $$;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_artist_team_members_profile_id ON artist_team_members(profile_id);
CREATE INDEX IF NOT EXISTS idx_artist_team_members_member_type ON artist_team_members(member_type);

-- ============================================================
-- MIGRATION 2: Lier artistes aux profils team
-- ============================================================

-- Add profile_id to artists table
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='artists' AND column_name='profile_id') THEN
        ALTER TABLE artists 
        ADD COLUMN profile_id UUID REFERENCES profiles(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_artists_profile_id ON artists(profile_id);

-- ============================================================
-- MIGRATION 3: Flag is_manager pour gestion indépendante
-- ============================================================

-- Add is_manager column (defaults to false)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='profiles' AND column_name='is_manager') THEN
        ALTER TABLE profiles 
        ADD COLUMN is_manager BOOLEAN DEFAULT false;
    END IF;
END $$;

-- Create index for faster filtering
CREATE INDEX IF NOT EXISTS idx_profiles_is_manager ON profiles(is_manager);

-- Update existing profiles to set is_manager=true for those who manage artists
UPDATE profiles 
SET is_manager = true 
WHERE id IN (
    SELECT DISTINCT profile_id 
    FROM artist_team_members 
    WHERE profile_id IS NOT NULL 
    AND member_type = 'internal'
);

-- ============================================================
-- MIGRATION 4: Artist assets table
-- ============================================================

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

-- ============================================================
-- MIGRATION 5: Project budgets tracking
-- ============================================================

CREATE TABLE IF NOT EXISTS project_budgets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    label TEXT NOT NULL,
    amount DECIMAL(12, 2) NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE project_budgets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public access to project_budgets" ON project_budgets;
CREATE POLICY "Public access to project_budgets" ON project_budgets FOR ALL TO authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_project_budgets_project_id ON project_budgets(project_id);
CREATE INDEX IF NOT EXISTS idx_project_budgets_status ON project_budgets(status);

-- ============================================================
-- MIGRATION 6: Fix profiles role constraint
-- ============================================================

-- Step 1: Drop the CHECK constraint explicitly
DO $$ 
BEGIN
    ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
EXCEPTION
    WHEN OTHERS THEN 
        RAISE NOTICE 'Could not drop constraint: %', SQLERRM;
END $$;

-- Step 2: Convert role column from enum to text to allow custom roles
DO $$ 
BEGIN
    -- Drop the default first
    ALTER TABLE profiles ALTER COLUMN role DROP DEFAULT;
    
    -- Convert the column type
    ALTER TABLE profiles ALTER COLUMN role TYPE TEXT USING role::TEXT;
    
    -- Set a new default if needed
    ALTER TABLE profiles ALTER COLUMN role SET DEFAULT NULL;
EXCEPTION
    WHEN OTHERS THEN 
        RAISE NOTICE 'Could not alter role column: %', SQLERRM;
END $$;

-- Step 3: Make sure role is nullable for flexibility
DO $$
BEGIN
    ALTER TABLE profiles ALTER COLUMN role DROP NOT NULL;
EXCEPTION
    WHEN OTHERS THEN NULL;
END $$;

-- ============================================================
-- MIGRATION 7: Separate authentication role from professional role
-- ============================================================

-- Add auth_role column for authentication (admin/viewer)
-- Keep role column for professional titles (Manager, A&R, etc.)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='profiles' AND column_name='auth_role') THEN
        ALTER TABLE profiles 
        ADD COLUMN auth_role TEXT DEFAULT 'viewer';
    END IF;
END $$;

-- Migrate existing 'admin' and 'viewer' values from role to auth_role
UPDATE profiles 
SET auth_role = CASE 
    WHEN LOWER(role::TEXT) = 'admin' THEN 'admin'
    WHEN LOWER(role::TEXT) = 'viewer' THEN 'viewer'
    ELSE 'viewer'
END
WHERE role IS NOT NULL 
  AND (LOWER(role::TEXT) = 'admin' OR LOWER(role::TEXT) = 'viewer');

-- Clear 'admin' and 'viewer' from role column (keep only professional titles)
UPDATE profiles 
SET role = NULL
WHERE LOWER(role::TEXT) IN ('admin', 'viewer');

-- Create index for faster auth_role lookups
CREATE INDEX IF NOT EXISTS idx_profiles_auth_role ON profiles(auth_role);

-- Add check constraint for auth_role
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'profiles_auth_role_check') THEN
        ALTER TABLE profiles 
        ADD CONSTRAINT profiles_auth_role_check CHECK (auth_role IN ('admin', 'viewer'));
    END IF;
END $$;

-- ============================================================
-- MIGRATION 8: Sorties (Releases) table
-- ============================================================

CREATE TABLE IF NOT EXISTS sorties (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    release_date DATE NOT NULL,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    description TEXT,
    cover_url TEXT,
    platforms TEXT[] DEFAULT '{}',
    spotify_url TEXT,
    status TEXT DEFAULT 'planned' CHECK (status IN ('planned', 'released', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE sorties ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public access to sorties" ON sorties;
CREATE POLICY "Public access to sorties" ON sorties FOR ALL TO authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_sorties_release_date ON sorties(release_date);
CREATE INDEX IF NOT EXISTS idx_sorties_project_id ON sorties(project_id);
CREATE INDEX IF NOT EXISTS idx_sorties_status ON sorties(status);

-- ============================================================
-- ✅ MIGRATIONS TERMINÉES
-- ============================================================
-- Vous pouvez maintenant fermer cet onglet et retourner sur votre app
