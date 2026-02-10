
-- NEXUS LABEL - FULL DATABASE SCHEMA
-- Execute this in the Supabase SQL Editor

-- ENUMS
CREATE TYPE user_role AS ENUM ('admin', 'manager', 'artist', 'engineer', 'designer');
CREATE TYPE artist_status AS ENUM ('active', 'on_hold', 'archived');
CREATE TYPE project_type AS ENUM ('single', 'ep', 'album', 'mixtape');
CREATE TYPE project_status AS ENUM ('idea', 'pre_production', 'production', 'post_production', 'release', 'released');
CREATE TYPE track_status AS ENUM ('demo', 'recording', 'recorded', 'mixing_v1', 'mixing_v2', 'mixing_v3', 'mix_approved', 'mastering', 'mastered', 'distributed');
CREATE TYPE task_status AS ENUM ('todo', 'in_progress', 'review', 'done');
CREATE TYPE task_priority AS ENUM ('low', 'medium', 'high', 'urgent');

-- TABLES
CREATE TABLE profiles (
  id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  full_name text,
  role user_role DEFAULT 'manager',
  avatar_url text,
  skills text[],
  positions text[],
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE artists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  stage_name text NOT NULL,
  bio text,
  avatar_url text,
  cover_url text,
  spotify_id text,
  instagram_handle text,
  status artist_status DEFAULT 'active',
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id uuid REFERENCES artists(id) ON DELETE CASCADE,
  title text NOT NULL,
  type project_type DEFAULT 'single',
  release_date date,
  status project_status DEFAULT 'idea',
  budget decimal DEFAULT 0,
  spent decimal DEFAULT 0,
  cover_url text,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE tracks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  title text NOT NULL,
  duration integer, -- seconds
  status track_status DEFAULT 'demo',
  bpm integer,
  key text,
  audio_file_url text,
  lyrics text,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  track_id uuid REFERENCES tracks(id) ON DELETE SET NULL,
  assigned_to uuid REFERENCES profiles(id) ON DELETE SET NULL,
  title text NOT NULL,
  description text,
  status task_status DEFAULT 'todo',
  priority task_priority DEFAULT 'medium',
  due_date date,
  completed_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE meetings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  date date DEFAULT current_date,
  summary text,
  attendees text[],
  action_items text[],
  project_id uuid REFERENCES projects(id) ON DELETE SET NULL,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE resources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  service_type text,
  skills text[],
  contact_info text,
  website text,
  rating decimal DEFAULT 5,
  notes text,
  created_at timestamp with time zone DEFAULT now()
);

-- RLS (Row Level Security)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public profiles are viewable by everyone" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

ALTER TABLE artists ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Artists are viewable by authenticated" ON artists FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Only admins/managers can insert/update artists" ON artists FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'manager'))
);

-- Enable Realtime for all tables
ALTER PUBLICATION supabase_realtime ADD TABLE tasks, projects, tracks;
