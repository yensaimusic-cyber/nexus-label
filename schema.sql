
-- NEXUS LABEL - PROJECT TEAM ENHANCEMENT

-- 1. Création de l'enum pour le type de membre
DO $$ BEGIN
    CREATE TYPE member_type AS ENUM ('internal', 'external');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Création de la table project_team
CREATE TABLE IF NOT EXISTS project_team (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    member_id UUID REFERENCES profiles(id) ON DELETE SET NULL, -- Nullable pour les externes
    member_type member_type NOT NULL DEFAULT 'internal',
    role_on_project TEXT NOT NULL, -- Rôle spécifique sur CE projet (ex: Mix, Photo)
    external_name TEXT, -- Pour les externes
    external_email TEXT, -- Pour les externes
    external_phone TEXT, -- Pour les externes
    external_notes TEXT, -- Pour les externes
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Activation de la RLS
ALTER TABLE project_team ENABLE ROW LEVEL SECURITY;

-- 4. Politiques RLS
DROP POLICY IF EXISTS "Allow all for authenticated users on project_team" ON project_team;
CREATE POLICY "Allow all for authenticated users on project_team" 
ON project_team FOR ALL TO authenticated 
USING (true);

-- 5. Index pour les performances
CREATE INDEX IF NOT EXISTS idx_project_team_project_id ON project_team(project_id);
