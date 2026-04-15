import React, { useMemo } from 'react';
import { useActivityLog, ActivityLogEntry } from '../hooks/useActivityLog';
import { useAuth } from '../hooks/useAuth';
import { formatDateTime, getNavigationPath, formatDate } from '../lib/utils';
import { useNavigate } from 'react-router-dom';
import {
  Activity,
  Disc,
  Rocket,
  MessageSquareText,
  CheckSquare,
  Users,
  Loader2,
  AlertCircle,
  ChevronRight,
} from 'lucide-react';
import { motion } from 'framer-motion';

const getActivityIcon = (entityType: string, actionType: string) => {
  const iconProps = { size: 16 };

  switch (entityType) {
    case 'project':
      return <Disc {...iconProps} className="text-nexus-purple" />;
    case 'sortie':
      return <Rocket {...iconProps} className="text-nexus-orange" />;
    case 'meeting':
      return <MessageSquareText {...iconProps} className="text-nexus-cyan" />;
    case 'task':
      return <CheckSquare {...iconProps} className="text-nexus-green" />;
    case 'artist':
      return <Users {...iconProps} className="text-nexus-pink" />;
    default:
      return <Activity {...iconProps} className="text-white/50" />;
  }
};

const getActivityColor = (entityType: string) => {
  switch (entityType) {
    case 'project':
      return 'bg-nexus-purple/10 border-nexus-purple/20 hover:bg-nexus-purple/15';
    case 'sortie':
      return 'bg-nexus-orange/10 border-nexus-orange/20 hover:bg-nexus-orange/15';
    case 'meeting':
      return 'bg-nexus-cyan/10 border-nexus-cyan/20 hover:bg-nexus-cyan/15';
    case 'task':
      return 'bg-nexus-green/10 border-nexus-green/20 hover:bg-nexus-green/15';
    case 'artist':
      return 'bg-nexus-pink/10 border-nexus-pink/20 hover:bg-nexus-pink/15';
    default:
      return 'bg-white/5 border-white/10 hover:bg-white/10';
  }
};

const getActionBadgeColor = (actionType: string) => {
  if (actionType.includes('created')) return 'bg-nexus-green/20 text-nexus-green';
  if (actionType.includes('updated')) return 'bg-nexus-cyan/20 text-nexus-cyan';
  if (actionType.includes('deleted')) return 'bg-nexus-red/20 text-nexus-red';
  return 'bg-white/10 text-white';
};

const getActionLabel = (actionType: string) => {
  const labels: Record<string, string> = {
    'project_created': 'Créé',
    'project_updated': 'Modifié',
    'project_deleted': 'Supprimé',
    'sortie_created': 'Créé',
    'sortie_updated': 'Modifié',
    'sortie_deleted': 'Supprimé',
    'meeting_created': 'Créé',
    'meeting_updated': 'Modifié',
    'meeting_deleted': 'Supprimé',
    'task_created': 'Créé',
    'task_updated': 'Modifié',
    'task_deleted': 'Supprimé',
    'artist_created': 'Créé',
    'artist_updated': 'Modifié',
    'team_member_added': 'Ajouté',
    'team_member_updated': 'Modifié',
  };
  return labels[actionType] || 'Modifié';
};

