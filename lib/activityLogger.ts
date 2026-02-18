import { supabase } from './supabase';
import { formatDate } from './utils';

export interface ActivityLogPayload {
  user_id: string;
  action_type: string;
  entity_type: string;
  entity_id: string;
  entity_title: string;
  description: string;
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
    return `${field === 'date' ? 'Date' : 'Date de sortie'} modifiée: ${formatDate(oldValue)} → ${formatDate(newValue)}`;
  } else if (field === 'status') {
    const statusLabels: Record<string, string> = {
      'idea': 'Idée',
      'pre_production': 'Pré-production',
      'production': 'Production',
      'post_production': 'Post-production',
      'release': 'Sortie',
      'released': 'Publiée',
      'planned': 'Planifiée',
      'cancelled': 'Annulée',
    };
    return `Statut modifié: ${statusLabels[oldValue] || oldValue} → ${statusLabels[newValue] || newValue}`;
  } else if (field === 'title') {
    return `Titre modifié: "${oldValue}" → "${newValue}"`;
  }
  return `${field} modifié: ${oldValue} → ${newValue}`;
};

// Helper function to build detailed description from multiple changes
export const buildDetailedDescription = (
  action: 'created' | 'updated' | 'deleted',
  entity: string,
  title: string,
  changes?: { old: Record<string, any>; new: Record<string, any> }
): string => {
  const actionMap = {
    created: 'créé',
    updated: 'modifié',
    deleted: 'supprimé',
  };

  const entityMap: Record<string, string> = {
    project: 'Projet',
    sortie: 'Sortie',
    meeting: 'Réunion',
    task: 'Tâche',
    artist: 'Artiste',
  };

  let description = `${entityMap[entity] || entity} ${actionMap[action]}: ${title}`;

  // Add change details if available
  if (changes && changes.old && changes.new) {
    const changedFields = Object.keys(changes.new).filter(
      (key) => changes.old[key] !== changes.new[key]
    );

    if (changedFields.length > 0) {
      const changeDetails = changedFields
        .map((field) => createChangeDescription(field, changes.old[field], changes.new[field]))
        .join(' | ');
      description += ` (${changeDetails})`;
    }
  }

  return description;
};

// Helper functions for common activities
export const logProjectActivity = async (
  userId: string,
  action: 'created' | 'updated' | 'deleted',
  project: { id: string; title: string },
  changes?: { old: Record<string, any>; new: Record<string, any> }
) => {
  const description = buildDetailedDescription(action, 'project', project.title, changes);

  await logActivity({
    user_id: userId,
    action_type: `project_${action}`,
    entity_type: 'project',
    entity_id: project.id,
    entity_title: project.title,
    description,
    old_values: changes?.old,
    new_values: changes?.new,
  });
};

export const logSortieActivity = async (
  userId: string,
  action: 'created' | 'updated' | 'deleted',
  sortie: { id: string; title: string },
  changes?: { old: Record<string, any>; new: Record<string, any> }
) => {
  const description = buildDetailedDescription(action, 'sortie', sortie.title, changes);

  await logActivity({
    user_id: userId,
    action_type: `sortie_${action}`,
    entity_type: 'sortie',
    entity_id: sortie.id,
    entity_title: sortie.title,
    description,
    old_values: changes?.old,
    new_values: changes?.new,
  });
};

export const logMeetingActivity = async (
  userId: string,
  action: 'created' | 'updated' | 'deleted',
  meeting: { id: string; title: string },
  changes?: { old: Record<string, any>; new: Record<string, any> }
) => {
  const description = buildDetailedDescription(action, 'meeting', meeting.title, changes);

  await logActivity({
    user_id: userId,
    action_type: `meeting_${action}`,
    entity_type: 'meeting',
    entity_id: meeting.id,
    entity_title: meeting.title,
    description,
    old_values: changes?.old,
    new_values: changes?.new,
  });
};

export const logTaskActivity = async (
  userId: string,
  action: 'created' | 'updated' | 'deleted',
  task: { id: string; title: string },
  changes?: { old: Record<string, any>; new: Record<string, any> }
) => {
  const description = buildDetailedDescription(action, 'task', task.title, changes);

  await logActivity({
    user_id: userId,
    action_type: `task_${action}`,
    entity_type: 'task',
    entity_id: task.id,
    entity_title: task.title,
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
