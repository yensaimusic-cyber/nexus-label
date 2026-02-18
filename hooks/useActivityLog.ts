import { useState, useEffect } from 'react';
import { supabase, handleSupabaseError } from '../lib/supabase';
import { useAuth } from './useAuth';

export interface ActivityLogEntry {
  id: string;
  user_id: string;
  action_type: string;
  entity_type: string;
  entity_id: string;
  entity_title: string;
  description: string;
  old_values?: Record<string, any>;
  new_values?: Record<string, any>;
  created_at: string;
  user?: {
    full_name: string;
    avatar_url: string;
  };
}

export const useActivityLog = (limit: number = 100) => {
  const [activities, setActivities] = useState<ActivityLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    fetchActivities();
    subscribeToActivities();
  }, [user]);

  const fetchActivities = async () => {
    try {
      setLoading(true);
      const { data, error: err } = await supabase
        .from('activity_log')
        .select(
          `
          *,
          user:user_id(full_name, avatar_url)
          `
        )
        .order('created_at', { ascending: false })
        .limit(limit);

      if (err) throw err;

      setActivities(data || []);
      setError(null);
    } catch (err) {
      const message = handleSupabaseError(err);
      setError(message);
      console.error('Error fetching activities:', message);
    } finally {
      setLoading(false);
    }
  };

  const subscribeToActivities = () => {
    const channel = supabase
      .channel('activity_log_changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'activity_log',
        },
        (payload: any) => {
          const newActivity = payload.new as ActivityLogEntry;
          setActivities((prev) => [newActivity, ...prev].slice(0, limit));
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  };

  return { activities, loading, error, refetch: fetchActivities };
};
