-- Separate authentication role from professional role
-- auth_role: admin/viewer (for authentication)
-- role: professional title (Manager, A&R, etc. - displayed on team page)

-- Step 1: Add auth_role column for authentication
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='profiles' AND column_name='auth_role') THEN
        ALTER TABLE profiles 
        ADD COLUMN auth_role TEXT DEFAULT 'viewer';
    END IF;
END $$;

-- Step 2: Migrate existing 'admin' and 'viewer' values from role to auth_role
UPDATE profiles 
SET auth_role = CASE 
    WHEN LOWER(role::TEXT) = 'admin' THEN 'admin'
    WHEN LOWER(role::TEXT) = 'viewer' THEN 'viewer'
    ELSE 'viewer'
END
WHERE role IS NOT NULL 
  AND (LOWER(role::TEXT) = 'admin' OR LOWER(role::TEXT) = 'viewer');

-- Step 3: Clear 'admin' and 'viewer' from role column (keep only professional titles)
UPDATE profiles 
SET role = NULL
WHERE LOWER(role::TEXT) IN ('admin', 'viewer');

-- Step 4: Create index for faster auth_role lookups
CREATE INDEX IF NOT EXISTS idx_profiles_auth_role ON profiles(auth_role);

-- Step 5: Add check constraint for auth_role
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'profiles_auth_role_check') THEN
        ALTER TABLE profiles 
        ADD CONSTRAINT profiles_auth_role_check CHECK (auth_role IN ('admin', 'viewer'));
    END IF;
END $$;
