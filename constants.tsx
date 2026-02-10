
import React from 'react';
import { 
  LayoutDashboard, 
  Users, 
  Disc, 
  CheckSquare, 
  Calendar, 
  Shield, 
  Settings, 
  LogOut,
  Music,
  Mic2,
  Layers,
  Rocket,
  MessageSquareText,
  Briefcase
} from 'lucide-react';

export const COLORS = {
  primary: '#8B5CF6',
  secondary: '#06B6D4',
  accent: '#EC4899',
  bg: '#0A0A0F',
  surface: '#1A1A24',
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444'
};

export const NAVIGATION = [
  { name: 'Tableau de bord', icon: <LayoutDashboard size={20} />, path: '/' },
  { name: 'Artistes', icon: <Users size={20} />, path: '/artists' },
  { name: 'Projets', icon: <Disc size={20} />, path: '/projects' },
  { name: 'Tâches', icon: <CheckSquare size={20} />, path: '/tasks' },
  { name: 'Réunions', icon: <MessageSquareText size={20} />, path: '/meetings' },
  { name: 'Calendrier', icon: <Calendar size={20} />, path: '/calendar' },
  { name: 'Ressources', icon: <Briefcase size={20} />, path: '/resources' },
  { name: 'Équipe', icon: <Shield size={20} />, path: '/team' },
];

export const STATUS_COLORS: Record<string, string> = {
  // Project Status
  idea: 'bg-slate-500',
  pre_production: 'bg-blue-500',
  production: 'bg-purple-500',
  post_production: 'bg-pink-500',
  release: 'bg-orange-500',
  released: 'bg-nexus-green',
  
  // Task Priority
  low: 'bg-slate-500',
  medium: 'bg-nexus-cyan',
  high: 'bg-nexus-orange',
  urgent: 'bg-nexus-red',
};

export const TRACK_STATUS_FLOW = [
  'demo', 'recording', 'recorded', 'mixing_v1', 'mixing_v2', 'mixing_v3', 'mix_approved', 'mastering', 'mastered', 'distributed'
];
