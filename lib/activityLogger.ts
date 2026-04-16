import { supabase } from './supabase';
import { formatDate } from './utils';

export interface ActivityLogPayload {
  user_id: string;
  action_type: string;
  entity_type: string;
  entity_id: string;
  entity_title: string;
  description: string;
  project_id?: string;
  project_title?: string;
  artist_id?: string;
  artist_name?: string;
  old_values?: Record<string, any>;
  new_values?: Record<string, any>;
}

export const logActivity = async (payload: ActivityLogPayload): Promise<void> => {
  try {
    const { error } = await supabase.from('activity_log').insert([payload]);

    if (error) {
      console.error('Error logging activity:', error);
    }
  } catch (err) {
    console.error('Failed to log activity:', err);
  }
};

// Helper function to create detailed change descriptions
const createChangeDescription = (field: string, oldValue: any, newValue: any): string => {
  if (field === 'release_date' || field === 'date') {
    return `📅 ${field === 'date' ? 'Date' : 'Date de sortie'}: ${formatDate(oldValue)} → ${formatDate(newValue)}`;
  } else if (field === 'status') {
    const statusLabels: Record<string, string> = {
      'idea': '💭 Idée',
      'pre_production': '📋 Pré-production',
      'production': '🎙️ Production',
      'post_production': '🎚️ Post-production',
      'release': '🚀 Sortie',
      'released': '✅ Publiée',
      'planned': '⏳ Planifiée',
      'cancelled': '❌ Annulée',
      'todo': '📝 À faire',
      'done': '✅ Validée',
      'in_progress': '⏳ En cours',
    };
    return `${statusLabels[oldValue] || oldValue} → ${statusLabels[newValue] || newValue}`;
  } else if (field === 'title') {
    return `📝 Titre: "${oldValue}" → "${newValue}"`;
  } else if (field === 'budget') {
    return `💰 Budget: ${oldValue}€ → ${newValue}€`;
  } else if (field === 'priority') {
    const priorityLabels: Record<string, string> = {
      'low': '🟢 Basse',
      'medium': '🟡 Normale',
      'high': '🔴 Haute',
      'urgent': '🚨 Urgente',
    };
    return `Priorité: ${priorityLabels[oldValue] || oldValue} → ${priorityLabels[newValue] || newValue}`;
  }
  return `${field}: ${oldValue} → ${newValue}`;
};

// Helper function to build detailed description from multiple changes
export const buildDetailedDescription = (
  action: 'created' | 'updated' | 'deleted',
  entity: string,
  title: string,
  changes?: { old: Record<string, any>; new: Record<string, any> }
): string => {
  let description = '';

  // Smart task descriptions
  if (entity === 'task' && changes?.new?.status && changes?.old?.status) {
    if (changes.old.status === 'todo' && changes.new.status === 'done') {
      return `✅ Tâche validée: "${title}"`;
    } else if (changes.old.status === 'done' && changes.new.status !== 'done') {
      return `🔄 Tâche réouverte: "${title}"`;
    }
  }

  // Smart project descriptions
  if (entity === 'project' && changes?.new?.status && changes?.old?.status) {
    const projectStatus = {
      'idea': 'en idée',
      'pre_production': 'en pré-production',
      'production': 'en production',
      'post_production': 'en post-production',
      'release': 'en sortie',
      'released': 'publié',
    };
    if (changes.old.status !== changes.new.status) {
      return `🎵 Projet "${title}" ${projectStatus[changes.new.status] || changes.new.status}`;
    }
  }

  // Smart sortie descriptions
  if (entity === 'sortie' && changes?.new?.status && changes?.old?.status) {
    if (changes.old.status === 'planned' && changes.new.status === 'released') {
      return `🎉 Sortie "${title}" publiée!`;
    }
  }

  // For updated actions, analyze what fields changed to provide specific messages
  if (action === 'updated' && changes?.old && changes?.new) {
    const changedFields = Object.keys(changes.new).filter(
      (key) => changes.old[key] !== changes.new[key]
    );

    // If only one field changed, provide specific message
    if (changedFields.length === 1) {
      const field = changedFields[0];
      
      if (field === 'due_date' || field === 'date') {
        return `📅 Date déplacée: "${title}" | ${createChangeDescription(field, changes.old[field], changes.new[field])}`;
      } else if (field === 'title') {
        return `📝 Titre modifié: "${changes.old[field]}" → "${changes.new[field]}"`;
      } else if (field === 'priority') {
        return `🎯 Priorité changée: "${title}" | ${createChangeDescription(field, changes.old[field], changes.new[field])}`;
      } else if (field === 'status') {
        return `🔄 Statut changé: "${title}" | ${createChangeDescription(field, changes.old[field], changes.new[field])}`;
      } else if (field === 'description' || field === 'summary') {
        return `📝 Description mise à jour: "${title}"`;
      } else if (field === 'budget') {
        return `💰 Budget modifié: "${title}" | ${createChangeDescription(field, changes.old[field], changes.new[field])}`;
      }
    }
  }

  // Default messages for better readability
  const messages: Record<string, Record<'created' | 'updated' | 'deleted', string>> = {
    task: {
      created: `📝 Tâche créée: "${title}"`,
      updated: `📝 Tâche modifiée: "${title}"`,
      deleted: `🗑️ Tâche supprimée: "${title}"`,
    },
    meeting: {
      created: `📞 Réunion notée: "${title}"`,
      updated: `📞 Réunion modifiée: "${title}"`,
      deleted: `🗑️ Réunion supprimée: "${title}"`,
    },
    project: {
      created: `🎵 Nouveau projet: "${title}"`,
      updated: `🎵 Projet modifié: "${title}"`,
      deleted: `🗑️ Projet supprimé: "${title}"`,
    },
    sortie: {
      created: `🚀 Sortie planifiée: "${title}"`,
      updated: `🚀 Sortie modifiée: "${title}"`,
      deleted: `🗑️ Sortie supprimée: "${title}"`,
    },
    artist: {
      created: `🎤 Nouvel artiste: "${title}"`,
      updated: `🎤 Profil modifié: "${title}"`,
      deleted: `🗑️ Artiste supprimé: "${title}"`,
    },
  };

  description = messages[entity]?.[action] || `${entity} ${action}: ${title}`;

  // Add detailed change information if available and multiple fields changed
  if (changes && changes.old && changes.new && action === 'updated') {
    const changedFields = Object.keys(changes.new).filter(
      (key) => changes.old[key] !== changes.new[key] && key !== 'status'
    );

    if (changedFields.length > 1) {
      const changeDetails = changedFields
        .map((field) => createChangeDescription(field, changes.old[field], changes.new[field]))
        .join(' • ');
      description += ` | ${changeDetails}`;
    } else if (changedFields.length === 1) {
      const field = changedFields[0];
      const changeDetail = createChangeDescription(field, changes.old[field], changes.new[field]);
      description += ` | ${changeDetail}`;
    }
  }

  return description;
};

