import { useState, useEffect } from 'react';
import { supabase, handleSupabaseError } from '../lib/supabase';

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
  source?: 'sortie' | 'project'; // To distinguish where the sortie came from
}

export const useSorties = () => {
  const [sorties, setSorties] = useState<Sortie[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
          artist:artists(stage_name)
        `)
        .not('release_date', 'is', null)
        .order('release_date', { ascending: true });

      if (projectsError) throw projectsError;

      // Convert projects to sortie format
      const projectSorties: Sortie[] = (projectsData || []).map((proj: any) => ({
        id: proj.id,
        title: proj.title,
        release_date: proj.release_date,
        project_id: proj.id,
        cover_url: proj.cover_url,
        description: proj.artist?.stage_name || '',
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

      return data[0];
    } catch (err: any) {
      throw new Error(handleSupabaseError(err));
    }
  };

  const updateSortie = async (id: string, sortieData: Partial<Sortie>, coverFile?: File) => {
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

      return data[0];
    } catch (err: any) {
      throw new Error(handleSupabaseError(err));
    }
  };

  const deleteSortie = async (id: string) => {
    try {
      const { error } = await supabase
        .from('sorties')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setSorties(sorties.filter((s) => s.id !== id));
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
