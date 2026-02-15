-- Fix profiles role constraint
-- Convert role column from enum to text to allow custom roles

-- Step 1: Alter the role column to TEXT (removing the enum constraint)
DO $$ 
BEGIN
    -- Drop the constraint if it exists
    ALTER TABLE profiles ALTER COLUMN role DROP DEFAULT;
    ALTER TABLE profiles ALTER COLUMN role TYPE TEXT USING role::TEXT;
    
    -- Set a new default if needed
    ALTER TABLE profiles ALTER COLUMN role SET DEFAULT NULL;
EXCEPTION
    WHEN OTHERS THEN 
        -- If column doesn't exist or another issue, we'll handle it
        RAISE NOTICE 'Could not alter role column: %', SQLERRM;
END $$;

-- Step 2: Make sure role is nullable for flexibility
DO $$
BEGIN
    ALTER TABLE profiles ALTER COLUMN role DROP NOT NULL;
EXCEPTION
    WHEN OTHERS THEN NULL;
END $$;

-- Optional: Drop the old enum type if it's no longer used elsewhere
-- Uncomment the following if you're sure user_role enum is not used anywhere else
-- DROP TYPE IF EXISTS user_role CASCADE;
