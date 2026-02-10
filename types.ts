
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
  | 'idee_brainstorm'
  | 'maquette'
  | 'rec'
  | 'mix'
  | 'master'
  | 'prepa_promo'
  | 'promo_sortie'
  | 'promo_pre_sortie'
  | 'fin';

export const STATUS_LABELS: Record<ProjectStatus, string> = {
  idee_brainstorm: 'Idée/Brainstorm',
  maquette: 'Maquette',
  rec: 'Rec (Enregistrement)',
  mix: 'Mix (Mixage)',
  master: 'Master (Mastering)',
  prepa_promo: 'Prépa-Promo',
  promo_sortie: 'Promo Sortie',
  promo_pre_sortie: 'Promo Pré-Sortie',
  fin: 'Fin'
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
}

export type TrackStatus = 'demo' | 'recording' | 'recorded' | 'mixing_v1' | 'mixing_v2' | 'mixing_v3' | 'mix_approved' | 'mastering' | 'mastered' | 'distributed';

export interface Track {
  id: string;
  project_id: string;
  title: string;
  duration: number;
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
  project_id: string;
  track_id?: string;
  assigned_to: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  due_date: string;
  completed_at?: string;
  artist_name?: string;
  project_title?: string;
  created_at?: string;
  // Metadata for display
  project?: {
    title: string;
    artist?: {
      stage_name: string;
    }
  };
  assignee?: {
    full_name: string;
    avatar_url: string;
  };
}

export interface CustomRole {
  id: string;
  name: string;
}

export interface ArtistAsset {
  id: string;
  artist_id: string;
  name: string;
  file_url: string;
  file_type: string;
  file_size: number;
  created_at: string;
}

export interface CampaignTask {
  id: string;
  project_id: string;
  task_text: string;
  is_completed: boolean;
  order_index: number;
}

export interface ProjectCollaborator {
  id: string;
  project_id: string;
  profile_id: string;
  role: string;
  profile?: {
    full_name: string;
    avatar_url: string;
  };
}

export interface TeamMember {
  id: string;
  full_name: string;
  email: string;
  role: string[];
  skills: string[];
  avatar_url?: string;
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

export interface ExternalResource {
  id: string;
  name: string;
  service_type: string;
  skills: string[];
  contact_info?: string;
  website?: string;
  rating: number;
  notes?: string;
}
