import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';

type AppRole = 'admin' | 'viewer';
const BOOTSTRAP_ADMIN_EMAILS = [
  'boutuil.fahd99@outlook.fr',
  'nath.godfirnon@gmail.com',
  'yensai.music@gmail.com'
];

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
        const primaryRes = await supabase
          .from('profiles')
          .select('auth_role')
          .eq('id', user.id)
          .limit(1);

        if (primaryRes.error) throw primaryRes.error;

        let rawRole = primaryRes.data?.[0]?.auth_role ?? null;

        if (!rawRole) {
          const email = String(user.email || '').toLowerCase();
          const bootstrapRole: AppRole = BOOTSTRAP_ADMIN_EMAILS.includes(email) ? 'admin' : 'viewer';
          const upsertPayload: Record<string, any> = {
            id: user.id,
            auth_role: bootstrapRole,
            email: user.email || null,
            full_name: user.user_metadata?.full_name || user.email || null
          };

          const upsertRes = await supabase
            .from('profiles')
            .upsert(upsertPayload)
            .select('auth_role')
            .limit(1);

          if (upsertRes.error) throw upsertRes.error;
          rawRole = upsertRes.data?.[0]?.auth_role ?? bootstrapRole;
        }

        const roleValue = Array.isArray(rawRole) ? rawRole[0] : rawRole;
        const normalizedRole = String(roleValue || '').toLowerCase() === 'admin' ? 'admin' : 'viewer';
        console.log('[useRole] profile auth_role lookup', {
          userId: user.id,
          rawRole,
          normalizedRole
        });
        if (isActive) {
          setRole(normalizedRole);
          setError(null);
        }
      } catch (err: any) {
        console.warn('[useRole] role lookup failed', { userId: user.id, error: err?.message || err });
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
