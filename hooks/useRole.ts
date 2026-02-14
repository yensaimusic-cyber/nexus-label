import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';

type AppRole = 'admin' | 'viewer';

export const useRole = () => {
  const { user, loading: authLoading } = useAuth();
  const [role, setRole] = useState<AppRole>('viewer');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;

    const fetchRole = async () => {
      if (authLoading) return;
      if (!user) {
        if (isActive) {
          setRole('viewer');
          setLoading(false);
          setError(null);
        }
        return;
      }

      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();

        if (error) throw error;

        const normalizedRole = data?.role === 'admin' ? 'admin' : 'viewer';
        if (isActive) {
          setRole(normalizedRole);
          setError(null);
        }
      } catch (err: any) {
        if (isActive) {
          setRole('viewer');
          setError(err?.message || 'Unable to fetch role.');
        }
      } finally {
        if (isActive) setLoading(false);
      }
    };

    fetchRole();

    return () => {
      isActive = false;
    };
  }, [authLoading, user]);

  return { role, loading, error };
};