// Helper functions for common activities
export const logProjectActivity = async (
  userId: string,
  action: 'created' | 'updated' | 'deleted',
  project: { 
    id: string; 
    title: string; 
    artistName?: string;
    artistId?: string;
  },
  changes?: { old: Record<string, any>; new: Record<string, any> }
) => {
  const projectTitle = project.artistName ? `${project.title} - ${project.artistName}` : project.title;
  const description = buildDetailedDescription(action, 'project', projectTitle, changes);

  await logActivity({
    user_id: userId,
    action_type: `project_${action}`,
    entity_type: 'project',
    entity_id: project.id,
    entity_title: projectTitle,
    artist_id: project.artistId,
    artist_name: project.artistName,
    description,
    old_values: changes?.old,
    new_values: changes?.new,
  });
};

export const logSortieActivity = async (
  userId: string,
  action: 'created' | 'updated' | 'deleted',
  sortie: { 
    id: string; 
    title: string;
    projectId?: string;
    projectTitle?: string;
    artistId?: string;
    artistName?: string;
  },
  changes?: { old: Record<string, any>; new: Record<string, any> }
) => {
  const description = buildDetailedDescription(action, 'sortie', sortie.title, changes);

  await logActivity({
    user_id: userId,
    action_type: `sortie_${action}`,
    entity_type: 'sortie',
    entity_id: sortie.id,
    entity_title: sortie.title,
    project_id: sortie.projectId,
    project_title: sortie.projectTitle,
    artist_id: sortie.artistId,
    artist_name: sortie.artistName,
    description,
    old_values: changes?.old,
    new_values: changes?.new,
  });
};

export const logMeetingActivity = async (
  userId: string,
  action: 'created' | 'updated' | 'deleted',
  meeting: { 
    id: string; 
    title: string;
    projectId?: string;
    projectTitle?: string;
  },
  changes?: { old: Record<string, any>; new: Record<string, any> }
) => {
  const description = buildDetailedDescription(action, 'meeting', meeting.title, changes);

  await logActivity({
    user_id: userId,
    action_type: `meeting_${action}`,
    entity_type: 'meeting',
    entity_id: meeting.id,
    entity_title: meeting.title,
    project_id: meeting.projectId,
    project_title: meeting.projectTitle,
    description,
    old_values: changes?.old,
    new_values: changes?.new,
  });
};

export const logTaskActivity = async (
  userId: string,
  action: 'created' | 'updated' | 'deleted',
  task: { 
    id: string; 
    title: string;
    projectId?: string;
    projectTitle?: string;
    artistId?: string;
    artistName?: string;
  },
  changes?: { old: Record<string, any>; new: Record<string, any> }
) => {
  const description = buildDetailedDescription(action, 'task', task.title, changes);

  await logActivity({
    user_id: userId,
    action_type: `task_${action}`,
    entity_type: 'task',
    entity_id: task.id,
    entity_title: task.title,
    project_id: task.projectId,
    project_title: task.projectTitle,
    artist_id: task.artistId,
    artist_name: task.artistName,
    description,
    old_values: changes?.old,
    new_values: changes?.new,
  });
};

export const logArtistActivity = async (
  userId: string,
  action: 'created' | 'updated',
  artist: { id: string; name: string },
  changes?: { old: Record<string, any>; new: Record<string, any> }
) => {
  const description = buildDetailedDescription(action, 'artist', artist.name, changes);

  await logActivity({
    user_id: userId,
    action_type: `artist_${action}`,
    entity_type: 'artist',
    entity_id: artist.id,
    entity_title: artist.name,
    description,
    old_values: changes?.old,
    new_values: changes?.new,
  });
};