const ActivityCard: React.FC<{ activity: ActivityLogEntry; index: number }> = ({ activity, index }) => {
  const navigate = useNavigate();
  const timeAgo = getTimeAgo(activity.created_at);
  const navPath = getNavigationPath(activity.entity_type, activity.entity_id);

  const handleClick = () => {
    if (navPath) {
      navigate(navPath);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      onClick={handleClick}
      className={`border rounded-lg p-4 transition-all duration-300 group ${navPath ? 'cursor-pointer hover:border-nexus-purple/60 hover:shadow-lg hover:shadow-nexus-purple/20' : 'cursor-not-allowed opacity-50'} ${getActivityColor(
        activity.entity_type
      )}`}
    >
      <div className="flex items-start gap-4">
        {/* Icon */}
        <div className="flex-shrink-0 mt-1">
          <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center border border-white/10">
            {getActivityIcon(activity.entity_type, activity.action_type)}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <h3 className="font-semibold text-white truncate">{activity.entity_title}</h3>
            <span className={`text-xs px-2 py-1 rounded-full font-medium whitespace-nowrap ${getActionBadgeColor(activity.action_type)}`}>
              {getActionLabel(activity.action_type)}
            </span>
          </div>

          {/* Main Description */}
          <p className="text-sm text-white/70 mb-3 font-medium">{activity.description}</p>

          {/* Context Information */}
          <div className="bg-white/5 border border-white/10 rounded-lg p-3 mb-3 space-y-2">
            {/* Project Context */}
            {activity.project_title && (
              <div className="flex items-center gap-2 text-xs">
                <span className="text-nexus-light/60">📁 Projet:</span>
                <span className="text-white font-medium">{activity.project_title}</span>
              </div>
            )}

            {/* Artist Context */}
            {activity.artist_name && (
              <div className="flex items-center gap-2 text-xs">
                <span className="text-nexus-light/60">🎤 Artiste:</span>
                <span className="text-white font-medium">{activity.artist_name}</span>
              </div>
            )}

            {/* Entity Info */}
            {!activity.project_title && !activity.artist_name && (
              <div className="flex items-center gap-2 text-xs">
                <span className="text-nexus-light/60 capitalize">{activity.entity_type}:</span>
                <span className="text-white font-medium">{activity.entity_title}</span>
              </div>
            )}
          </div>

          {/* Changes preview */}
          {activity.new_values && Object.keys(activity.new_values).length > 0 && (
            <div className="bg-white/5 border border-white/10 rounded-lg p-3 mb-3">
              <p className="text-white/60 font-medium mb-2 text-xs">📝 Modifications:</p>
              <div className="space-y-1.5">
                {Object.entries(activity.new_values).map(([key, value]) => {
                  const oldValue = activity.old_values?.[key];
                  if (oldValue === value) return null;
                  
                  const displayLabel = formatFieldLabel(key);
                  
                  return (
                    <div key={key} className="flex justify-between items-start gap-2 text-xs">
                      <span className="text-white/60">{displayLabel}:</span>
                      <div className="text-right">
                        {oldValue !== undefined && (
                          <div className="text-nexus-red/60 line-through text-xs mb-1">
                            {formatFieldValue(key, oldValue)}
                          </div>
                        )}
                        <div className="text-nexus-green font-medium">
                          {formatFieldValue(key, value)}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* User and Time */}
          <div className="flex items-center gap-2 text-xs text-white/50 pt-2 border-t border-white/10">
            {activity.user?.full_name && (
              <>
                <span>Par {activity.user.full_name}</span>
                <span>•</span>
              </>
            )}
            <span>{timeAgo}</span>
          </div>
        </div>

        {/* Arrow indicator for clickable items */}
        {navPath && (
          <div className="flex-shrink-0 text-white/30 group-hover:text-nexus-purple transition-colors opacity-0 group-hover:opacity-100">
            <ChevronRight size={20} />
          </div>
        )}
      </div>
    </motion.div>
  );
};

const getTimeAgo = (dateString: string): string => {
  const now = new Date();
  const date = new Date(dateString);
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return 'À l\'instant';
  if (seconds < 3600) return `il y a ${Math.floor(seconds / 60)}m`;
  if (seconds < 86400) return `il y a ${Math.floor(seconds / 3600)}h`;
  if (seconds < 604800) return `il y a ${Math.floor(seconds / 86400)}j`;

  return formatDateTime(dateString);
};

const formatFieldLabel = (field: string): string => {
  const labels: Record<string, string> = {
    'title': 'Titre',
    'status': 'Statut',
    'priority': 'Priorité',
    'due_date': 'Date limite',
    'release_date': 'Date de sortie',
    'date': 'Date',
    'budget': 'Budget',
    'spent': 'Dépensé',
    'description': 'Description',
    'summary': 'Résumé',
  };
  return labels[field] || field;
};

const formatFieldValue = (field: string, value: any): string => {
  if (!value) return '-';
  
  if (field === 'due_date' || field === 'date' || field === 'release_date') {
    return formatDate(value);
  }
  
  if (field === 'budget' || field === 'spent') {
    return `${value}€`;
  }
  
  if (field === 'status') {
    const statusLabels: Record<string, string> = {
      'idea': 'Idée',
      'pre_production': 'Pré-production',
      'production': 'Production',
      'post_production': 'Post-production',
      'release': 'Sortie',
      'released': 'Publiée',
      'planned': 'Planifiée',
      'cancelled': 'Annulée',
      'todo': 'À faire',
      'in_progress': 'En cours',
      'review': 'En révision',
      'done': 'Fait',
    };
    return statusLabels[value] || value;
  }
  
  return String(value).slice(0, 50);
};

const groupActivitiesByDate = (activities: ActivityLogEntry[]): Record<string, ActivityLogEntry[]> => {
  const groups: Record<string, ActivityLogEntry[]> = {};

  activities.forEach((activity) => {
    const date = new Date(activity.created_at);
    const dateKey = date.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    if (!groups[dateKey]) {
      groups[dateKey] = [];
    }
    groups[dateKey].push(activity);
  });

  return groups;
};

export const Actualite: React.FC = () => {
  const { activities, loading, error } = useActivityLog(100);
  const { user } = useAuth();

  const groupedActivities = useMemo(() => {
    return groupActivitiesByDate(activities);
  }, [activities]);

  if (loading) {
    return (
      <div className="min-h-screen bg-nexus-dark flex items-center justify-center">
        <Loader2 className="text-nexus-purple animate-spin" size={48} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-nexus-dark flex items-center justify-center p-4">
        <div className="flex items-center gap-3 text-nexus-red">
          <AlertCircle size={24} />
          <p>Erreur lors du chargement des activités: {error}</p>
        </div>
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="min-h-screen bg-nexus-dark flex items-center justify-center">
        <div className="text-center">
          <Activity size={48} className="text-white/30 mx-auto mb-4" />
          <p className="text-white/60 text-lg">Aucune activité pour le moment</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-nexus-dark p-4 sm:p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-3xl mx-auto"
      >
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Actualités</h1>
          <p className="text-white/60">Suivi de toutes les activités et modifications</p>
        </div>

        {/* Timeline */}
        <div className="space-y-8">
          {Object.entries(groupedActivities).map(([dateLabel, dateActivities]: [string, ActivityLogEntry[]]) => (
            <div key={dateLabel}>
              <h2 className="text-lg font-semibold text-white/70 mb-4 flex items-center gap-3">
                <div className="flex-1 h-px bg-gradient-to-r from-white/20 to-transparent" />
                {dateLabel}
                <div className="flex-1 h-px bg-gradient-to-l from-white/20 to-transparent" />
              </h2>

              <div className="space-y-3">
                {dateActivities.map((activity, index) => (
                  <ActivityCard key={activity.id} activity={activity} index={index} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};
