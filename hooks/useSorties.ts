import { useState, useEffect } from 'react';
import { supabase, handleSupabaseError } from '../lib/supabase';
import { logSortieActivity } from '../lib/activityLogger';
import { useAuth } from './useAuth';

export interface Sortie {
  id: string;
  title: string;
  release_date: string; // DATE in SQL
  project_id: string | null;
  description?: string;
  cover_url?: string;
  platforms?: string[];
  spotify_url?: string;
  status: 'planned' | 'released' | 'cancelled';
  created_at: string;
  updated_at: string;
  project?: {
    id: string;
    title: string;
    cover_url?: string;
  };
  artist_name?: string;
  manager_name?: string;
  source?: 'sortie' | 'project'; // To distinguish where the sortie came from
}

export const useSorties = () => {
  const [sorties, setSorties] = useState<Sortie[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchSorties = async () => {
    try {
      setLoading(true);

      // Fetch explicit sorties
      const { data: sortiesData, error: sortiesError } = await supabase
        .from('sorties')
        .select(`
          *,
          project:projects(id, title, cover_url)
        `)
        .order('release_date', { ascending: true });

      if (sortiesError) throw sortiesError;

      // Fetch projects with release dates
      const { data: projectsData, error: projectsError } = await supabase
        .from('projects')
        .select(`
          id,
          title,
          cover_url,
          release_date,
          status,
          artist:artists(stage_name, id)
        `)
        .not('release_date', 'is', null)
        .order('release_date', { ascending: true });

      if (projectsError) throw projectsError;

      // Get managers for all artists (we'll fetch them separately to get the manager names)
      const artistIds = (projectsData || [])
        .map((p: any) => p.artist?.id)
        .filter(Boolean);

      let managerMap: Record<string, string> = {};
      if (artistIds.length > 0) {
        const { data: teamMembersData } = await supabase
          .from('artist_team_members')
          .select(`
            artist_id,
            name,
            profile_id,
            member_type
          `)
          .in('artist_id', artistIds);

        // Build a map to get profile_ids
        const profileIds: string[] = [];
        if (teamMembersData) {
          for (const member of teamMembersData) {
            if (member.member_type === 'external' && member.name) {
              // External manager - use directly
              if (!managerMap[member.artist_id]) {
                managerMap[member.artist_id] = member.name;
              }
            } else if (member.member_type === 'internal' && member.profile_id) {
              // Internal manager - fetch profile info
              profileIds.push(member.profile_id);
            }
          }
        }

        // Fetch profiles for internal managers
        if (profileIds.length > 0) {
          const { data: profilesData } = await supabase
            .from('profiles')
            .select('id, full_name')
            .in('id', profileIds);

          if (profilesData && teamMembersData) {
            for (const member of teamMembersData) {
              if (member.member_type === 'internal' && member.profile_id) {
                const profile = profilesData.find((p: any) => p.id === member.profile_id);
                if (profile?.full_name && !managerMap[member.artist_id]) {
                  managerMap[member.artist_id] = profile.full_name;
                }
              }
            }
          }
        }
      }

      // Convert projects to sortie format
      const projectSorties: Sortie[] = (projectsData || []).map((proj: any) => ({
        id: proj.id,
        title: proj.title,
        release_date: proj.release_date,
        project_id: proj.id,
        cover_url: proj.cover_url,
        description: proj.artist?.stage_name || '',
        artist_name: proj.artist?.stage_name || '',
        manager_name: managerMap[proj.artist?.id] || '',
        status: proj.status === 'released' ? 'released' : 'planned',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        source: 'project',
      }));

      // Merge and sort all sorties by release date
      const allSorties = [...(sortiesData || []).map(s => ({ ...s, source: 'sortie' as const })), ...projectSorties]
        .sort((a, b) => new Date(a.release_date).getTime() - new Date(b.release_date).getTime());

      setSorties(allSorties);
    } catch (err: any) {
      setError(handleSupabaseError(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSorties();

    // Subscribe to real-time updates
    const subscription = supabase
      .channel('sorties-projects')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'sorties' },
        () => {
          fetchSorties();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'projects' },
        () => {
          fetchSorties();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'artist_team_members' },
        () => {
          fetchSorties();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const addSortie = async (sortieData: Partial<Sortie>, coverFile?: File) => {
    try {
      let coverUrl = sortieData.cover_url;

      // Upload cover if provided
      if (coverFile) {
        const fileExt = coverFile.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `sortie-covers/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(filePath, coverFile);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('avatars')
          .getPublicUrl(filePath);

        coverUrl = publicUrl;
      }

      const { data, error } = await supabase
        .from('sorties')
        .insert([
          {
            ...sortieData,
            cover_url: coverUrl,
            updated_at: new Date().toISOString(),
          },
        ])
        .select();

      if (error) throw error;

      setSorties([...sorties, { ...data[0], source: 'sortie' }].sort((a, b) => 
        new Date(a.release_date).getTime() - new Date(b.release_date).getTime()
      ));

      // Log activity
      if (user) {
        await logSortieActivity(user.id, 'created', {
          id: data[0].id,
          title: data[0].title,
        });
      }

      return data[0];
    } catch (err: any) {
      throw new Error(handleSupabaseError(err));
    }
  };

  const updateSortie = async (id: string, sortieData: Partial<Sortie>, coverFile?: File) => {
    try {
      // Get old sortie data for logging
      const oldSortie = sorties.find((s) => s.id === id);
      
      let coverUrl = sortieData.cover_url;

      // Upload cover if provided
      if (coverFile) {
        const fileExt = coverFile.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `sortie-covers/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(filePath, coverFile);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('avatars')
          .getPublicUrl(filePath);

        coverUrl = publicUrl;
      }

      const { data, error } = await supabase
        .from('sorties')
        .update({
          ...sortieData,
          cover_url: coverUrl,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select();

      if (error) throw error;

      setSorties(
        sorties.map((s) => (s.id === id ? { ...data[0], source: 'sortie' } : s)).sort((a, b) =>
          new Date(a.release_date).getTime() - new Date(b.release_date).getTime()
        )
      );

      // Log activity with detailed changes
      if (user && oldSortie) {
        await logSortieActivity(user.id, 'updated', {
          id: data[0].id,
          title: data[0].title,
        }, {
          old: {
            release_date: oldSortie.release_date,
            status: oldSortie.status,
            title: oldSortie.title,
          },
          new: {
            release_date: data[0].release_date,
            status: data[0].status,
            title: data[0].title,
          },
        });
      }

      return data[0];
    } catch (err: any) {
      throw new Error(handleSupabaseError(err));
    }
  };

  const deleteSortie = async (id: string) => {
    try {
      // Get sortie data before deletion for logging
      const sortieToDelete = sorties.find((s) => s.id === id);

      const { error } = await supabase
        .from('sorties')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setSorties(sorties.filter((s) => s.id !== id));

      // Log activity
      if (user && sortieToDelete) {
        await logSortieActivity(user.id, 'deleted', {
          id: sortieToDelete.id,
          title: sortieToDelete.title,
        });
      }
    } catch (err: any) {
      throw new Error(handleSupabaseError(err));
    }
  };

  return {
    sorties,
    loading,
    error,
    fetchSorties,
    addSortie,
    updateSortie,
    deleteSortie,
  };
};
