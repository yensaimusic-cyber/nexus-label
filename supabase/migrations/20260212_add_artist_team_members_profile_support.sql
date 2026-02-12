-- Add support for internal team members (profiles) in artist_team_members

-- Add member_type column (internal = profile from team, external = manual entry)
ALTER TABLE artist_team_members 
ADD COLUMN IF NOT EXISTS member_type TEXT DEFAULT 'external' CHECK (member_type IN ('internal', 'external'));

-- Add profile_id for internal team members
ALTER TABLE artist_team_members 
ADD COLUMN IF NOT EXISTS profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE;

-- Make name nullable since internal members will use profile data
ALTER TABLE artist_team_members 
ALTER COLUMN name DROP NOT NULL;

-- Make role nullable since it can come from profile
ALTER TABLE artist_team_members 
ALTER COLUMN role DROP NOT NULL;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_artist_team_members_profile_id ON artist_team_members(profile_id);
CREATE INDEX IF NOT EXISTS idx_artist_team_members_member_type ON artist_team_members(member_type);
