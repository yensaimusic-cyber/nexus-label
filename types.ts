
export type UserRole = 'admin' | 'manager' | 'artist' | 'engineer' | 'designer';

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  avatar_url?: string;
}

export type ArtistStatus = 'active' | 'on_hold' | 'archived';

export interface Artist {
  id: string;
  name: string;
  stage_name: string;
  bio?: string;
  avatar_url?: string;
  cover_url?: string;
  spotify_id?: string;
  instagram_handle?: string;
  status: ArtistStatus;
  monthly_listeners?: number;
  total_streams?: number;
  created_at?: string;
  projects_count?: number;
}

export type ProjectType = 'single' | 'ep' | 'album' | 'mixtape';

export type ProjectStatus = 
  | 'idea'
  | 'pre_production'
  | 'production'
  | 'post_production'
  | 'release'
  | 'released';

export const STATUS_LABELS: Record<ProjectStatus, string> = {
  idea: 'Idée / Brainstorm',
  pre_production: 'Pré-Production',
  production: 'Production / REC',
  post_production: 'Post-Production / Mix',
  release: 'Préparation Sortie',
  released: 'Distribué / Terminé'
};

export interface Project {
  id: string;
  artist_id: string;
  title: string;
  type: ProjectType;
  release_date: string;
  status: ProjectStatus;
  budget: number;
  spent: number;
  cover_url?: string;
  progress?: number;
  created_at?: string;
  artist?: {
    stage_name: string;
    avatar_url?: string;
  };
}

export type TrackStatus = 
  | 'demo' 
  | 'recording' 
  | 'recorded' 
  | 'mixing_v1' 
  | 'mixing_v2' 
  | 'mixing_v3' 
  | 'mix_approved' 
  | 'mastering' 
  | 'mastered' 
  | 'distributed';

export const TRACK_STATUS_LABELS: Record<TrackStatus, string> = {
  demo: 'Démo',
  recording: 'Enregistrement',
  recorded: 'Enregistré',
  mixing_v1: 'Mix V1',
  mixing_v2: 'Mix V2',
  mixing_v3: 'Mix V3',
  mix_approved: 'Mix Validé',
  mastering: 'Mastering',
  mastered: 'Masterisé',
  distributed: 'Distribué'
};

export interface Track {
  id: string;
  project_id: string;
  title: string;
  duration?: number;
  status: TrackStatus;
  bpm?: number;
  key?: string;
  audio_file_url?: string;
  lyrics?: string;
  created_at?: string;
}

export type TaskStatus = 'todo' | 'in_progress' | 'review' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent' | 'overdue';

export interface Task {
  id: string;
  project_id?: string;
  track_id?: string;
  assigned_to: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  due_date: string;
  completed_at?: string;
  created_at?: string;
  project?: {
    id: string;
    title: string;
    status: ProjectStatus;
    artist?: {
      stage_name: string;
    }
  };
  assignee?: {
    id: string;
    full_name: string;
    avatar_url: string;
  };
}

export interface TeamMember {
  id: string;
  full_name: string;
  email: string;
  role: string[];
  skills?: string[];
  avatar_url?: string;
}

export type MemberType = 'internal' | 'external';

export interface ProjectTeamMember {
  id: string;
  project_id: string;
  member_id?: string;
  member_type: MemberType;
  role_on_project: string;
  external_name?: string;
  external_email?: string;
  external_phone?: string;
  external_notes?: string;
  created_at?: string;
  profile?: {
    full_name: string;
    avatar_url: string;
    role: string[];
  };
}

export interface ExternalResource {
  id: string;
  name: string;
  service_type: string;
  skills: string[];
  phone?: string;
  email?: string;
  instagram?: string;
  website?: string;
  rating?: number;
  notes?: string;
}

export interface Meeting {
  id: string;
  title: string;
  date: string;
  summary?: string;
  attendees: string[];
  action_items: string[];
  project_id?: string;
}

// Added missing interfaces for artist assets and team management
export interface ArtistAsset {
  id: string;
  artist_id: string;
  name: string;
  notes?: string;
  file_url: string;
  file_type: string;
  file_size: number;
  created_at?: string;
}

export interface ArtistTeamMember {
  id: string;
  artist_id: string;
  name: string;
  role: string;
  email?: string;
  phone?: string;
  notes?: string;
  created_at?: string;
}

export interface CustomRole {
  id: string;
  name: string;
  created_at?: string;
}
