
-- NEXUS LABEL - DATABASE UPDATE SCHEMA

-- 1. Mise à jour de l'enum project_status
ALTER TABLE projects ALTER COLUMN status TYPE text;
DROP TYPE IF EXISTS project_status;
CREATE TYPE project_status AS ENUM (
  'idee_brainstorm',
  'maquette',
  'rec',
  'mix',
  'master',
  'prepa_promo',
  'promo_sortie',
  'promo_pre_sortie',
  'fin'
);
ALTER TABLE projects ALTER COLUMN status TYPE project_status USING status::project_status;

-- 2. Table pour les rôles personnalisés
CREATE TABLE custom_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  created_at timestamp with time zone DEFAULT now()
);

-- Insérer quelques rôles par défaut
INSERT INTO custom_roles (name) VALUES 
('Manager'), ('Ingénieur Son'), ('Graphiste'), ('DA'), ('Vidéaste'), ('Attaché de Presse')
ON CONFLICT DO NOTHING;

-- 3. Table pour les assets d'artistes
CREATE TABLE artist_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id uuid REFERENCES artists(id) ON DELETE CASCADE,
  name text NOT NULL,
  file_url text NOT NULL,
  file_type text,
  file_size bigint,
  created_at timestamp with time zone DEFAULT now()
);

-- 4. Table pour l'équipe dédiée d'un artiste
CREATE TABLE artist_team_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id uuid REFERENCES artists(id) ON DELETE CASCADE,
  profile_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  role text,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(artist_id, profile_id)
);

-- 5. Table pour les tâches de campagne (To-Do List projet)
CREATE TABLE campaign_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  task_text text NOT NULL,
  is_completed boolean DEFAULT false,
  order_index integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now()
);

-- 6. Table pour les collaborateurs d'un projet
CREATE TABLE project_collaborators (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  profile_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  role text,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(project_id, profile_id)
);

-- 7. Ajout de colonnes stats à la table artists
ALTER TABLE artists ADD COLUMN IF NOT EXISTS monthly_listeners integer DEFAULT 0;
ALTER TABLE artists ADD COLUMN IF NOT EXISTS total_streams bigint DEFAULT 0;

-- 8. Enable Realtime pour les nouvelles tables
ALTER PUBLICATION supabase_realtime ADD TABLE campaign_tasks, artist_assets, artist_team_members, project_collaborators;
