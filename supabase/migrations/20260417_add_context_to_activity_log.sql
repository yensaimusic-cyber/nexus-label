-- Add columns to activity_log table for better context
ALTER TABLE activity_log 
ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES projects(id) ON DELETE SET NULL;

ALTER TABLE activity_log 
ADD COLUMN IF NOT EXISTS project_title TEXT;

ALTER TABLE activity_log 
ADD COLUMN IF NOT EXISTS artist_id UUID REFERENCES artists(id) ON DELETE SET NULL;

ALTER TABLE activity_log 
ADD COLUMN IF NOT EXISTS artist_name TEXT;

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_activity_log_project_id ON activity_log(project_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_artist_id ON activity_log(artist_id);
