
-- NEXUS LABEL - TRACKS & TASKS ENHANCEMENT

-- 1. Sécurité pour les tracks
ALTER TABLE tracks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all for authenticated users on tracks" ON tracks;
CREATE POLICY "Allow all for authenticated users on tracks" 
ON tracks FOR ALL TO authenticated 
USING (true);

-- 2. Indexation pour la recherche de tracks par projet
CREATE INDEX IF NOT EXISTS idx_tracks_project_id ON tracks(project_id);

-- 3. Mise à jour des enums (si géré par Supabase directement via dashboard, sinon SQL ci-dessous)
-- Note: Les types sont déjà définis dans le code TypeScript pour la logique applicative.
