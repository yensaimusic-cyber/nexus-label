
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
  created_at?: string;
  projects_count?: number; // Calculé via jointure ou RPC
}

export type ProjectType = 'single' | 'ep' | 'album' | 'mixtape';
export type ProjectStatus = 'idea' | 'pre_production' | 'production' | 'post_production' | 'release' | 'released';

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
  duration: number; // in seconds
  status: TrackStatus;
  bpm?: number;
  key?: string;
  audio_file_url?: string;
  lyrics?: string;
  created_at?: string;
}

export type TaskStatus = 'todo' | 'in_progress' | 'review' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

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
}

/**
 * Interface for tracking project promotion content across various platforms
 */
export interface ContentPost {
  id: string;
  project_id: string;
  platform: 'instagram' | 'tiktok' | 'youtube' | 'facebook' | 'twitter';
  type: 'reel' | 'video' | 'post' | 'story' | 'short';
  scheduled_date: string;
  status: 'idea' | 'production' | 'scheduled' | 'published';
  title: string;
  url?: string;
  created_at?: string;
}

export interface TeamMember {
  id: string;
  user_id: string;
  artist_id?: string;
  role: string[];
  skills: string[];
  full_name: string;
  avatar_url?: string;
  email: string;
  active_projects?: number;
}

export interface Asset {
  id: string;
  artist_id: string;
  name: string;
  type: 'photo' | 'epk' | 'logo' | 'document';
  url: string;
  size: string;
}

export interface Meeting {
  id: string;
  title: string;
  date: string;
  attendees: string[];
  summary: string;
  action_items: string[];
  project_id?: string;
  created_at?: string;
}

export interface ExternalResource {
  id: string;
  name: string;
  service_type: string;
  skills: string[];
  contact_info: string;
  website?: string;
  rating?: number;
  notes?: string;
}
