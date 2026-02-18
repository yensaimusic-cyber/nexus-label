import { supabase } from './supabase';

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

// Helper functions for common activities
export const logProjectActivity = async (
  userId: string,
  action: 'created' | 'updated' | 'deleted',
  project: { id: string; title: string },
  changes?: { old: Record<string, any>; new: Record<string, any> }
) => {
  const descriptions: Record<string, string> = {
    created: `Nouveau projet créé: ${project.title}`,
    updated: `Projet mis à jour: ${project.title}`,
    deleted: `Projet supprimé: ${project.title}`,
  };

  await logActivity({
    user_id: userId,
    action_type: `project_${action}`,
    entity_type: 'project',
    entity_id: project.id,
    entity_title: project.title,
    description: descriptions[action],
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
  const descriptions: Record<string, string> = {
    created: `Nouvelle sortie créée: ${sortie.title}`,
    updated: `Sortie mise à jour: ${sortie.title}`,
    deleted: `Sortie supprimée: ${sortie.title}`,
  };

  await logActivity({
    user_id: userId,
    action_type: `sortie_${action}`,
    entity_type: 'sortie',
    entity_id: sortie.id,
    entity_title: sortie.title,
    description: descriptions[action],
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
  const descriptions: Record<string, string> = {
    created: `Réunion créée: ${meeting.title}`,
    updated: `Réunion mise à jour: ${meeting.title}`,
    deleted: `Réunion supprimée: ${meeting.title}`,
  };

  await logActivity({
    user_id: userId,
    action_type: `meeting_${action}`,
    entity_type: 'meeting',
    entity_id: meeting.id,
    entity_title: meeting.title,
    description: descriptions[action],
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
  const descriptions: Record<string, string> = {
    created: `Tâche créée: ${task.title}`,
    updated: `Tâche mise à jour: ${task.title}`,
    deleted: `Tâche supprimée: ${task.title}`,
  };

  await logActivity({
    user_id: userId,
    action_type: `task_${action}`,
    entity_type: 'task',
    entity_id: task.id,
    entity_title: task.title,
    description: descriptions[action],
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
  const descriptions: Record<string, string> = {
    created: `Artiste créé: ${artist.name}`,
    updated: `Artiste mis à jour: ${artist.name}`,
  };

  await logActivity({
    user_id: userId,
    action_type: `artist_${action}`,
    entity_type: 'artist',
    entity_id: artist.id,
    entity_title: artist.name,
    description: descriptions[action],
    old_values: changes?.old,
    new_values: changes?.new,
  });
};
