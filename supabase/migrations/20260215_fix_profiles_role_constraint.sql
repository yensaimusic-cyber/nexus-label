-- Fix profiles role constraint
-- Convert role column from enum to text to allow custom roles

-- Step 1: Drop the CHECK constraint explicitly
DO $$ 
BEGIN
    ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
EXCEPTION
    WHEN OTHERS THEN 
        RAISE NOTICE 'Could not drop constraint: %', SQLERRM;
END $$;

-- Step 2: Convert role column from enum to text
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

-- Optional: Drop the old enum type if it's no longer used elsewhere
-- Uncomment the following if you're sure user_role enum is not used anywhere else
-- DROP TYPE IF EXISTS user_role CASCADE;
