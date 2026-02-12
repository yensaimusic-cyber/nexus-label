-- Add support for internal team members (profiles) in artist_team_members

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
