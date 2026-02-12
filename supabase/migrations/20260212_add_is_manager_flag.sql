-- Add is_manager flag to profiles for independent management roster

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
