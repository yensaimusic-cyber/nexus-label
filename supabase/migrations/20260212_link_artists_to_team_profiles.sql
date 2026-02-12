-- Link artists to team profiles (for artist members who are also in the team)

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
